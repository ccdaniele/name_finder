"use client";

import { estimateCosts } from "@/lib/ai/cost-estimator";

interface CostEstimateProps {
  nameCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CostEstimate({ nameCount, onConfirm, onCancel }: CostEstimateProps) {
  const estimate = estimateCosts(nameCount);

  return (
    <div className="border border-[var(--border)] rounded-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Estimated API Usage</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">AI tokens (input)</span>
          <span>{estimate.aiTokens.input.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">AI tokens (output)</span>
          <span>{estimate.aiTokens.output.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Web search calls</span>
          <span>~{estimate.webSearchCalls}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Domain checks</span>
          <span>~{estimate.domainCheckCalls}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Trademark searches</span>
          <span>~{estimate.trademarkSearchCalls}</span>
        </div>
        <hr className="border-[var(--border)]" />
        <div className="flex justify-between font-medium">
          <span>Estimated AI cost</span>
          <span>${estimate.totalEstimatedCost.toFixed(2)}</span>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Web search, domain, and trademark API calls use free-tier quotas.
          Actual costs may vary based on replacement rounds.
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
        >
          Start Generation
        </button>
      </div>
    </div>
  );
}
