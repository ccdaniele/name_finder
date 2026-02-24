import { generateObject } from "ai";
import { z } from "zod";
import { model } from "@/lib/ai/client";
import { GeneratedNameSchema } from "@/lib/ai/schemas";
import { buildGenerationPrompt, buildReplacementPrompt } from "@/lib/ai/prompts";
import type { PreferenceSummary } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const {
      preferenceSummary,
      interviewInsights,
      count,
      isReplacement,
      failedNames,
      existingNames,
    }: {
      preferenceSummary: PreferenceSummary;
      interviewInsights: string;
      count: number;
      isReplacement?: boolean;
      failedNames?: Array<{ name: string; reason: string }>;
      existingNames?: string[];
    } = await req.json();

    const prompt = isReplacement
      ? buildReplacementPrompt(
          preferenceSummary,
          interviewInsights,
          failedNames || [],
          existingNames || [],
          count
        )
      : buildGenerationPrompt(preferenceSummary, interviewInsights, count);

    const { object: names } = await generateObject({
      model,
      schema: z.object({ names: z.array(GeneratedNameSchema) }),
      prompt,
    });

    return Response.json({ names: names.names });
  } catch (error) {
    console.error("Generation error:", error);
    return Response.json(
      { error: "Failed to generate names" },
      { status: 500 }
    );
  }
}
