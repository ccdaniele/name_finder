import type { PreferenceSummary } from "@/lib/types";

export function buildAnalysisPrompt(
  userText: string,
  documentContent?: string
): string {
  return `You are an expert brand naming strategist and trademark consultant with deep knowledge of:
- The Abercrombie spectrum of distinctiveness (Generic → Descriptive → Suggestive → Arbitrary → Fanciful)
- The SMILE framework (Suggestive, Memorable, Imagery, Legs, Emotional)
- USPTO trademark classification (Nice Classification system)
- Naming best practices for software and technology companies

Analyze the following user input about their company/product naming preferences. Extract and structure your analysis covering:

1. **Industry & positioning**: What industry/market is this for?
2. **Target audience**: Who are the end users/customers?
3. **Brand personality**: What attributes should the brand convey?
4. **Naming style recommendation**: Based on the input, what mix of naming styles (suggestive, arbitrary, fanciful) would work best? Explain why.
5. **Patterns to avoid**: Any sounds, styles, or approaches to steer away from.
6. **Desired tone**: What emotional register should the name hit?
7. **USPTO classes**: Determine which trademark classes apply. For software, consider:
   - Class 9 (downloadable software, apps, computer programs)
   - Class 42 (SaaS, cloud computing, technology services)
   - Class 35 (business services, e-commerce platforms)
   - Class 38 (telecommunications, messaging platforms)
   - Class 41 (education/entertainment services)
   Provide a clear rationale for each class selection.
8. **Key themes**: What concepts and ideas should be explored in name generation?

User input:
${userText}
${documentContent ? `\nAdditional context from uploaded documents:\n${documentContent}` : ""}`;
}

export function buildInterviewSystemPrompt(
  preferenceSummary: PreferenceSummary
): string {
  return `You are conducting a brand naming discovery interview. You have already analyzed the user's initial preferences:

${JSON.stringify(preferenceSummary, null, 2)}

Your goal is to deepen your understanding through 5-8 focused questions. Cover:
- Competitor landscape (what names exist in their space?)
- Phonetic preferences (hard vs. soft sounds, specific letters?)
- Cultural/language considerations (international audience? languages to avoid?)
- Naming taboos (what should we absolutely NOT do?)
- Abstract vs. concrete preferences (real words vs. invented?)
- Length and complexity preferences
- Emotional associations (what feelings should the name evoke?)

Ask ONE question at a time. Adapt based on the user's answers. Be conversational but efficient.

When you have gathered enough insights (after 5-8 exchanges), include [INTERVIEW_COMPLETE] in your response, followed by a structured summary of all new insights gained during the interview. Format the summary as a JSON object with these fields:
- competitorNames: string[]
- preferredSounds: string
- culturalConsiderations: string
- additionalThemes: string[]
- namingTaboos: string[]
- refinedTone: string
- summary: string`;
}

export function buildGenerationPrompt(
  preferenceSummary: PreferenceSummary,
  interviewInsights: string,
  count: number
): string {
  return `You are a world-class brand naming expert. Generate exactly ${count} unique brand name candidates.

## Context from Analysis
${JSON.stringify(preferenceSummary, null, 2)}

## Additional Insights from Interview
${interviewInsights}

## Requirements for Each Name

1. **Distinctiveness**: Each name MUST score as Suggestive, Arbitrary, or Fanciful on the Abercrombie spectrum. NEVER generate Generic or Descriptive names.

2. **SMILE Framework**: Each name should be:
   - Suggestive: Evokes something about the brand
   - Memorable: Creates associations with the familiar
   - Imagery: Triggers a visual in the mind
   - Legs: Lends itself to brand extensions
   - Emotional: Connects with people emotionally

3. **SCRATCH Avoidance**: No names with:
   - Spelling challenges or confusing spellings
   - Copycat resemblance to famous brands
   - Restrictive scope that limits growth
   - Annoying forced puns or gimmicks
   - Tame/generic blandness
   - Curse of knowledge (insider-only references)
   - Hard-to-pronounce combinations

4. **Domain Viability**: Names should work as .com domains — single words or natural compounds, no hyphens, no special characters, ideally under 12 characters.

5. **Diversity**: Generate a mix of naming styles as recommended in the analysis. Include a variety of approaches — some coined words, some evocative real words, some creative compounds.

6. **Pronounceability**: Each name must be easy to say aloud and spell after hearing it once.

For each name provide:
- The name itself (clean, no punctuation)
- Clear rationale connecting it to the brand vision
- Its distinctiveness category (suggestive, arbitrary, or fanciful)
- How it specifically relates to the user's inputs
- Linguistic notes (etymology, phonetics, syllable count, multilingual notes)`;
}

export function buildReplacementPrompt(
  preferenceSummary: PreferenceSummary,
  interviewInsights: string,
  failedNames: Array<{ name: string; reason: string }>,
  existingNames: string[],
  count: number
): string {
  return `You are a world-class brand naming expert. Generate exactly ${count} replacement brand name candidates.

## Context
${JSON.stringify(preferenceSummary, null, 2)}

## Interview Insights
${interviewInsights}

## Previously Generated Names (do NOT repeat any of these)
${existingNames.join(", ")}

## Names That Failed Validation (avoid similar approaches)
${failedNames.map((f) => `- "${f.name}": ${f.reason}`).join("\n")}

## Requirements
Same requirements as before: Suggestive/Arbitrary/Fanciful on Abercrombie spectrum, SMILE framework, no SCRATCH pitfalls, domain-viable, pronounceable. Generate creative alternatives that avoid the same pitfalls as the failed names.`;
}

export function buildWebSearchAssessmentPrompt(
  candidateName: string,
  searchResults: string,
  industry: string
): string {
  return `You are a trademark clearance specialist assessing whether a proposed brand name conflicts with existing companies.

Proposed name: "${candidateName}"
Industry: ${industry}

Search results:
${searchResults}

Assess whether any search result represents a meaningful conflict. Consider:
1. Is there an exact name match with an existing company or brand?
2. Is there a very similar name (differing by one letter, similar pronunciation) in the same or adjacent industry?
3. Ignore unrelated uses — a person's name in an article, a common dictionary word used in a different context, small blogs, etc.
4. Focus on companies, brands, products, and services that could cause consumer confusion.

A conflict EXISTS if there is an existing company/brand/product with the same or very similar name in the technology, software, or closely related industry.
A conflict DOES NOT EXIST if the only matches are unrelated businesses, dictionary words in articles, or companies in completely different sectors (e.g., a restaurant with the same name as a proposed tech company).`;
}

export function buildAiScoreAdjustmentPrompt(
  name: string,
  algorithmicScore: number,
  distinctivenessCategory: string,
  trademarkConflicts: number,
  webSearchDetails: string,
  domainAvailable: boolean
): string {
  return `You are an IP scoring specialist. Review this trademark assessment and provide a qualitative adjustment.

Name: "${name}"
Algorithmic Score: ${algorithmicScore}/100
Distinctiveness Category: ${distinctivenessCategory}
Trademark Conflicts Found: ${trademarkConflicts}
Web Search Assessment: ${webSearchDetails}
Domain .com Available: ${domainAvailable}

Based on your expertise, provide a score adjustment between -10 and +10 points. Consider:
- Is the algorithmic score fairly reflecting the name's true trademarkability?
- Are there nuances the algorithm might miss (e.g., the name sounds like a common phrase, or it has unexpected strength)?
- Does the name have any qualitative trademark advantages or disadvantages not captured by the numbers?

Provide the adjustment and a brief 1-2 sentence reasoning.`;
}
