"use client";

import { useEffect, useRef, useState } from "react";
import { useWizard } from "@/hooks/useWizard";
import { useHistory } from "@/hooks/useHistory";
import { StepIndicator } from "@/components/wizard/StepIndicator";
import { InputStep } from "@/components/wizard/InputStep";
import { SummaryStep } from "@/components/wizard/SummaryStep";
import { InterviewStep } from "@/components/wizard/InterviewStep";
import { GenerationStep } from "@/components/wizard/GenerationStep";
import type { GenerationStepHandle } from "@/components/wizard/GenerationStep";
import { ResultsList } from "@/components/results/ResultsList";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { HistoryDrawer } from "@/components/shared/HistoryDrawer";
import {
  saveSession,
  loadSession,
  clearSession,
  createNewSession,
} from "@/lib/storage/local-storage";
import type {
  PreferenceSummary,
  ValidatedName,
  FailedName,
  SearchHistoryEntry,
} from "@/lib/types";

export default function Home() {
  const {
    state,
    setStep,
    setUserText,
    setFile,
    setNameCount,
    setValidationConfig,
    setPreferenceSummary,
    setInterviewInsights,
    setError,
    setValidatedNames,
    setFailedNames,
    reset,
  } = useWizard();

  const { exclusionNames, addSearch, clearExclusions } = useHistory();

  const generationRef = useRef<GenerationStepHandle>(null);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showExclusionChoiceModal, setShowExclusionChoiceModal] = useState(false);

  // Load saved session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.validatedNames.length > 0) {
      console.log("Found saved session:", saved.id);
    }
  }, []);

  const handleAnalyze = (summary: PreferenceSummary) => {
    setPreferenceSummary(summary);
    setStep("summary");
  };

  const handleSummaryConfirm = (updated: PreferenceSummary) => {
    setPreferenceSummary(updated);
    setStep("interview");
  };

  const handleInterviewComplete = (insights: string) => {
    setInterviewInsights(insights);
    setStep("generation");
  };

  const handleGenerationComplete = (
    validated: ValidatedName[],
    failed: FailedName[]
  ) => {
    const session = createNewSession(state.nameCount);
    session.preferenceSummary = state.preferenceSummary!;
    session.interviewInsights = state.interviewInsights;
    session.validatedNames = validated;
    session.failedNames = failed;
    saveSession(session);

    // Save to search history and add all names to exclusion list
    const avgScore =
      validated.length > 0
        ? Math.round(
            validated.reduce(
              (sum, n) => sum + n.validation.trademarkabilityScore.overall,
              0
            ) / validated.length
          )
        : 0;

    const topGrade =
      validated.length > 0
        ? (validated.reduce(
            (best, n) =>
              n.validation.trademarkabilityScore.grade < best
                ? n.validation.trademarkabilityScore.grade
                : best,
            "F" as "A" | "B" | "C" | "D" | "F"
          ) as "A" | "B" | "C" | "D" | "F")
        : ("F" as const);

    const historyEntry: SearchHistoryEntry = {
      id: session.id,
      createdAt: session.createdAt,
      preferenceSummary: state.preferenceSummary!,
      interviewInsights: state.interviewInsights,
      requestedCount: state.nameCount,
      validatedNames: validated,
      failedNames: failed,
      stats: {
        totalGenerated: validated.length + failed.length,
        passedCount: validated.length,
        failedCount: failed.length,
        avgScore,
        topGrade,
      },
    };
    addSearch(historyEntry);

    setValidatedNames(validated);
    setFailedNames(failed);
    setStep("results");
  };

  const handleStartOver = () => {
    if (state.step === "generation") {
      setShowStartOverModal(true);
    } else if (exclusionNames.length > 0) {
      setShowExclusionChoiceModal(true);
    } else {
      clearSession();
      reset();
    }
  };

  const handleStartOverConfirm = () => {
    generationRef.current?.cancel();
    setShowStartOverModal(false);
    if (exclusionNames.length > 0) {
      setShowExclusionChoiceModal(true);
    } else {
      clearSession();
      reset();
    }
  };

  const handleStartOverKeepExclusions = () => {
    setShowExclusionChoiceModal(false);
    clearSession();
    reset();
  };

  const handleStartOverClearAll = () => {
    setShowExclusionChoiceModal(false);
    clearSession();
    clearExclusions();
    reset();
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl font-bold">Name Generator</h1>
          <button
            onClick={() => setShowHistoryDrawer(true)}
            className="p-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
            title="Search history & exclusions"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          AI-powered company & product name generator with trademark validation
        </p>
        {state.step !== "input" && (
          <button
            onClick={handleStartOver}
            className="text-xs text-[var(--muted-foreground)] underline hover:text-[var(--foreground)] mt-2"
          >
            Start over
          </button>
        )}
      </header>

      <StepIndicator currentStep={state.step} />

      {state.error && (
        <div className="max-w-2xl mx-auto mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
        </div>
      )}

      {state.step === "input" && (
        <InputStep
          userText={state.userText}
          file={state.file}
          nameCount={state.nameCount}
          validationConfig={state.validationConfig}
          onUserTextChange={setUserText}
          onFileChange={setFile}
          onNameCountChange={setNameCount}
          onValidationConfigChange={setValidationConfig}
          onAnalyze={handleAnalyze}
          onError={setError}
        />
      )}

      {state.step === "summary" && state.preferenceSummary && (
        <SummaryStep
          summary={state.preferenceSummary}
          onConfirm={handleSummaryConfirm}
          onBack={() => setStep("input")}
        />
      )}

      {state.step === "interview" && state.preferenceSummary && (
        <InterviewStep
          preferenceSummary={state.preferenceSummary}
          onComplete={handleInterviewComplete}
          onBack={() => setStep("summary")}
        />
      )}

      {state.step === "generation" && state.preferenceSummary && (
        <GenerationStep
          ref={generationRef}
          preferenceSummary={state.preferenceSummary}
          interviewInsights={state.interviewInsights}
          nameCount={state.nameCount}
          exclusionNames={exclusionNames}
          validationConfig={state.validationConfig}
          onComplete={handleGenerationComplete}
          onBack={() => setStep("interview")}
        />
      )}

      {state.step === "results" && state.preferenceSummary && (
        <ResultsList
          validatedNames={state.validatedNames}
          failedNames={state.failedNames}
          preferenceSummary={state.preferenceSummary}
          interviewInsights={state.interviewInsights}
          exclusionNames={exclusionNames}
          validationConfig={state.validationConfig}
          onUpdateNames={(names) => {
            setValidatedNames(names);
            const session = loadSession();
            if (session) {
              session.validatedNames = names;
              saveSession(session);
            }
          }}
        />
      )}

      <ConfirmModal
        isOpen={showStartOverModal}
        title="Start Over?"
        message="This will cancel the current generation and discard all progress. Are you sure?"
        confirmLabel="Start Over"
        variant="destructive"
        onConfirm={handleStartOverConfirm}
        onCancel={() => setShowStartOverModal(false)}
      />

      {/* Exclusion choice modal */}
      {showExclusionChoiceModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowExclusionChoiceModal(false)}
        >
          <div
            className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 max-w-sm mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Start Over</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Would you like to keep your exclusion list for the next search?
              ({exclusionNames.length} names excluded)
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleStartOverKeepExclusions}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
              >
                Keep Exclusion List
              </button>
              <button
                onClick={handleStartOverClearAll}
                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 transition-colors"
              >
                Clear Everything
              </button>
              <button
                onClick={() => setShowExclusionChoiceModal(false)}
                className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <HistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
      />
    </main>
  );
}
