"use client";

import { useState, useCallback } from "react";
import { NameCard } from "./NameCard";
import { FailedNameCard } from "./FailedNameCard";
import type {
  ValidatedName,
  FailedName,
  PreferenceSummary,
  ValidationConfig,
} from "@/lib/types";

interface ResultsListProps {
  validatedNames: ValidatedName[];
  failedNames: FailedName[];
  preferenceSummary: PreferenceSummary;
  interviewInsights: string;
  exclusionNames: string[];
  validationConfig: ValidationConfig;
  onUpdateNames: (names: ValidatedName[]) => void;
  onSaveSearch?: () => void;
  searchSaved?: boolean;
}

type SortBy = "score" | "name" | "grade";
type FilterGrade = "all" | "A" | "B" | "C" | "D";

export function ResultsList({
  validatedNames,
  failedNames,
  preferenceSummary,
  interviewInsights,
  exclusionNames,
  validationConfig,
  onUpdateNames,
  onSaveSearch,
  searchSaved,
}: ResultsListProps) {
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [filterGrade, setFilterGrade] = useState<FilterGrade>("all");
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [showFailed, setShowFailed] = useState(false);

  const sorted = [...validatedNames]
    .filter(
      (n) =>
        filterGrade === "all" ||
        n.validation.trademarkabilityScore.grade === filterGrade
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (
            b.validation.trademarkabilityScore.overall -
            a.validation.trademarkabilityScore.overall
          );
        case "name":
          return a.generated.name.localeCompare(b.generated.name);
        case "grade":
          return a.validation.trademarkabilityScore.grade.localeCompare(
            b.validation.trademarkabilityScore.grade
          );
        default:
          return 0;
      }
    });

  const handleRegenerate = useCallback(
    async (index: number) => {
      setRegeneratingIndex(index);
      try {
        const nameToReplace = validatedNames[index];

        const genResponse = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferenceSummary,
            interviewInsights,
            count: 1,
            isReplacement: true,
            failedNames: [
              {
                name: nameToReplace.generated.name,
                reason: "User requested replacement",
              },
            ],
            existingNames: validatedNames.map((n) => n.generated.name),
            exclusionNames,
          }),
        });

        if (!genResponse.ok) throw new Error("Generation failed");
        const { names } = await genResponse.json();

        if (names.length > 0) {
          const valResponse = await fetch("/api/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              generated: names[0],
              preferenceSummary,
              validationConfig,
            }),
          });

          if (!valResponse.ok) throw new Error("Validation failed");
          const result = await valResponse.json();

          if (result.type === "passed") {
            const updated = [...validatedNames];
            updated[index] = result.result;
            onUpdateNames(updated);
          }
        }
      } catch (error) {
        console.error("Regeneration failed:", error);
      } finally {
        setRegeneratingIndex(null);
      }
    },
    [validatedNames, preferenceSummary, interviewInsights, exclusionNames, validationConfig, onUpdateNames]
  );

  const handleExport = async (format: "pdf" | "csv") => {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: validatedNames, format }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `name-generator-results.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Results</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {validatedNames.length} validated names
            {failedNames.length > 0 && ` (${failedNames.length} discarded)`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md hover:bg-[var(--muted)]"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md hover:bg-[var(--muted)]"
          >
            Export PDF
          </button>
        </div>
      </div>

      {onSaveSearch && !searchSaved && (
        <div className="mb-4 p-3 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Save this search?</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Save your preferences to reuse later (names won&apos;t be saved).
            </p>
          </div>
          <button
            onClick={onSaveSearch}
            className="px-4 py-1.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity shrink-0 ml-3"
          >
            Save Search
          </button>
        </div>
      )}
      {searchSaved && (
        <div className="mb-4 p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            Search saved! You can reuse it from the History drawer.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--muted-foreground)]">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-xs border border-[var(--border)] rounded-md px-2 py-1 bg-transparent"
          >
            <option value="score">Score (high to low)</option>
            <option value="name">Name (A-Z)</option>
            <option value="grade">Grade</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--muted-foreground)]">
            Filter:
          </label>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value as FilterGrade)}
            className="text-xs border border-[var(--border)] rounded-md px-2 py-1 bg-transparent"
          >
            <option value="all">All grades</option>
            <option value="A">Grade A only</option>
            <option value="B">Grade B+</option>
            <option value="C">Grade C+</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((name, displayIndex) => {
          const originalIndex = validatedNames.indexOf(name);
          return (
            <NameCard
              key={name.generated.name}
              validatedName={name}
              rank={displayIndex + 1}
              onRegenerate={() => handleRegenerate(originalIndex)}
              isRegenerating={regeneratingIndex === originalIndex}
            />
          );
        })}
      </div>

      {failedNames.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowFailed(!showFailed)}
            className="text-sm text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
          >
            {showFailed
              ? "Hide discarded names"
              : `Show ${failedNames.length} discarded names`}
          </button>
          {showFailed && (
            <div className="space-y-2 mt-3">
              {failedNames.map((name, i) => (
                <FailedNameCard key={i} failedName={name} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
