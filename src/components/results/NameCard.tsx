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

export function NameCard({
  validatedName,
  rank,
  onRegenerate,
  isRegenerating,
}: NameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { generated, validation } = validatedName;

  return (
    <div className="border border-[var(--border)] rounded-lg p-5 hover:border-[var(--muted-foreground)] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted-foreground)] font-mono">
            #{rank}
          </span>
          <div>
            <h3 className="text-lg font-semibold">{generated.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                {CATEGORY_LABELS[generated.distinctivenessCategory]}
              </span>
              {validation.domain.available && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  .com available
                  {validation.domain.price && ` (${validation.domain.price})`}
                </span>
              )}
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

          <TrademarkScore score={validation.trademarkabilityScore} />

          {validation.trademark.conflicts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
                Trademark conflicts ({validation.trademark.conflicts.length})
              </h4>
              <div className="space-y-1">
                {validation.trademark.conflicts.map((c, i) => (
                  <div
                    key={i}
                    className="text-xs bg-[var(--muted)] rounded px-2 py-1.5"
                  >
                    <span className="font-medium">{c.registeredName}</span>
                    <span className="text-[var(--muted-foreground)]">
                      {" "}
                      — {(c.similarityScore * 100).toFixed(0)}% similar
                      {c.overlappingClasses && " (class overlap)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
              Web search assessment
            </h4>
            <p className="text-sm">{validation.webSearch.aiAssessment}</p>
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
