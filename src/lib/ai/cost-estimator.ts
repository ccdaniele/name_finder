import type { CostEstimate } from "@/lib/types";

const SONNET_INPUT_COST_PER_1K = 0.003;
const SONNET_OUTPUT_COST_PER_1K = 0.015;

export function estimateCosts(nameCount: number): CostEstimate {
  // Analysis: ~2K input, ~1K output
  const analysisInputTokens = 2000;
  const analysisOutputTokens = 1000;

  // Interview: ~8 exchanges, ~500 tokens each
  const interviewInputTokens = 8 * 800;
  const interviewOutputTokens = 8 * 500;

  // Generation: ~2K input, ~200 output per name
  const generationInputTokens = 2000 + nameCount * 50;
  const generationOutputTokens = nameCount * 200;

  // Validation AI calls (web search assessment + score adjustment): ~500 input, ~200 output per name
  // Assume ~30% failure rate requiring replacements
  const validationFactor = 1.3;
  const totalNamesToValidate = Math.ceil(nameCount * validationFactor);
  const validationInputTokens = totalNamesToValidate * 500;
  const validationOutputTokens = totalNamesToValidate * 200;

  // Replacement generation: ~1K input, ~200 output per replacement round
  const replacementRounds = Math.ceil(nameCount * 0.3);
  const replacementInputTokens = replacementRounds > 0 ? 2000 : 0;
  const replacementOutputTokens = replacementRounds * 200;

  const totalInputTokens =
    analysisInputTokens +
    interviewInputTokens +
    generationInputTokens +
    validationInputTokens +
    replacementInputTokens;

  const totalOutputTokens =
    analysisOutputTokens +
    interviewOutputTokens +
    generationOutputTokens +
    validationOutputTokens +
    replacementOutputTokens;

  const aiCost =
    (totalInputTokens / 1000) * SONNET_INPUT_COST_PER_1K +
    (totalOutputTokens / 1000) * SONNET_OUTPUT_COST_PER_1K;

  const webSearchCalls = totalNamesToValidate;
  const domainCheckCalls = totalNamesToValidate;
  const trademarkSearchCalls = totalNamesToValidate;

  return {
    aiTokens: {
      input: totalInputTokens,
      output: totalOutputTokens,
      cost: Math.round(aiCost * 100) / 100,
    },
    webSearchCalls,
    domainCheckCalls,
    trademarkSearchCalls,
    totalEstimatedCost: Math.round(aiCost * 100) / 100,
  };
}
