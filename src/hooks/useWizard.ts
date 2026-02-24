"use client";

import { useState, useCallback } from "react";
import type {
  WizardStep,
  PreferenceSummary,
  ValidatedName,
  FailedName,
} from "@/lib/types";

interface WizardState {
  step: WizardStep;
  userText: string;
  file: File | null;
  nameCount: number;
  preferenceSummary: PreferenceSummary | null;
  interviewInsights: string;
  validatedNames: ValidatedName[];
  failedNames: FailedName[];
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: WizardState = {
  step: "input",
  userText: "",
  file: null,
  nameCount: 20,
  preferenceSummary: null,
  interviewInsights: "",
  validatedNames: [],
  failedNames: [],
  isLoading: false,
  error: null,
};

export function useWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  const setStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, step, error: null }));
  }, []);

  const setUserText = useCallback((userText: string) => {
    setState((prev) => ({ ...prev, userText }));
  }, []);

  const setFile = useCallback((file: File | null) => {
    setState((prev) => ({ ...prev, file }));
  }, []);

  const setNameCount = useCallback((nameCount: number) => {
    setState((prev) => ({ ...prev, nameCount }));
  }, []);

  const setPreferenceSummary = useCallback(
    (preferenceSummary: PreferenceSummary) => {
      setState((prev) => ({ ...prev, preferenceSummary }));
    },
    []
  );

  const setInterviewInsights = useCallback((interviewInsights: string) => {
    setState((prev) => ({ ...prev, interviewInsights }));
  }, []);

  const addValidatedName = useCallback((name: ValidatedName) => {
    setState((prev) => ({
      ...prev,
      validatedNames: [...prev.validatedNames, name],
    }));
  }, []);

  const addFailedName = useCallback((name: FailedName) => {
    setState((prev) => ({
      ...prev,
      failedNames: [...prev.failedNames, name],
    }));
  }, []);

  const replaceValidatedName = useCallback(
    (index: number, name: ValidatedName) => {
      setState((prev) => {
        const updated = [...prev.validatedNames];
        updated[index] = name;
        return { ...prev, validatedNames: updated };
      });
    },
    []
  );

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    setStep,
    setUserText,
    setFile,
    setNameCount,
    setPreferenceSummary,
    setInterviewInsights,
    addValidatedName,
    addFailedName,
    replaceValidatedName,
    setLoading,
    setError,
    reset,
  };
}
