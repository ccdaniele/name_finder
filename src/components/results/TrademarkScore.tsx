"use client";

import type { TrademarkabilityScore, ValidationResult } from "@/lib/types";

interface TrademarkScoreProps {
  score: TrademarkabilityScore;
  compact?: boolean;
  validation?: ValidationResult;
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-600",
  B: "text-green-500",
  C: "text-yellow-500",
  D: "text-orange-500",
  F: "text-red-500",
};

export function TrademarkScore({ score, compact = false, validation }: TrademarkScoreProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--border)"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${score.overall}, 100`}
              className={GRADE_COLORS[score.grade] || ""}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {score.overall}
          </span>
        </div>
        <span className={`text-lg font-bold ${GRADE_COLORS[score.grade]}`}>
          {score.grade}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="var(--border)"
              strokeWidth="2.5"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={`${score.overall}, 100`}
              className={GRADE_COLORS[score.grade] || ""}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
            {score.overall}
          </span>
        </div>
        <div>
          <span className={`text-2xl font-bold ${GRADE_COLORS[score.grade]}`}>
            {score.grade}
          </span>
          <p className="text-xs text-[var(--muted-foreground)]">
            Trademarkability
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <ScoreBar
          label="Distinctiveness"
          value={score.breakdown.distinctiveness}
        />
        <ScoreBar
          label="Web Presence"
          value={score.breakdown.webSearch}
          skipped={validation?.webSearch?.skipped}
        />
        <ScoreBar
          label="Trademark Risk"
          value={score.breakdown.trademark}
          skipped={validation?.trademark?.skipped}
        />
        <ScoreBar
          label="Conflict Risk"
          value={score.breakdown.conflictRisk}
        />
        <ScoreBar
          label="Registrability"
          value={score.breakdown.registrability}
        />
      </div>

      {score.aiAdjustment !== 0 && (
        <p className="text-xs text-[var(--muted-foreground)]">
          AI adjustment: {score.aiAdjustment > 0 ? "+" : ""}
          {score.aiAdjustment} points
        </p>
      )}
    </div>
  );
}

function ScoreBar({ label, value, skipped }: { label: string; value: number; skipped?: boolean }) {
  if (skipped) {
    return (
      <div>
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-[var(--muted-foreground)]">{label}</span>
          <span className="text-[var(--muted-foreground)] italic">Skipped</span>
        </div>
        <div className="w-full bg-[var(--muted)] rounded-full h-1" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-[var(--muted-foreground)]">{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-[var(--muted)] rounded-full h-1">
        <div
          className="bg-[var(--primary)] h-1 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
