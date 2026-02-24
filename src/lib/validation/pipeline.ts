import { searchForSimilarCompanies } from "./web-search";
import { checkDomainAvailability } from "./domain-check";
import { searchTrademarks } from "./trademark-search";
import { computeTrademarkabilityScore } from "./scoring";
import type {
  GeneratedName,
  ValidationResult,
  ValidatedName,
  FailedName,
  PreferenceSummary,
  ValidationConfig,
  WebSearchResult,
  DomainResult,
  TrademarkResult,
} from "@/lib/types";

const DEFAULT_CONFIG: ValidationConfig = {
  webSearch: { enabled: true, canFail: false },
  domain: { enabled: true, canFail: true, tlds: [".com"] },
  trademark: { enabled: true, canFail: false },
};

export type ValidationProgress = {
  currentName: string;
  currentStep: "web_search" | "domain" | "trademark" | "scoring" | "complete";
  totalNames: number;
  processedCount: number;
  passedCount: number;
  failedCount: number;
};

export type ProgressCallback = (progress: ValidationProgress) => void;

export async function validateSingleName(
  generated: GeneratedName,
  usptoClasses: number[],
  industry: string,
  validationConfig?: ValidationConfig,
  onProgress?: (step: string) => void
): Promise<
  | { type: "passed"; result: ValidatedName }
  | { type: "failed"; result: FailedName }
> {
  const config = validationConfig || DEFAULT_CONFIG;
  const { name, distinctivenessCategory } = generated;

  // Step 1: Web Search
  let webSearch: WebSearchResult;
  if (config.webSearch.enabled) {
    onProgress?.("web_search");
    webSearch = await searchForSimilarCompanies(name, industry);

    if (config.webSearch.canFail && !webSearch.passed) {
      return {
        type: "failed",
        result: {
          generated,
          validation: { webSearch },
          failureStep: "web_search",
          failureReason: `Web search found significant conflicts: ${webSearch.details}`,
        },
      };
    }
  } else {
    webSearch = {
      passed: true,
      score: 100,
      details: "Skipped",
      similarCompanies: [],
      aiAssessment: "Skipped",
      skipped: true,
    };
  }

  // Step 2: Domain Check
  let domain: DomainResult;
  if (config.domain.enabled) {
    onProgress?.("domain");
    domain = await checkDomainAvailability(name, config.domain.tlds);

    if (config.domain.canFail && !domain.available) {
      return {
        type: "failed",
        result: {
          generated,
          validation: { webSearch, domain },
          failureStep: "domain",
          failureReason: `Domain ${domain.domain} is not available`,
        },
      };
    }
  } else {
    domain = {
      available: true,
      domain: "",
      source: "unknown",
      skipped: true,
    };
  }

  // Step 3: Trademark Search
  let trademark: TrademarkResult;
  if (config.trademark.enabled) {
    onProgress?.("trademark");
    trademark = await searchTrademarks(name, usptoClasses);

    if (config.trademark.canFail && !trademark.passed) {
      const topConflict = trademark.conflicts[0];
      return {
        type: "failed",
        result: {
          generated,
          validation: { webSearch, domain, trademark },
          failureStep: "trademark",
          failureReason: topConflict
            ? `Severe trademark conflict: "${topConflict.registeredName}" (similarity: ${(topConflict.similarityScore * 100).toFixed(0)}%, class overlap)`
            : "Severe trademark conflicts found",
        },
      };
    }

    // When canFail=false, override: all informational
    if (!config.trademark.canFail) {
      trademark = { ...trademark, passed: true };
    }
  } else {
    trademark = {
      passed: true,
      score: 100,
      conflicts: [],
      riskLevel: "low",
      skipped: true,
    };
  }

  // Step 4: Compute trademarkability score (always runs for passing names)
  onProgress?.("scoring");
  const trademarkabilityScore = await computeTrademarkabilityScore(
    name,
    distinctivenessCategory,
    trademark,
    webSearch,
    domain.available
  );

  const hasWarnings =
    (!webSearch.skipped && webSearch.score < 100) ||
    (!trademark.skipped && trademark.riskLevel !== "low") ||
    (!domain.skipped && !domain.available);

  const validationResult: ValidationResult = {
    name,
    webSearch,
    domain,
    trademark,
    trademarkabilityScore,
    overallPass: true,
    hasWarnings,
  };

  return {
    type: "passed",
    result: { generated, validation: validationResult },
  };
}

export async function runValidationPipeline(
  names: GeneratedName[],
  preferenceSummary: PreferenceSummary,
  onProgress?: ProgressCallback
): Promise<{
  passed: ValidatedName[];
  failed: FailedName[];
}> {
  const usptoClasses = preferenceSummary.usptoClasses.map(
    (c) => c.classNumber
  );
  const passed: ValidatedName[] = [];
  const failed: FailedName[] = [];

  for (let i = 0; i < names.length; i++) {
    const generated = names[i];

    onProgress?.({
      currentName: generated.name,
      currentStep: "web_search",
      totalNames: names.length,
      processedCount: i,
      passedCount: passed.length,
      failedCount: failed.length,
    });

    const result = await validateSingleName(
      generated,
      usptoClasses,
      preferenceSummary.industry,
      undefined,
      (step) => {
        onProgress?.({
          currentName: generated.name,
          currentStep: step as ValidationProgress["currentStep"],
          totalNames: names.length,
          processedCount: i,
          passedCount: passed.length,
          failedCount: failed.length,
        });
      }
    );

    if (result.type === "passed") {
      passed.push(result.result);
    } else {
      failed.push(result.result);
    }

    onProgress?.({
      currentName: generated.name,
      currentStep: "complete",
      totalNames: names.length,
      processedCount: i + 1,
      passedCount: passed.length,
      failedCount: failed.length,
    });
  }

  return { passed, failed };
}
