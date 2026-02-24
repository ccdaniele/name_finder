"use client";

import { useState } from "react";
import type { PreferenceSummary, UsptoClass } from "@/lib/types";

interface SummaryStepProps {
  summary: PreferenceSummary;
  onConfirm: (updated: PreferenceSummary) => void;
  onBack: () => void;
}

const COMMON_CLASSES: UsptoClass[] = [
  { classNumber: 9, className: "Downloadable Software", rationale: "Covers downloadable software, mobile apps, computer programs" },
  { classNumber: 35, className: "Business Services", rationale: "Covers advertising, business management, e-commerce platforms" },
  { classNumber: 38, className: "Telecommunications", rationale: "Covers streaming, messaging, data transmission services" },
  { classNumber: 41, className: "Education & Entertainment", rationale: "Covers online learning, gaming, digital content publishing" },
  { classNumber: 42, className: "Technology Services (SaaS)", rationale: "Covers SaaS, cloud computing, software development services" },
];

export function SummaryStep({ summary, onConfirm, onBack }: SummaryStepProps) {
  const [editedSummary, setEditedSummary] = useState(summary);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const selectedClassNumbers = editedSummary.usptoClasses.map(
    (c) => c.classNumber
  );

  const toggleClass = (cls: UsptoClass) => {
    if (selectedClassNumbers.includes(cls.classNumber)) {
      setEditedSummary({
        ...editedSummary,
        usptoClasses: editedSummary.usptoClasses.filter(
          (c) => c.classNumber !== cls.classNumber
        ),
      });
    } else {
      setEditedSummary({
        ...editedSummary,
        usptoClasses: [...editedSummary.usptoClasses, cls],
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Preference Summary</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Review the analysis of your naming preferences. Edit or add trademark
          classes before proceeding.
        </p>
      </div>

      <div className="border border-[var(--border)] rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
            Summary
          </h3>
          <p className="text-sm mt-1 leading-relaxed">{editedSummary.summary}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
              Industry
            </h3>
            <p className="text-sm mt-1">{editedSummary.industry}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
              Target Audience
            </h3>
            <p className="text-sm mt-1">{editedSummary.targetAudience}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
            Brand Personality
          </h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {editedSummary.brandPersonality.map((trait) => (
              <span
                key={trait}
                className="px-2 py-0.5 text-xs rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
            Naming Style Recommendation
          </h3>
          <p className="text-sm mt-1">{editedSummary.namingStyleRecommendation}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
            Key Themes
          </h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {editedSummary.keyThemes.map((theme) => (
              <span
                key={theme}
                className="px-2 py-0.5 text-xs rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* USPTO Classes */}
      <div className="border border-[var(--border)] rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">USPTO Trademark Classes</h3>
          <button
            onClick={() => setShowClassPicker(!showClassPicker)}
            className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {showClassPicker ? "Done" : "Add/Remove Classes"}
          </button>
        </div>

        {showClassPicker && (
          <div className="mb-4 space-y-2">
            {COMMON_CLASSES.map((cls) => (
              <label
                key={cls.classNumber}
                className="flex items-start gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedClassNumbers.includes(cls.classNumber)}
                  onChange={() => toggleClass(cls)}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-medium">
                    Class {cls.classNumber}: {cls.className}
                  </span>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {cls.rationale}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {editedSummary.usptoClasses.map((cls) => (
            <div
              key={cls.classNumber}
              className="bg-[var(--muted)] rounded-md p-3"
            >
              <div className="text-sm font-medium">
                Class {cls.classNumber}: {cls.className}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {cls.rationale}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onConfirm(editedSummary)}
          className="flex-1 px-4 py-3 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
        >
          Confirm & Start Interview
        </button>
      </div>
    </div>
  );
}
