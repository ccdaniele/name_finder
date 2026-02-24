import { generateObject } from "ai";
import { model } from "@/lib/ai/client";
import { PreferenceSummarySchema } from "@/lib/ai/schemas";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { parseDocument } from "@/lib/parsers/document-parser";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userText = formData.get("userText") as string;
    const file = formData.get("file") as File | null;

    if (!userText && !file) {
      return Response.json(
        { error: "Please provide text input or a file" },
        { status: 400 }
      );
    }

    let documentContent: string | undefined;

    if (file) {
      const buffer = await file.arrayBuffer();
      documentContent = await parseDocument(buffer, file.name);
    }

    const prompt = buildAnalysisPrompt(userText || "", documentContent);

    const { object } = await generateObject({
      model,
      schema: PreferenceSummarySchema,
      prompt,
    });

    return Response.json(object);
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json(
      { error: "Failed to analyze input" },
      { status: 500 }
    );
  }
}
