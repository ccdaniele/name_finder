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
} from "@/lib/types";

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
  onProgress?: (step: string) => void
): Promise<
  | { type: "passed"; result: ValidatedName }
  | { type: "failed"; result: FailedName }
> {
  const { name, distinctivenessCategory } = generated;

  // Step 1: Web search
  onProgress?.("web_search");
  const webSearch = await searchForSimilarCompanies(name, industry);

  if (!webSearch.passed) {
    return {
      type: "failed",
      result: {
        generated,
        validation: { webSearch },
        failureStep: "web_search",
        failureReason: `Similar company/brand found: ${webSearch.similarCompanies.join(", ")}`,
      },
    };
  }

  // Step 2: Domain check
  onProgress?.("domain");
  const domain = await checkDomainAvailability(name);

  if (!domain.available) {
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

  // Step 3: Trademark search
  onProgress?.("trademark");
  const trademark = await searchTrademarks(name, usptoClasses);

  if (!trademark.passed) {
    const topConflict = trademark.conflicts[0];
    return {
      type: "failed",
      result: {
        generated,
        validation: { webSearch, domain, trademark },
        failureStep: "trademark",
        failureReason: topConflict
          ? `Trademark conflict: "${topConflict.registeredName}" (similarity: ${(topConflict.similarityScore * 100).toFixed(0)}%)`
          : "Trademark conflicts found",
      },
    };
  }

  // Step 4: Compute trademarkability score
  onProgress?.("scoring");
  const trademarkabilityScore = await computeTrademarkabilityScore(
    name,
    distinctivenessCategory,
    trademark,
    webSearch,
    domain.available
  );

  const validationResult: ValidationResult = {
    name,
    webSearch,
    domain,
    trademark,
    trademarkabilityScore,
    overallPass: true,
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
