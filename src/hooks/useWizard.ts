"use client";

import { useState, useCallback, useEffect } from "react";
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
  getDefaultValidationConfig,
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
  skipInterview: boolean;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: WizardState = {
  step: "input",
  userText: "",
  file: null,
  nameCount: 20,
  validationConfig: getDefaultValidationConfig(),
  preferenceSummary: null,
  interviewInsights: "",
  validatedNames: [],
  failedNames: [],
  skipInterview: false,
  isLoading: false,
  error: null,
};

export function useWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  // Hydrate validation config from localStorage after mount
  useEffect(() => {
    const saved = loadValidationConfig();
    setState((prev) => ({ ...prev, validationConfig: saved }));
  }, []);

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

  const setSkipInterview = useCallback((skipInterview: boolean) => {
    setState((prev) => ({ ...prev, skipInterview }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ ...INITIAL_STATE, validationConfig: loadValidationConfig() });
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
    setSkipInterview,
    setLoading,
    setError,
    reset,
  };
}
