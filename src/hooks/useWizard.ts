"use client";

import { useState, useCallback } from "react";
import type {
  WizardStep,
  PreferenceSummary,
  ValidatedName,
  FailedName,
  ValidationConfig,
} from "@/lib/types";
import {
  loadValidationConfig,
  saveValidationConfig,
} from "@/lib/storage/validation-config-storage";

interface WizardState {
  step: WizardStep;
  userText: string;
  file: File | null;
  nameCount: number;
  validationConfig: ValidationConfig;
  preferenceSummary: PreferenceSummary | null;
  interviewInsights: string;
  validatedNames: ValidatedName[];
  failedNames: FailedName[];
  isLoading: boolean;
  error: string | null;
}

function createInitialState(): WizardState {
  return {
    step: "input",
    userText: "",
    file: null,
    nameCount: 20,
    validationConfig: loadValidationConfig(),
    preferenceSummary: null,
    interviewInsights: "",
    validatedNames: [],
    failedNames: [],
    isLoading: false,
    error: null,
  };
}

export function useWizard() {
  const [state, setState] = useState<WizardState>(createInitialState);

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

  const setValidationConfig = useCallback((validationConfig: ValidationConfig) => {
    setState((prev) => ({ ...prev, validationConfig }));
    saveValidationConfig(validationConfig);
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

  const setValidatedNames = useCallback((validatedNames: ValidatedName[]) => {
    setState((prev) => ({ ...prev, validatedNames }));
  }, []);

  const setFailedNames = useCallback((failedNames: FailedName[]) => {
    setState((prev) => ({ ...prev, failedNames }));
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
    setState(createInitialState());
  }, []);

  return {
    state,
    setStep,
    setUserText,
    setFile,
    setNameCount,
    setValidationConfig,
    setPreferenceSummary,
    setInterviewInsights,
    setValidatedNames,
    setFailedNames,
    addValidatedName,
    addFailedName,
    replaceValidatedName,
    setLoading,
    setError,
    reset,
  };
}
