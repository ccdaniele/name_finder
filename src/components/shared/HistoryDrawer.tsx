"use client";

import { useState, useEffect, useCallback } from "react";
import { useHistory } from "@/hooks/useHistory";
import { SearchHistoryCard } from "./SearchHistoryCard";
import { ExclusionListManager } from "./ExclusionListManager";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "history" | "exclusions";

export function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const {
    searches,
    exclusionList,
    removeExclusion,
    clearExclusions,
    importExclusions,
    addManual,
    deleteSearch,
    refresh,
  } = useHistory();

  // Refresh data when drawer opens
  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-[var(--background)] border-l border-[var(--border)] z-50 shadow-lg flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold">Search History</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-[var(--foreground)] border-b-2 border-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            History
            {searches.length > 0 && (
              <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">
                ({searches.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("exclusions")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "exclusions"
                ? "text-[var(--foreground)] border-b-2 border-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Exclusions
            {exclusionList.length > 0 && (
              <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">
                ({exclusionList.length})
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeTab === "history" && (
            <div className="space-y-2">
              {searches.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
                  No searches yet. Completed searches will appear here.
                </p>
              ) : (
                [...searches]
                  .reverse()
                  .map((entry) => (
                    <SearchHistoryCard
                      key={entry.id}
                      entry={entry}
                      onDelete={deleteSearch}
                    />
                  ))
              )}
            </div>
          )}

          {activeTab === "exclusions" && (
            <ExclusionListManager
              exclusionList={exclusionList}
              onRemove={removeExclusion}
              onClearAll={clearExclusions}
              onImport={importExclusions}
              onAddManual={addManual}
            />
          )}
        </div>
      </div>
    </>
  );
}
