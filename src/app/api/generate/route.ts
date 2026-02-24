import { generateObject } from "ai";
import { z } from "zod";
import { model } from "@/lib/ai/client";
import { GeneratedNameSchema } from "@/lib/ai/schemas";
import { buildGenerationPrompt, buildReplacementPrompt } from "@/lib/ai/prompts";
import type { PreferenceSummary } from "@/lib/types";

type GeneratedName = z.infer<typeof GeneratedNameSchema>;
const namesSchema = z.array(GeneratedNameSchema);

async function generateBatch(prompt: string): Promise<GeneratedName[]> {
  try {
    const { object: result } = await generateObject({
      model,
      schema: z.object({ names: namesSchema }),
      prompt,
      maxTokens: 16384,
    });

    return result.names;
  } catch (genError) {
    // Handle partial or malformed responses
    if (genError && typeof genError === "object" && "value" in genError) {
      const value = (genError as { value?: { names?: unknown } }).value;

      // Case 1: names returned as a JSON string instead of array
      if (value?.names && typeof value.names === "string") {
        try {
          const parsed = JSON.parse(value.names);
          return namesSchema.parse(parsed);
        } catch {
          // Fall through
        }
      }

      // Case 2: names is an array but has some invalid entries (partial response)
      if (value?.names && Array.isArray(value.names)) {
        const valid = value.names.filter((n: unknown) => {
          try {
            GeneratedNameSchema.parse(n);
            return true;
          } catch {
            return false;
          }
        }) as GeneratedName[];

        if (valid.length > 0) return valid;
      }
    }

    throw genError;
  }
}

export async function POST(req: Request) {
  try {
    const {
      preferenceSummary,
      interviewInsights,
      count,
      isReplacement,
      failedNames,
      existingNames,
      exclusionNames,
    }: {
      preferenceSummary: PreferenceSummary;
      interviewInsights: string;
      count: number;
      isReplacement?: boolean;
      failedNames?: Array<{ name: string; reason: string }>;
      existingNames?: string[];
      exclusionNames?: string[];
    } = await req.json();

    const prompt = isReplacement
      ? buildReplacementPrompt(
          preferenceSummary,
          interviewInsights,
          failedNames || [],
          existingNames || [],
          count,
          exclusionNames
        )
      : buildGenerationPrompt(preferenceSummary, interviewInsights, count, exclusionNames);

    // Split large requests into batches to avoid hitting output token limits
    const BATCH_SIZE = 10;
    if (count > BATCH_SIZE && !isReplacement) {
      const allNames: GeneratedName[] = [];
      let remaining = count;

      while (remaining > 0) {
        const batchCount = Math.min(remaining, BATCH_SIZE);
        const batchPrompt = buildGenerationPrompt(
          preferenceSummary,
          interviewInsights,
          batchCount,
          exclusionNames
            ? [...exclusionNames, ...allNames.map((n) => n.name)]
            : allNames.length > 0
              ? allNames.map((n) => n.name)
              : undefined
        );

        const batchNames = await generateBatch(batchPrompt);
        allNames.push(...batchNames);
        remaining -= batchNames.length;

        // Safety: if a batch returns 0 names, stop to avoid infinite loop
        if (batchNames.length === 0) break;
      }

      return Response.json({ names: allNames });
    }

    const names = await generateBatch(prompt);
    return Response.json({ names });
  } catch (error) {
    console.error("Generation error:", error);
    return Response.json(
      { error: "Failed to generate names" },
      { status: 500 }
    );
  }
}
