import { z } from "zod";

export const UsptoClassSchema = z.object({
  classNumber: z.number(),
  className: z.string(),
  rationale: z.string(),
});

export const PreferenceSummarySchema = z.object({
  industry: z.string().describe("The industry or market sector"),
  targetAudience: z.string().describe("Target audience description"),
  brandPersonality: z.array(z.string()).describe("Brand personality attributes"),
  namingStyleRecommendation: z
    .string()
    .describe(
      "Recommended mix of naming styles with rationale (e.g., 'Primarily fanciful with some suggestive names')"
    ),
  avoidPatterns: z
    .array(z.string())
    .describe("Patterns, sounds, or styles to avoid"),
  desiredTone: z.string().describe("Desired emotional tone of the name"),
  usptoClasses: z
    .array(UsptoClassSchema)
    .describe("Applicable USPTO trademark classes with rationale"),
  keyThemes: z
    .array(z.string())
    .describe("Key themes and concepts to explore in naming"),
  summary: z
    .string()
    .describe("A readable 2-3 paragraph summary of all preferences"),
});

export const GeneratedNameSchema = z.object({
  name: z.string().describe("The proposed brand name"),
  rationale: z
    .string()
    .describe("Why this name was created and how it connects to the brand"),
  distinctivenessCategory: z
    .enum(["suggestive", "arbitrary", "fanciful"])
    .describe("Position on the Abercrombie spectrum of distinctiveness"),
  relevanceToInput: z
    .string()
    .describe(
      "How this name specifically relates to the user's stated preferences"
    ),
  linguisticNotes: z
    .string()
    .describe(
      "Etymology, phonetic qualities, syllable count, multilingual considerations"
    ),
});

export const InterviewInsightsSchema = z.object({
  competitorNames: z
    .array(z.string())
    .describe("Competitor names mentioned by user"),
  preferredSounds: z
    .string()
    .describe("Preferred phonetic qualities or sounds"),
  culturalConsiderations: z
    .string()
    .describe("Any cultural or language considerations"),
  additionalThemes: z
    .array(z.string())
    .describe("New themes discovered during interview"),
  namingTaboos: z
    .array(z.string())
    .describe("Things the user specifically wants to avoid"),
  refinedTone: z.string().describe("Refined understanding of desired tone"),
  summary: z
    .string()
    .describe(
      "Comprehensive summary of all new insights from the interview"
    ),
});

export const AiScoreAdjustmentSchema = z.object({
  adjustment: z
    .number()
    .min(-10)
    .max(10)
    .describe("Score adjustment from -10 to +10"),
  reasoning: z.string().describe("Brief explanation of the adjustment"),
});

export const WebSearchAssessmentSchema = z.object({
  hasConflict: z
    .boolean()
    .describe(
      "Whether there is a meaningful conflict with an existing company/brand"
    ),
  assessment: z
    .string()
    .describe("Detailed assessment of the search results"),
  conflictingEntities: z
    .array(z.string())
    .describe("Names of conflicting companies/brands found"),
});
