"use client";

import type { FailedName } from "@/lib/types";

interface FailedNameCardProps {
  failedName: FailedName;
}

const STEP_LABELS: Record<string, string> = {
  web_search: "Web Search",
  domain: "Domain Check",
  trademark: "Trademark Search",
};

export function FailedNameCard({ failedName }: FailedNameCardProps) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-4 opacity-60">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium line-through">
            {failedName.generated.name}
          </span>
          <span className="ml-2 text-xs text-red-500">
            Failed at {STEP_LABELS[failedName.failureStep]}
          </span>
        </div>
      </div>
      <p className="text-xs text-[var(--muted-foreground)] mt-1">
        {failedName.failureReason}
      </p>
    </div>
  );
}
