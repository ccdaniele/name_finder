import { generateObject } from "ai";
import { model } from "@/lib/ai/client";
import { WebSearchAssessmentSchema } from "@/lib/ai/schemas";
import { buildWebSearchAssessmentPrompt } from "@/lib/ai/prompts";
import { withRetry } from "@/lib/utils/retry";
import type { WebSearchResult } from "@/lib/types";

const SERPER_API_URL = "https://google.serper.dev/search";

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperResponse {
  organic?: SerperResult[];
  knowledgeGraph?: {
    title?: string;
    type?: string;
    description?: string;
  };
}

async function fetchSearchResults(name: string): Promise<SerperResponse> {
  const response = await withRetry(async () => {
    const res = await fetch(SERPER_API_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `"${name}" company OR brand OR startup OR software`,
        num: 10,
      }),
    });

    if (!res.ok) {
      const error = new Error(`Serper API error: ${res.status}`) as Error & {
        status: number;
      };
      error.status = res.status;
      throw error;
    }

    return res.json();
  });

  return response;
}

function formatSearchResultsForAI(data: SerperResponse): string {
  const parts: string[] = [];

  if (data.knowledgeGraph) {
    parts.push(
      `Knowledge Graph: ${data.knowledgeGraph.title} (${data.knowledgeGraph.type}) - ${data.knowledgeGraph.description}`
    );
  }

  if (data.organic) {
    for (const result of data.organic.slice(0, 10)) {
      parts.push(`[${result.position}] ${result.title}\n    ${result.snippet}`);
    }
  }

  return parts.join("\n\n") || "No results found.";
}

export async function searchForSimilarCompanies(
  name: string,
  industry: string
): Promise<WebSearchResult> {
  try {
    const data = await fetchSearchResults(name);
    const formattedResults = formatSearchResultsForAI(data);

    const { object: assessment } = await generateObject({
      model,
      schema: WebSearchAssessmentSchema,
      prompt: buildWebSearchAssessmentPrompt(name, formattedResults, industry),
    });

    return {
      passed: !assessment.hasConflict,
      details: assessment.assessment,
      similarCompanies: assessment.conflictingEntities,
      aiAssessment: assessment.assessment,
    };
  } catch (error) {
    console.error(`Web search failed for "${name}":`, error);
    return {
      passed: true,
      details: "Web search unavailable — skipped",
      similarCompanies: [],
      aiAssessment: "Web search could not be completed. Proceeding with caution.",
    };
  }
}
