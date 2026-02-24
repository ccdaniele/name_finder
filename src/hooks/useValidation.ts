"use client";

import { useState, useCallback } from "react";

export interface ValidationProgress {
  currentName: string;
  currentStep: string;
  totalNames: number;
  processedCount: number;
  passedCount: number;
  failedCount: number;
  replacementRound: number;
}

export function useValidation() {
  const [progress, setProgress] = useState<ValidationProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const updateProgress = useCallback((update: Partial<ValidationProgress>) => {
    setProgress((prev) =>
      prev ? { ...prev, ...update } : null
    );
  }, []);

  const startValidation = useCallback((totalNames: number) => {
    setIsRunning(true);
    setProgress({
      currentName: "",
      currentStep: "starting",
      totalNames,
      processedCount: 0,
      passedCount: 0,
      failedCount: 0,
      replacementRound: 0,
    });
  }, []);

  const finishValidation = useCallback(() => {
    setIsRunning(false);
  }, []);

  return {
    progress,
    isRunning,
    updateProgress,
    startValidation,
    finishValidation,
    setProgress,
  };
}
