"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { CostEstimate } from "@/components/shared/CostEstimate";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import type {
  PreferenceSummary,
  GeneratedName,
  ValidatedName,
  FailedName,
  ValidationConfig,
} from "@/lib/types";

interface GenerationStepProps {
  preferenceSummary: PreferenceSummary;
  interviewInsights: string;
  nameCount: number;
  exclusionNames: string[];
  validationConfig: ValidationConfig;
  onComplete: (
    validated: ValidatedName[],
    failed: FailedName[]
  ) => void;
  onBack: () => void;
}

export interface GenerationStepHandle {
  cancel: () => void;
}

interface ValidationStatus {
  name: string;
  step: string;
  status: "pending" | "validating" | "passed" | "failed" | "replacing";
  reason?: string;
}

export const GenerationStep = forwardRef<GenerationStepHandle, GenerationStepProps>(
  function GenerationStep(
    { preferenceSummary, interviewInsights, nameCount, exclusionNames, validationConfig, onComplete, onBack },
    ref
  ) {
    const [phase, setPhase] = useState<
      "estimate" | "generating" | "validating" | "replacing" | "done"
    >("estimate");
    const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
    const [validationStatuses, setValidationStatuses] = useState<ValidationStatus[]>([]);
    const [validated, setValidated] = useState<ValidatedName[]>([]);
    const [failed, setFailed] = useState<FailedName[]>([]);
    const [replacementRound, setReplacementRound] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Cancel state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelledMessage, setCancelledMessage] = useState<string | null>(null);

    // Regenerate all state
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [regenerateFlag, setRegenerateFlag] = useState(0);

    // Row replacement state
    const [rowReplacingIndex, setRowReplacingIndex] = useState<number | null>(null);

    // Refs for abort control
    const abortControllerRef = useRef<AbortController | null>(null);
    const isCancelledRef = useRef(false);
    const rowAbortControllerRef = useRef<AbortController | null>(null);
    const allNamesSeenRef = useRef<string[]>([]);
    // Track current statuses length in a ref so replacement loops get accurate indices
    const statusesLengthRef = useRef(0);

    const updateStatus = useCallback(
      (index: number, update: Partial<ValidationStatus>) => {
        setValidationStatuses((prev) => {
          const next = [...prev];
          if (next[index]) {
            next[index] = { ...next[index], ...update };
          }
          return next;
        });
      },
      []
    );

    const generateNames = async (
      count: number,
      isReplacement: boolean = false,
      failedForReplacement?: Array<{ name: string; reason: string }>,
      existingNames?: string[],
      signal?: AbortSignal
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
          exclusionNames,
        }),
        signal,
      });

      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();
      return data.names;
    };

    const validateName = async (
      generated: GeneratedName,
      signal?: AbortSignal
    ): Promise<
      { type: "passed"; result: ValidatedName } | { type: "failed"; result: FailedName }
    > => {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generated, preferenceSummary, validationConfig }),
        signal,
      });

      if (!response.ok) throw new Error("Validation failed");
      return response.json();
    };

    // Cancel function exposed to parent via ref
    const cancel = useCallback(() => {
      isCancelledRef.current = true;
      abortControllerRef.current?.abort();
      rowAbortControllerRef.current?.abort();
    }, []);

    useImperativeHandle(ref, () => ({ cancel }), [cancel]);

    const runPipeline = async () => {
      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        isCancelledRef.current = false;
        const signal = controller.signal;

        // Phase 1: Generate names
        setPhase("generating");
        const names = await generateNames(nameCount, false, undefined, undefined, signal);
        if (signal.aborted) return;

        setGeneratedNames(names);

        // Initialize statuses
        const statuses: ValidationStatus[] = names.map((n) => ({
          name: n.name,
          step: "pending",
          status: "pending" as const,
        }));
        setValidationStatuses(statuses);
        statusesLengthRef.current = statuses.length;

        // Phase 2: Validate sequentially
        setPhase("validating");
        const passedNames: ValidatedName[] = [];
        const failedNames: FailedName[] = [];
        allNamesSeenRef.current = names.map((n) => n.name);

        for (let i = 0; i < names.length; i++) {
          if (signal.aborted) break;
          updateStatus(i, { step: "web_search", status: "validating" });

          const result = await validateName(names[i], signal);
          if (signal.aborted) break;

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

        if (signal.aborted) return;

        // Phase 3: Replacement rounds
        let currentFailed = [...failedNames];
        let round = 0;
        const MAX_ROUNDS = 3;

        while (currentFailed.length > 0 && round < MAX_ROUNDS) {
          if (signal.aborted) break;
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
            allNamesSeenRef.current,
            signal
          );
          if (signal.aborted) break;

          allNamesSeenRef.current.push(...replacements.map((r) => r.name));

          // Add replacement statuses
          const newStatuses: ValidationStatus[] = replacements.map((n) => ({
            name: n.name,
            step: "pending",
            status: "pending" as const,
          }));
          setValidationStatuses((prev) => {
            const updated = [...prev, ...newStatuses];
            statusesLengthRef.current = updated.length;
            return updated;
          });

          const newFailed: FailedName[] = [];
          const startIdx = statusesLengthRef.current - newStatuses.length;

          for (let i = 0; i < replacements.length; i++) {
            if (signal.aborted) break;
            updateStatus(startIdx + i, {
              step: "web_search",
              status: "validating",
            });

            const result = await validateName(replacements[i], signal);
            if (signal.aborted) break;

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

          if (signal.aborted) break;

          currentFailed = newFailed;
          setFailed((prev) => [...prev, ...newFailed]);
        }

        if (signal.aborted) return;

        setPhase("done");
        onComplete(passedNames, [...failedNames, ...currentFailed]);
      } catch (err) {
        if (isCancelledRef.current) return;
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    // Handle cancel confirmation
    const handleCancelConfirm = useCallback(() => {
      cancel();
      setShowCancelModal(false);

      // Use functional state to read the latest validated/failed
      setValidated((currentValidated) => {
        setFailed((currentFailed) => {
          if (currentValidated.length > 0) {
            onComplete(currentValidated, currentFailed);
          } else {
            setPhase("done");
            setCancelledMessage(
              "Generation cancelled. No names passed validation yet."
            );
          }
          return currentFailed;
        });
        return currentValidated;
      });
    }, [cancel, onComplete]);

    // Row-level replacement
    const replaceRow = useCallback(
      async (index: number) => {
        if (rowReplacingIndex !== null) return;
        setRowReplacingIndex(index);

        const rowController = new AbortController();
        rowAbortControllerRef.current = rowController;

        try {
          const currentStatus = validationStatuses[index];
          if (!currentStatus) return;

          updateStatus(index, { status: "replacing", step: "replacing" });

          // Generate 1 replacement
          const replacements = await generateNames(
            1,
            true,
            [{ name: currentStatus.name, reason: "User requested replacement" }],
            allNamesSeenRef.current,
            rowController.signal
          );

          if (replacements.length === 0 || rowController.signal.aborted) return;

          const replacement = replacements[0];
          allNamesSeenRef.current.push(replacement.name);

          // Validate the replacement
          updateStatus(index, {
            name: replacement.name,
            status: "validating",
            step: "web_search",
          });

          const result = await validateName(replacement, rowController.signal);
          if (rowController.signal.aborted) return;

          if (result.type === "passed") {
            updateStatus(index, { name: replacement.name, status: "passed", step: "done" });
            // Remove old name from validated/failed, add new
            setValidated((prev) => {
              const filtered = prev.filter(
                (v) => v.generated.name !== currentStatus.name
              );
              return [...filtered, result.result];
            });
            setFailed((prev) =>
              prev.filter((f) => f.generated.name !== currentStatus.name)
            );
          } else {
            updateStatus(index, {
              name: replacement.name,
              status: "failed",
              step: "done",
              reason: result.result.failureReason,
            });
            // Remove old name from validated/failed, add new to failed
            setValidated((prev) =>
              prev.filter((v) => v.generated.name !== currentStatus.name)
            );
            setFailed((prev) => {
              const filtered = prev.filter(
                (f) => f.generated.name !== currentStatus.name
              );
              return [...filtered, result.result];
            });
          }
        } catch (err) {
          if (!rowController.signal.aborted) {
            // Revert to previous status on error
            updateStatus(index, { status: "failed", step: "done", reason: "Replacement failed" });
          }
        } finally {
          setRowReplacingIndex(null);
        }
      },
      [rowReplacingIndex, validationStatuses, updateStatus]
    );

    // Regenerate all
    const handleRegenerateAllConfirm = useCallback(() => {
      cancel();
      setShowRegenerateModal(false);
      setGeneratedNames([]);
      setValidationStatuses([]);
      setValidated([]);
      setFailed([]);
      setReplacementRound(0);
      setError(null);
      setCancelledMessage(null);
      setRowReplacingIndex(null);
      allNamesSeenRef.current = [];
      statusesLengthRef.current = 0;
      isCancelledRef.current = false;
      setRegenerateFlag((prev) => prev + 1);
    }, [cancel]);

    // Trigger pipeline on regenerate
    useEffect(() => {
      if (regenerateFlag > 0) {
        runPipeline();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regenerateFlag]);

    const isPipelineActive =
      phase === "generating" || phase === "validating" || phase === "replacing";

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

    // Cancelled with no results
    if (cancelledMessage && phase === "done") {
      return (
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-[var(--muted-foreground)] mb-4">{cancelledMessage}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-2.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                setCancelledMessage(null);
                setPhase("estimate");
              }}
              className="px-6 py-2.5 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-colors"
            >
              Try Again
            </button>
          </div>
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
                {status.status === "replacing" && (
                  <>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Replacing...
                    </span>
                    <div className="w-3 h-3 border-2 border-[var(--muted-foreground)] border-t-transparent rounded-full animate-spin" />
                  </>
                )}
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
                  <>
                    <span className="text-xs font-medium text-green-600">Passed</span>
                    {isPipelineActive && rowReplacingIndex !== i && (
                      <button
                        onClick={() => replaceRow(i)}
                        disabled={rowReplacingIndex !== null}
                        className="text-xs px-2 py-0.5 border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                      >
                        Replace
                      </button>
                    )}
                  </>
                )}
                {status.status === "failed" && (
                  <>
                    <span
                      className="text-xs font-medium text-red-500"
                      title={status.reason}
                    >
                      Failed
                    </span>
                    {isPipelineActive && rowReplacingIndex !== i && (
                      <button
                        onClick={() => replaceRow(i)}
                        disabled={rowReplacingIndex !== null}
                        className="text-xs px-2 py-0.5 border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                      >
                        Replace
                      </button>
                    )}
                  </>
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

        {isPipelineActive && (
          <>
            <div className="mt-4 w-full bg-[var(--muted)] rounded-full h-1.5">
              <div
                className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    validationStatuses.length > 0
                      ? (validationStatuses.filter(
                          (s) =>
                            s.status === "passed" ||
                            s.status === "failed"
                        ).length /
                          validationStatuses.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRegenerateModal(true)}
                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 transition-colors"
              >
                Regenerate All
              </button>
            </div>
          </>
        )}

        <ConfirmModal
          isOpen={showCancelModal}
          title="Cancel Generation?"
          message="This will stop the current generation. Any names that have already passed validation will be kept."
          confirmLabel="Cancel Generation"
          variant="destructive"
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelModal(false)}
        />

        <ConfirmModal
          isOpen={showRegenerateModal}
          title="Regenerate All Names?"
          message="This will discard all current names and start a completely fresh generation."
          confirmLabel="Regenerate All"
          variant="destructive"
          onConfirm={handleRegenerateAllConfirm}
          onCancel={() => setShowRegenerateModal(false)}
        />
      </div>
    );
  }
);
