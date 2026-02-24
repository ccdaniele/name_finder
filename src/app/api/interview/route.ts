import { streamText } from "ai";
import { model } from "@/lib/ai/client";
import { buildInterviewSystemPrompt } from "@/lib/ai/prompts";
import type { PreferenceSummary } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const {
      preferenceSummary,
      messages,
    }: {
      preferenceSummary: PreferenceSummary;
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    } = await req.json();

    const systemPrompt = buildInterviewSystemPrompt(preferenceSummary);

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Interview error:", error);
    return Response.json(
      { error: "Interview failed" },
      { status: 500 }
    );
  }
}
