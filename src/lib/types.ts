export interface PreferenceSummary {
  industry: string;
  targetAudience: string;
  brandPersonality: string[];
  namingStyleRecommendation: string;
  avoidPatterns: string[];
  desiredTone: string;
  usptoClasses: UsptoClass[];
  keyThemes: string[];
  summary: string;
}

export interface UsptoClass {
  classNumber: number;
  className: string;
  rationale: string;
}

export interface GeneratedName {
  name: string;
  rationale: string;
  distinctivenessCategory: "suggestive" | "arbitrary" | "fanciful";
  relevanceToInput: string;
  linguisticNotes: string;
}

export interface WebSearchResult {
  passed: boolean;
  score: number;
  details: string;
  similarCompanies: string[];
  aiAssessment: string;
  skipped?: boolean;
}

export interface DomainTldResult {
  tld: string;
  domain: string;
  available: boolean;
  price?: string;
  currency?: string;
  source: "rdap" | "godaddy" | "unknown";
}

export interface DomainResult {
  available: boolean;
  domain: string;
  price?: string;
  currency?: string;
  source: "rdap" | "godaddy" | "unknown";
  tldResults?: DomainTldResult[];
  skipped?: boolean;
}

export interface TrademarkConflict {
  registeredName: string;
  serialNumber: string;
  status: string;
  similarityScore: number;
  overlappingClasses: boolean;
  classNumbers?: number[];
}

export interface TrademarkResult {
  passed: boolean;
  score: number;
  conflicts: TrademarkConflict[];
  riskLevel: "low" | "medium" | "high";
  skipped?: boolean;
}

export interface TrademarkabilityScore {
  overall: number;
  breakdown: {
    distinctiveness: number;
    conflictRisk: number;
    registrability: number;
    webSearch: number;
    trademark: number;
  };
  aiAdjustment: number;
  grade: "A" | "B" | "C" | "D" | "F";
  report: string;
}

export interface ValidationResult {
  name: string;
  webSearch: WebSearchResult;
  domain: DomainResult;
  trademark: TrademarkResult;
  trademarkabilityScore: TrademarkabilityScore;
  overallPass: boolean;
  hasWarnings: boolean;
  failureReason?: string;
}

export interface ValidatedName {
  generated: GeneratedName;
  validation: ValidationResult;
}

export interface FailedName {
  generated: GeneratedName;
  validation: Partial<ValidationResult>;
  failureStep: "web_search" | "domain" | "trademark";
  failureReason: string;
}

export interface SessionData {
  id: string;
  createdAt: string;
  preferenceSummary?: PreferenceSummary;
  interviewInsights?: string;
  validatedNames: ValidatedName[];
  failedNames: FailedName[];
  requestedCount: number;
}

export interface CostEstimate {
  aiTokens: { input: number; output: number; cost: number };
  webSearchCalls: number;
  domainCheckCalls: number;
  trademarkSearchCalls: number;
  totalEstimatedCost: number;
}

export type WizardStep = "input" | "summary" | "interview" | "generation" | "results";

export interface SearchHistoryEntry {
  id: string;
  createdAt: string;
  preferenceSummary: PreferenceSummary;
  interviewInsights?: string;
  requestedCount: number;
  validatedNames: ValidatedName[];
  failedNames: FailedName[];
  stats: {
    totalGenerated: number;
    passedCount: number;
    failedCount: number;
    avgScore: number;
    topGrade: "A" | "B" | "C" | "D" | "F";
  };
}

export interface ExclusionEntry {
  name: string;
  source: "search-passed" | "search-failed" | "manual-import" | "manual-add";
  sourceSearchId?: string;
  addedAt: string;
}

export interface HistoryData {
  version: 1;
  searches: SearchHistoryEntry[];
  exclusionList: ExclusionEntry[];
}

export interface ExclusionListExport {
  version: 1;
  exportedAt: string;
  entries: ExclusionEntry[];
}

export interface ValidationStepConfig {
  enabled: boolean;
  canFail: boolean;
}

export interface ValidationConfig {
  webSearch: ValidationStepConfig;
  domain: ValidationStepConfig & { tlds: string[] };
  trademark: ValidationStepConfig;
}

export interface SavedSearch {
  id: string;
  createdAt: string;
  preferenceSummary: PreferenceSummary;
  interviewInsights?: string;
  validationConfig: ValidationConfig;
  nameCount: number;
}

export interface SavedSearchData {
  version: 1;
  searches: SavedSearch[];
}
