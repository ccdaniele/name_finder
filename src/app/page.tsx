"use client";

import { useEffect } from "react";
import { useWizard } from "@/hooks/useWizard";
import { StepIndicator } from "@/components/wizard/StepIndicator";
import { InputStep } from "@/components/wizard/InputStep";
import { SummaryStep } from "@/components/wizard/SummaryStep";
import { InterviewStep } from "@/components/wizard/InterviewStep";
import { GenerationStep } from "@/components/wizard/GenerationStep";
import { ResultsList } from "@/components/results/ResultsList";
import {
  saveSession,
  loadSession,
  clearSession,
  createNewSession,
} from "@/lib/storage/local-storage";
import type { PreferenceSummary, ValidatedName, FailedName } from "@/lib/types";

export default function Home() {
  const {
    state,
    setStep,
    setUserText,
    setFile,
    setNameCount,
    setPreferenceSummary,
    setInterviewInsights,
    setError,
    reset,
  } = useWizard();

  // Load saved session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.validatedNames.length > 0) {
      // We have previous results — but the wizard hook doesn't fully restore
      // For now, just log that a session was found
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
    // Save to localStorage
    const session = createNewSession(state.nameCount);
    session.preferenceSummary = state.preferenceSummary!;
    session.interviewInsights = state.interviewInsights;
    session.validatedNames = validated;
    session.failedNames = failed;
    saveSession(session);

    setStep("results");
  };

  const handleStartOver = () => {
    clearSession();
    reset();
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold">Name Generator</h1>
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
          onUserTextChange={setUserText}
          onFileChange={setFile}
          onNameCountChange={setNameCount}
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
          preferenceSummary={state.preferenceSummary}
          interviewInsights={state.interviewInsights}
          nameCount={state.nameCount}
          onComplete={handleGenerationComplete}
          onBack={() => setStep("interview")}
        />
      )}

      {state.step === "results" && state.preferenceSummary && (
        <ResultsList
          validatedNames={state.validatedNames.length > 0 ? state.validatedNames : loadSession()?.validatedNames || []}
          failedNames={state.failedNames.length > 0 ? state.failedNames : loadSession()?.failedNames || []}
          preferenceSummary={state.preferenceSummary}
          interviewInsights={state.interviewInsights}
          onUpdateNames={(names) => {
            const session = loadSession();
            if (session) {
              session.validatedNames = names;
              saveSession(session);
            }
          }}
        />
      )}
    </main>
  );
}
