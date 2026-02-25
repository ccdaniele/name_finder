"use client";

import { useState } from "react";
import type { SavedSearch } from "@/lib/types";

interface SearchHistoryCardProps {
  entry: SavedSearch;
  onDelete: (id: string) => void;
  onReuse: (entry: SavedSearch) => void;
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

export function SearchHistoryCard({ entry, onDelete, onReuse }: SearchHistoryCardProps) {
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
            {formatDate(entry.createdAt)} &middot; {entry.nameCount} names
          </p>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onReuse(entry)}
            className="text-xs px-2 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:opacity-90 transition-opacity"
          >
            Reuse
          </button>
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
              <span className="font-medium text-[var(--foreground)]">Names:</span>{" "}
              {entry.nameCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
