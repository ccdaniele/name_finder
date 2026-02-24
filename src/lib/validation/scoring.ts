import { generateObject } from "ai";
import { model } from "@/lib/ai/client";
import { AiScoreAdjustmentSchema } from "@/lib/ai/schemas";
import { buildAiScoreAdjustmentPrompt } from "@/lib/ai/prompts";
import type {
  TrademarkabilityScore,
  TrademarkResult,
  WebSearchResult,
} from "@/lib/types";

const DISTINCTIVENESS_SCORES: Record<string, number> = {
  fanciful: 95,
  arbitrary: 85,
  suggestive: 70,
  descriptive: 30,
  generic: 0,
};

function computeDistinctivenessScore(category: string): number {
  return DISTINCTIVENESS_SCORES[category] ?? 50;
}

function computeConflictRiskScore(trademarkResult: TrademarkResult): number {
  const conflictCount = trademarkResult.conflicts.length;
  const maxSimilarity = Math.max(
    0,
    ...trademarkResult.conflicts.map((c) => c.similarityScore)
  );
  const hasClassOverlap = trademarkResult.conflicts.some(
    (c) => c.overlappingClasses
  );

  let score = 100;
  score -= conflictCount * 15;
  score -= maxSimilarity * 40;
  if (hasClassOverlap) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function computeRegistrabilityScore(
  name: string,
  webSearchResult: WebSearchResult,
  trademarkResult: TrademarkResult
): number {
  let score = 80;

  if (name.length <= 8) score += 5;
  if (name.length <= 5) score += 5;

  score -= webSearchResult.similarCompanies.length * 10;

  if (trademarkResult.conflicts.length === 0) score += 10;

  return Math.max(0, Math.min(100, score));
}

function getGrade(overall: number): "A" | "B" | "C" | "D" | "F" {
  if (overall >= 85) return "A";
  if (overall >= 70) return "B";
  if (overall >= 55) return "C";
  if (overall >= 40) return "D";
  return "F";
}

function generateReport(
  name: string,
  category: string,
  grade: string,
  scores: { distinctiveness: number; conflictRisk: number; registrability: number },
  aiReasoning: string
): string {
  const parts: string[] = [];

  if (scores.distinctiveness >= 85) {
    parts.push(
      `"${name}" is a ${category} name, providing strong inherent trademark protection.`
    );
  } else if (scores.distinctiveness >= 70) {
    parts.push(
      `"${name}" is a ${category} name, offering good inherent distinctiveness.`
    );
  } else {
    parts.push(
      `"${name}" is a ${category} name with moderate inherent distinctiveness.`
    );
  }

  if (scores.conflictRisk >= 80) {
    parts.push("No significant trademark conflicts were identified.");
  } else if (scores.conflictRisk >= 50) {
    parts.push(
      "Some potentially similar marks exist but do not appear to pose a blocking conflict."
    );
  } else {
    parts.push(
      "There are trademark conflicts that may require further professional analysis."
    );
  }

  if (aiReasoning) {
    parts.push(aiReasoning);
  }

  parts.push(`Overall grade: ${grade}.`);

  return parts.join(" ");
}

export async function computeTrademarkabilityScore(
  name: string,
  distinctivenessCategory: string,
  trademarkResult: TrademarkResult,
  webSearchResult: WebSearchResult,
  domainAvailable: boolean
): Promise<TrademarkabilityScore> {
  const distinctiveness = computeDistinctivenessScore(distinctivenessCategory);
  const conflictRisk = computeConflictRiskScore(trademarkResult);
  const registrability = computeRegistrabilityScore(
    name,
    webSearchResult,
    trademarkResult
  );

  const algorithmicScore = Math.round(
    distinctiveness * 0.35 + conflictRisk * 0.35 + registrability * 0.3
  );

  // Get AI adjustment
  let aiAdjustment = 0;
  let aiReasoning = "";

  try {
    const { object } = await generateObject({
      model,
      schema: AiScoreAdjustmentSchema,
      prompt: buildAiScoreAdjustmentPrompt(
        name,
        algorithmicScore,
        distinctivenessCategory,
        trademarkResult.conflicts.length,
        webSearchResult.details,
        domainAvailable
      ),
    });
    aiAdjustment = object.adjustment;
    aiReasoning = object.reasoning;
  } catch (error) {
    console.error(`AI score adjustment failed for "${name}":`, error);
  }

  const overall = Math.max(
    0,
    Math.min(100, algorithmicScore + aiAdjustment)
  );
  const grade = getGrade(overall);

  return {
    overall,
    breakdown: { distinctiveness, conflictRisk, registrability },
    aiAdjustment,
    grade,
    report: generateReport(
      name,
      distinctivenessCategory,
      grade,
      { distinctiveness, conflictRisk, registrability },
      aiReasoning
    ),
  };
}
