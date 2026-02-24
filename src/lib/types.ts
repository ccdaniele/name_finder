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
  details: string;
  similarCompanies: string[];
  aiAssessment: string;
}

export interface DomainResult {
  available: boolean;
  domain: string;
  price?: string;
  currency?: string;
  source: "rdap" | "godaddy" | "unknown";
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
  conflicts: TrademarkConflict[];
  riskLevel: "low" | "medium" | "high";
}

export interface TrademarkabilityScore {
  overall: number;
  breakdown: {
    distinctiveness: number;
    conflictRisk: number;
    registrability: number;
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
