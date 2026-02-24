"use client";

import { useState, useCallback } from "react";
import { CostEstimate } from "@/components/shared/CostEstimate";
import type {
  PreferenceSummary,
  GeneratedName,
  ValidatedName,
  FailedName,
} from "@/lib/types";

interface GenerationStepProps {
  preferenceSummary: PreferenceSummary;
  interviewInsights: string;
  nameCount: number;
  onComplete: (
    validated: ValidatedName[],
    failed: FailedName[]
  ) => void;
  onBack: () => void;
}

interface ValidationStatus {
  name: string;
  step: string;
  status: "pending" | "validating" | "passed" | "failed";
  reason?: string;
}

export function GenerationStep({
  preferenceSummary,
  interviewInsights,
  nameCount,
  onComplete,
  onBack,
}: GenerationStepProps) {
  const [phase, setPhase] = useState<"estimate" | "generating" | "validating" | "replacing" | "done">("estimate");
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [validationStatuses, setValidationStatuses] = useState<ValidationStatus[]>([]);
  const [validated, setValidated] = useState<ValidatedName[]>([]);
  const [failed, setFailed] = useState<FailedName[]>([]);
  const [replacementRound, setReplacementRound] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    (index: number, update: Partial<ValidationStatus>) => {
      setValidationStatuses((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...update };
        return next;
      });
    },
    []
  );

  const generateNames = async (
    count: number,
    isReplacement: boolean = false,
    failedForReplacement?: Array<{ name: string; reason: string }>,
    existingNames?: string[]
  ): Promise<GeneratedName[]> => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferenceSummary,
        interviewInsights,
        count,
        isReplacement,
        failedNames: failedForReplacement,
        existingNames,
      }),
    });

    if (!response.ok) throw new Error("Generation failed");
    const data = await response.json();
    return data.names;
  };

  const validateName = async (
    generated: GeneratedName
  ): Promise<
    { type: "passed"; result: ValidatedName } | { type: "failed"; result: FailedName }
  > => {
    const response = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generated, preferenceSummary }),
    });

    if (!response.ok) throw new Error("Validation failed");
    return response.json();
  };

  const runPipeline = async () => {
    try {
      // Phase 1: Generate names
      setPhase("generating");
      const names = await generateNames(nameCount);
      setGeneratedNames(names);

      // Initialize statuses
      const statuses: ValidationStatus[] = names.map((n) => ({
        name: n.name,
        step: "pending",
        status: "pending" as const,
      }));
      setValidationStatuses(statuses);

      // Phase 2: Validate sequentially
      setPhase("validating");
      const passedNames: ValidatedName[] = [];
      const failedNames: FailedName[] = [];
      const allNamesSeen: string[] = names.map((n) => n.name);

      for (let i = 0; i < names.length; i++) {
        updateStatus(i, { step: "web_search", status: "validating" });

        const result = await validateName(names[i]);

        if (result.type === "passed") {
          passedNames.push(result.result);
          updateStatus(i, { status: "passed", step: "done" });
        } else {
          failedNames.push(result.result);
          updateStatus(i, {
            status: "failed",
            step: "done",
            reason: result.result.failureReason,
          });
        }

        setValidated([...passedNames]);
        setFailed([...failedNames]);
      }

      // Phase 3: Replacement rounds
      let currentFailed = [...failedNames];
      let round = 0;
      const MAX_ROUNDS = 3;

      while (currentFailed.length > 0 && round < MAX_ROUNDS) {
        round++;
        setReplacementRound(round);
        setPhase("replacing");

        const failedForPrompt = currentFailed.map((f) => ({
          name: f.generated.name,
          reason: f.failureReason,
        }));

        const replacements = await generateNames(
          currentFailed.length,
          true,
          failedForPrompt,
          allNamesSeen
        );

        allNamesSeen.push(...replacements.map((r) => r.name));

        // Add replacement statuses
        const newStatuses: ValidationStatus[] = replacements.map((n) => ({
          name: n.name,
          step: "pending",
          status: "pending" as const,
        }));
        setValidationStatuses((prev) => [...prev, ...newStatuses]);

        const newFailed: FailedName[] = [];
        const startIdx = validationStatuses.length;

        for (let i = 0; i < replacements.length; i++) {
          updateStatus(startIdx + i, {
            step: "web_search",
            status: "validating",
          });

          const result = await validateName(replacements[i]);

          if (result.type === "passed") {
            passedNames.push(result.result);
            updateStatus(startIdx + i, { status: "passed", step: "done" });
          } else {
            newFailed.push(result.result);
            updateStatus(startIdx + i, {
              status: "failed",
              step: "done",
              reason: result.result.failureReason,
            });
          }

          setValidated([...passedNames]);
        }

        currentFailed = newFailed;
        setFailed((prev) => [...prev, ...newFailed]);
      }

      setPhase("done");
      onComplete(passedNames, [...failedNames, ...currentFailed]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-[var(--destructive)] mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-sm border border-[var(--border)] rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (phase === "estimate") {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h2 className="text-xl font-semibold text-center mb-6">
          Ready to Generate Names
        </h2>
        <CostEstimate
          nameCount={nameCount}
          onConfirm={runPipeline}
          onCancel={onBack}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">
        {phase === "generating"
          ? "Generating Names..."
          : phase === "replacing"
            ? `Replacing Failed Names (Round ${replacementRound}/3)...`
            : phase === "done"
              ? "Generation Complete!"
              : "Validating Names..."}
      </h2>

      <div className="flex gap-4 text-sm text-[var(--muted-foreground)] mb-4">
        <span>
          Passed: <strong className="text-green-600">{validated.length}</strong>
        </span>
        <span>
          Failed: <strong className="text-red-500">{failed.length}</strong>
        </span>
        <span>
          Total: <strong>{validationStatuses.length}</strong>
        </span>
      </div>

      <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto">
        {validationStatuses.map((status, i) => (
          <div
            key={`${status.name}-${i}`}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span className="font-medium">{status.name}</span>
            <div className="flex items-center gap-2">
              {status.status === "validating" && (
                <>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {status.step === "web_search"
                      ? "Searching web..."
                      : status.step === "domain"
                        ? "Checking domain..."
                        : status.step === "trademark"
                          ? "Searching trademarks..."
                          : "Scoring..."}
                  </span>
                  <div className="w-3 h-3 border-2 border-[var(--muted-foreground)] border-t-transparent rounded-full animate-spin" />
                </>
              )}
              {status.status === "passed" && (
                <span className="text-xs font-medium text-green-600">Passed</span>
              )}
              {status.status === "failed" && (
                <span className="text-xs font-medium text-red-500" title={status.reason}>
                  Failed
                </span>
              )}
              {status.status === "pending" && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Waiting...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {phase !== "done" && (
        <div className="mt-4 w-full bg-[var(--muted)] rounded-full h-1.5">
          <div
            className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${
                validationStatuses.length > 0
                  ? (validationStatuses.filter(
                      (s) => s.status === "passed" || s.status === "failed"
                    ).length /
                      validationStatuses.length) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
