"use client";

import { useState } from "react";
import { TrademarkScore } from "./TrademarkScore";
import type { ValidatedName } from "@/lib/types";

interface NameCardProps {
  validatedName: ValidatedName;
  rank: number;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  suggestive: "Suggestive",
  arbitrary: "Arbitrary",
  fanciful: "Fanciful",
};

function WarningIcon() {
  return (
    <svg
      className="w-4 h-4 text-yellow-500 flex-shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function NameCard({
  validatedName,
  rank,
  onRegenerate,
  isRegenerating,
}: NameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const { generated, validation } = validatedName;

  return (
    <div className="border border-[var(--border)] rounded-lg p-5 hover:border-[var(--muted-foreground)] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted-foreground)] font-mono">
            #{rank}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-semibold">{generated.name}</h3>
              {validation.hasWarnings && <WarningIcon />}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                {CATEGORY_LABELS[generated.distinctivenessCategory]}
              </span>
              {validation.domain.skipped ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Domain skipped
                </span>
              ) : validation.domain.available ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  {validation.domain.domain.split(".").pop()} available
                  {validation.domain.price && ` (${validation.domain.price})`}
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                  Domain unavailable
                </span>
              )}
              {validation.trademark.skipped ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  TM skipped
                </span>
              ) : (
                <>
                  {validation.trademark.riskLevel === "low" && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                      Low TM risk
                    </span>
                  )}
                  {validation.trademark.riskLevel === "medium" && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                      Medium TM risk
                    </span>
                  )}
                </>
              )}
              {validation.webSearch.skipped ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Web skipped
                </span>
              ) : (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Web: {validation.webSearch.score}
                </span>
              )}
              {!validation.trademark.skipped && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  TM: {validation.trademark.score}
                </span>
              )}
            </div>
          </div>
        </div>
        <TrademarkScore score={validation.trademarkabilityScore} compact />
      </div>

      <p className="text-sm text-[var(--muted-foreground)] mt-3">
        {validation.trademarkabilityScore.report}
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-2"
      >
        {expanded ? "Show less" : "Show details"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
              Why this name
            </h4>
            <p className="text-sm">{generated.rationale}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
              Relevance to your input
            </h4>
            <p className="text-sm">{generated.relevanceToInput}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
              Linguistic notes
            </h4>
            <p className="text-sm">{generated.linguisticNotes}</p>
          </div>

          <TrademarkScore score={validation.trademarkabilityScore} validation={validation} />

          {/* Web search section */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
              Web search {validation.webSearch.skipped ? "(Skipped)" : `(${validation.webSearch.score}/100)`}
            </h4>
            {validation.webSearch.skipped ? (
              <p className="text-sm text-[var(--muted-foreground)]">This step was skipped.</p>
            ) : (
              <>
                <p className="text-sm">{validation.webSearch.aiAssessment}</p>
                {validation.webSearch.similarCompanies.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {validation.webSearch.similarCompanies.map((company, i) => (
                      <div
                        key={i}
                        className="text-xs bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 rounded px-2 py-1.5"
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Domain section — per-TLD results */}
          {validation.domain.tldResults && validation.domain.tldResults.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
                Domain availability
              </h4>
              <div className="space-y-1">
                {validation.domain.tldResults.map((tld) => (
                  <div
                    key={tld.tld}
                    className={`text-xs rounded px-2 py-1.5 ${
                      tld.available
                        ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                    }`}
                  >
                    <span className="font-medium">{tld.domain}</span>
                    {" — "}
                    {tld.available ? "Available" : "Taken"}
                    {tld.available && tld.price && ` (${tld.price})`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trademark section */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
              Trademark search {validation.trademark.skipped ? "(Skipped)" : `(${validation.trademark.score}/100)`}
            </h4>
            {validation.trademark.skipped ? (
              <p className="text-sm text-[var(--muted-foreground)]">This step was skipped.</p>
            ) : validation.trademark.conflicts.length > 0 ? (
              <>
                <p className="text-sm mb-2">
                  {validation.trademark.conflicts.length} conflict{validation.trademark.conflicts.length !== 1 && "s"} found.
                  {validation.trademark.riskLevel === "medium" &&
                    " These do not appear to be blocking but should be reviewed."}
                  {validation.trademark.riskLevel === "high" &&
                    " Significant conflicts detected — professional review recommended."}
                </p>
                <button
                  onClick={() => setShowConflicts(!showConflicts)}
                  className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2"
                >
                  {showConflicts
                    ? "Hide conflict details"
                    : `Show ${validation.trademark.conflicts.length} conflict${validation.trademark.conflicts.length !== 1 ? "s" : ""}`}
                </button>
                {showConflicts && (
                  <div className="space-y-1.5 mt-1">
                    {validation.trademark.conflicts.map((c, i) => {
                      const severity =
                        c.similarityScore > 0.85 && c.overlappingClasses
                          ? "high"
                          : c.similarityScore > 0.7
                            ? "medium"
                            : "low";
                      const severityColors = {
                        high: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
                        medium: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
                        low: "bg-[var(--muted)] border-[var(--border)]",
                      };
                      return (
                        <div
                          key={i}
                          className={`text-xs rounded border px-3 py-2 ${severityColors[severity]}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{c.registeredName}</span>
                            <span className="text-[var(--muted-foreground)]">
                              {(c.similarityScore * 100).toFixed(0)}% similar
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[var(--muted-foreground)]">
                            <span>Status: {c.status}</span>
                            {c.overlappingClasses && (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Class overlap
                              </span>
                            )}
                            {c.classNumbers && c.classNumbers.length > 0 && (
                              <span>Classes: {c.classNumbers.join(", ")}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-green-600 dark:text-green-400">
                No trademark conflicts found.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-3">
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>
    </div>
  );
}
