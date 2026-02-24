"use client";

import { useState } from "react";
import { FileUploader } from "@/components/shared/FileUploader";
import type { PreferenceSummary, ValidationConfig } from "@/lib/types";

interface InputStepProps {
  userText: string;
  file: File | null;
  nameCount: number;
  validationConfig: ValidationConfig;
  onUserTextChange: (text: string) => void;
  onFileChange: (file: File | null) => void;
  onNameCountChange: (count: number) => void;
  onValidationConfigChange: (config: ValidationConfig) => void;
  onAnalyze: (summary: PreferenceSummary) => void;
  onError: (error: string) => void;
}

const PRESET_TLDS = [".com", ".io", ".co", ".ai"];

export function InputStep({
  userText,
  file,
  nameCount,
  validationConfig,
  onUserTextChange,
  onFileChange,
  onNameCountChange,
  onValidationConfigChange,
  onAnalyze,
  onError,
}: InputStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showValidationSettings, setShowValidationSettings] = useState(false);
  const [customTld, setCustomTld] = useState("");

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

  const updateConfig = (updates: Partial<ValidationConfig>) => {
    onValidationConfigChange({ ...validationConfig, ...updates });
  };

  const addTld = (tld: string) => {
    const normalized = tld.startsWith(".") ? tld.toLowerCase() : `.${tld.toLowerCase()}`;
    if (!/^\.[a-z]{2,10}$/.test(normalized)) return;
    if (validationConfig.domain.tlds.includes(normalized)) return;
    updateConfig({
      domain: {
        ...validationConfig.domain,
        tlds: [...validationConfig.domain.tlds, normalized],
      },
    });
  };

  const removeTld = (tld: string) => {
    const remaining = validationConfig.domain.tlds.filter((t) => t !== tld);
    if (remaining.length === 0) return;
    updateConfig({
      domain: { ...validationConfig.domain, tlds: remaining },
    });
  };

  const handleCustomTldAdd = () => {
    if (customTld.trim()) {
      addTld(customTld.trim());
      setCustomTld("");
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

      {/* Validation Settings */}
      <div className="border border-[var(--border)] rounded-lg">
        <button
          onClick={() => setShowValidationSettings(!showValidationSettings)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-[var(--muted)] transition-colors rounded-lg"
        >
          <span>Validation Settings</span>
          <svg
            className={`w-4 h-4 transition-transform ${showValidationSettings ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showValidationSettings && (
          <div className="px-4 pb-4 space-y-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted-foreground)] mt-3">
              Configure which validation steps to run and whether they should cause names to fail.
            </p>

            {/* Web Search */}
            <ValidationStepRow
              label="Web Search"
              description="Search for existing companies with similar names"
              enabled={validationConfig.webSearch.enabled}
              canFail={validationConfig.webSearch.canFail}
              onToggle={(enabled) =>
                updateConfig({ webSearch: { ...validationConfig.webSearch, enabled } })
              }
              onCanFailChange={(canFail) =>
                updateConfig({ webSearch: { ...validationConfig.webSearch, canFail } })
              }
            />

            {/* Domain */}
            <div className="border border-[var(--border)] rounded-md p-3 space-y-3">
              <ValidationStepRow
                label="Domain Availability"
                description="Check if domain names are available"
                enabled={validationConfig.domain.enabled}
                canFail={validationConfig.domain.canFail}
                onToggle={(enabled) =>
                  updateConfig({ domain: { ...validationConfig.domain, enabled } })
                }
                onCanFailChange={(canFail) =>
                  updateConfig({ domain: { ...validationConfig.domain, canFail } })
                }
                noBorder
              />

              {validationConfig.domain.enabled && (
                <div className="pl-7">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1.5">
                    TLDs to check
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {validationConfig.domain.tlds.map((tld) => (
                      <span
                        key={tld}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--muted)] rounded-md"
                      >
                        {tld}
                        {validationConfig.domain.tlds.length > 1 && (
                          <button
                            onClick={() => removeTld(tld)}
                            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_TLDS.filter(
                      (tld) => !validationConfig.domain.tlds.includes(tld)
                    ).map((tld) => (
                      <button
                        key={tld}
                        onClick={() => addTld(tld)}
                        className="text-xs px-2 py-0.5 border border-dashed border-[var(--border)] rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--muted-foreground)] transition-colors"
                      >
                        + {tld}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customTld}
                      onChange={(e) => setCustomTld(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCustomTldAdd();
                        }
                      }}
                      placeholder=".xyz"
                      className="w-20 text-xs px-2 py-1 border border-[var(--border)] rounded-md bg-transparent placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    />
                    <button
                      onClick={handleCustomTldAdd}
                      disabled={!customTld.trim()}
                      className="text-xs px-2 py-1 border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5">
                    Name passes if at least one selected TLD is available
                  </p>
                </div>
              )}
            </div>

            {/* Trademark */}
            <ValidationStepRow
              label="Trademark Search"
              description="Search USPTO database for trademark conflicts"
              enabled={validationConfig.trademark.enabled}
              canFail={validationConfig.trademark.canFail}
              onToggle={(enabled) =>
                updateConfig({ trademark: { ...validationConfig.trademark, enabled } })
              }
              onCanFailChange={(canFail) =>
                updateConfig({ trademark: { ...validationConfig.trademark, canFail } })
              }
            />
          </div>
        )}
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

function ValidationStepRow({
  label,
  description,
  enabled,
  canFail,
  onToggle,
  onCanFailChange,
  noBorder = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  canFail: boolean;
  onToggle: (enabled: boolean) => void;
  onCanFailChange: (canFail: boolean) => void;
  noBorder?: boolean;
}) {
  return (
    <div className={noBorder ? "" : "border border-[var(--border)] rounded-md p-3"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="rounded border-[var(--border)] shrink-0"
          />
          <div className="min-w-0">
            <span className={`text-sm font-medium ${!enabled ? "text-[var(--muted-foreground)]" : ""}`}>
              {label}
            </span>
            <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
              {description}
            </p>
          </div>
        </div>
        <select
          value={canFail ? "fail" : "warn"}
          onChange={(e) => onCanFailChange(e.target.value === "fail")}
          disabled={!enabled}
          className="text-xs border border-[var(--border)] rounded-md px-2 py-1 bg-transparent disabled:opacity-50 shrink-0"
        >
          <option value="warn">Warn</option>
          <option value="fail">Fail</option>
        </select>
      </div>
    </div>
  );
}
