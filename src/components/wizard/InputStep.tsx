"use client";

import { useState } from "react";
import { FileUploader } from "@/components/shared/FileUploader";
import type { PreferenceSummary } from "@/lib/types";

interface InputStepProps {
  userText: string;
  file: File | null;
  nameCount: number;
  onUserTextChange: (text: string) => void;
  onFileChange: (file: File | null) => void;
  onNameCountChange: (count: number) => void;
  onAnalyze: (summary: PreferenceSummary) => void;
  onError: (error: string) => void;
}

export function InputStep({
  userText,
  file,
  nameCount,
  onUserTextChange,
  onFileChange,
  onNameCountChange,
  onAnalyze,
  onError,
}: InputStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async () => {
    if (!userText.trim() && !file) {
      onError("Please provide a text description or upload a file.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("userText", userText);
      if (file) formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const summary: PreferenceSummary = await response.json();
      onAnalyze(summary);
    } catch {
      onError("Failed to analyze your input. Please check your API keys and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          Describe your company or product
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Tell us about your business, target audience, brand personality, and
          what kind of name you&apos;re looking for.
        </p>
        <textarea
          value={userText}
          onChange={(e) => onUserTextChange(e.target.value)}
          placeholder="Example: I'm building a fintech app for Gen Z that makes investing feel approachable and fun. I want a name that sounds modern, trustworthy, and a little playful..."
          rows={6}
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-3 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Upload additional context (optional)
        </label>
        <FileUploader onFileSelect={onFileChange} selectedFile={file} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Number of names to generate
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={50}
            value={nameCount}
            onChange={(e) => onNameCountChange(parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <span className="text-sm font-mono w-8 text-center">{nameCount}</span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isAnalyzing || (!userText.trim() && !file)}
        className="w-full px-4 py-3 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? "Analyzing..." : "Analyze Preferences"}
      </button>
    </div>
  );
}
