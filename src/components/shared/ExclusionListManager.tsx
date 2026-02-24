"use client";

import { useState, useRef } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { exportExclusionList } from "@/lib/storage/history-storage";
import type { ExclusionEntry, ExclusionListExport } from "@/lib/types";

interface ExclusionListManagerProps {
  exclusionList: ExclusionEntry[];
  onRemove: (name: string) => void;
  onClearAll: () => void;
  onImport: (entries: ExclusionEntry[]) => void;
  onAddManual: (names: string[]) => void;
}

const SOURCE_LABELS: Record<ExclusionEntry["source"], string> = {
  "search-passed": "Search",
  "search-failed": "Failed",
  "manual-import": "Imported",
  "manual-add": "Manual",
};

const SOURCE_COLORS: Record<ExclusionEntry["source"], string> = {
  "search-passed": "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  "search-failed": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  "manual-import": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  "manual-add": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

export function ExclusionListManager({
  exclusionList,
  onRemove,
  onClearAll,
  onImport,
  onAddManual,
}: ExclusionListManagerProps) {
  const [search, setSearch] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [addText, setAddText] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? exclusionList.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      )
    : exclusionList;

  const handleAddSubmit = () => {
    if (!addText.trim()) return;
    // Split by commas or newlines
    const names = addText
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length > 0) {
      onAddManual(names);
      setAddText("");
      setShowAddInput(false);
    }
  };

  const handleExport = () => {
    const data = exportExclusionList();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "name-exclusion-list.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        // Try JSON format first
        try {
          const parsed = JSON.parse(text) as ExclusionListExport;
          if (parsed.version !== 1 || !Array.isArray(parsed.entries)) {
            setImportError("Invalid file format. Expected version 1 with entries array.");
            return;
          }
          const validEntries = parsed.entries.filter(
            (entry) => entry && typeof entry.name === "string" && entry.name.trim()
          );
          if (validEntries.length === 0) {
            setImportError("No valid name entries found in file.");
            return;
          }
          onImport(validEntries);
          setImportError(null);
        } catch {
          // Not JSON — treat as plain text (one name per line or comma-separated)
          const names = text
            .split(/[,\n]/)
            .map((n) => n.trim())
            .filter(Boolean);
          if (names.length === 0) {
            setImportError("No names found in file.");
            return;
          }
          onAddManual(names);
          setImportError(null);
        }
      } catch {
        setImportError("Failed to read file.");
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-imported
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header stats */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">
            {exclusionList.length}
          </span>{" "}
          names excluded
        </p>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          onClick={() => setShowAddInput(!showAddInput)}
          className="text-xs px-2.5 py-1 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
        >
          Add names
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-xs px-2.5 py-1 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt,.csv"
          onChange={handleImportFile}
          className="hidden"
        />
        <button
          onClick={handleExport}
          disabled={exclusionList.length === 0}
          className="text-xs px-2.5 py-1 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          Export
        </button>
        <button
          onClick={() => setShowClearModal(true)}
          disabled={exclusionList.length === 0}
          className="text-xs px-2.5 py-1 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
        >
          Clear all
        </button>
      </div>

      {/* Add names input */}
      {showAddInput && (
        <div className="mb-3 p-2 border border-[var(--border)] rounded-md bg-[var(--muted)]">
          <textarea
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            placeholder="Enter names separated by commas or new lines..."
            className="w-full text-xs bg-transparent border-none outline-none resize-none h-16 placeholder:text-[var(--muted-foreground)]"
            autoFocus
          />
          <div className="flex justify-end gap-1.5 mt-1">
            <button
              onClick={() => {
                setShowAddInput(false);
                setAddText("");
              }}
              className="text-xs px-2 py-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubmit}
              disabled={!addText.trim()}
              className="text-xs px-2.5 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Import error */}
      {importError && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-700 dark:text-red-300">{importError}</p>
        </div>
      )}

      {/* Search filter */}
      {exclusionList.length > 10 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter names..."
          className="w-full text-xs px-2.5 py-1.5 mb-3 border border-[var(--border)] rounded-md bg-transparent placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      )}

      {/* Exclusion list */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {filtered.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)] text-center py-4">
            {exclusionList.length === 0
              ? "No excluded names yet. Names from completed searches will appear here."
              : "No names match your filter."}
          </p>
        ) : (
          filtered.map((entry) => (
            <div
              key={`${entry.name}-${entry.addedAt}`}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--muted)] group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate">
                  {entry.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${SOURCE_COLORS[entry.source]}`}
                >
                  {SOURCE_LABELS[entry.source]}
                </span>
              </div>
              <button
                onClick={() => onRemove(entry.name)}
                className="text-[var(--muted-foreground)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                title="Remove from exclusion list"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={showClearModal}
        title="Clear All Exclusions?"
        message={`This will remove all ${exclusionList.length} excluded names. Future searches may regenerate previously seen names.`}
        confirmLabel="Clear All"
        variant="destructive"
        onConfirm={() => {
          onClearAll();
          setShowClearModal(false);
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
}
