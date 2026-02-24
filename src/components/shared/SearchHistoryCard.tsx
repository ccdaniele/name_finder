"use client";

import { useState } from "react";
import type { SearchHistoryEntry } from "@/lib/types";

interface SearchHistoryCardProps {
  entry: SearchHistoryEntry;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-green-600";
    case "B":
      return "text-blue-600";
    case "C":
      return "text-yellow-600";
    case "D":
      return "text-orange-600";
    default:
      return "text-red-600";
  }
}

export function SearchHistoryCard({ entry, onDelete }: SearchHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="border border-[var(--border)] rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left"
        >
          <p className="text-sm font-medium">
            {entry.preferenceSummary.industry}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {formatDate(entry.createdAt)}
          </p>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold ${gradeColor(entry.stats.topGrade)}`}>
            {entry.stats.topGrade}
          </span>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(entry.id)}
                className="text-xs px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-1.5 py-0.5 border border-[var(--border)] rounded hover:bg-[var(--muted)]"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
              title="Delete search"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-1.5 text-xs text-[var(--muted-foreground)]">
        <span>
          <span className="text-green-600 font-medium">{entry.stats.passedCount}</span> passed
        </span>
        <span>
          <span className="text-red-500 font-medium">{entry.stats.failedCount}</span> failed
        </span>
        <span>
          Avg: <span className="font-medium text-[var(--foreground)]">{entry.stats.avgScore}</span>
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
            <p>
              <span className="font-medium text-[var(--foreground)]">Audience:</span>{" "}
              {entry.preferenceSummary.targetAudience}
            </p>
            <p>
              <span className="font-medium text-[var(--foreground)]">Tone:</span>{" "}
              {entry.preferenceSummary.desiredTone}
            </p>
            <p>
              <span className="font-medium text-[var(--foreground)]">Themes:</span>{" "}
              {entry.preferenceSummary.keyThemes.join(", ")}
            </p>
            <p>
              <span className="font-medium text-[var(--foreground)]">Requested:</span>{" "}
              {entry.requestedCount} names
            </p>
          </div>

          {entry.validatedNames.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-[var(--foreground)] mb-1">
                Passed names:
              </p>
              <div className="flex flex-wrap gap-1">
                {entry.validatedNames.map((n) => (
                  <span
                    key={n.generated.name}
                    className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
                  >
                    {n.generated.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
