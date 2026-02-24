import { withRetry } from "@/lib/utils/retry";
import { phoneticSimilarity, normalizedSimilarity } from "@/lib/utils/similarity";
import type { TrademarkResult, TrademarkConflict } from "@/lib/types";

const RAPIDAPI_HOST = "uspto-trademark.p.rapidapi.com";

interface RapidApiTrademarkItem {
  keyword?: string;
  serialnumber?: string;
  registrationnumber?: string;
  description?: string;
  code?: string;
  status_label?: string;
  status_code?: string;
  owner?: string;
}

interface RapidApiResponse {
  count?: number;
  items?: RapidApiTrademarkItem[];
}

function extractClassNumbers(code: string | undefined): number[] {
  if (!code) return [];
  return code
    .split(/[,;\s]+/)
    .map((c) => parseInt(c.trim(), 10))
    .filter((n) => !isNaN(n));
}

async function searchUSPTOTrademarks(
  name: string
): Promise<RapidApiResponse> {
  const response = await withRetry(async () => {
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/v1/trademarkSearch/${encodeURIComponent(name)}/active`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      }
    );

    if (!res.ok) {
      const error = new Error(
        `RapidAPI USPTO error: ${res.status}`
      ) as Error & { status: number };
      error.status = res.status;
      throw error;
    }

    return res.json();
  });

  return response;
}

export async function searchTrademarks(
  name: string,
  usptoClasses: number[]
): Promise<TrademarkResult> {
  try {
    const data = await searchUSPTOTrademarks(name);
    const conflicts: TrademarkConflict[] = [];

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const tmName = item.keyword || "";
        const phonetic = phoneticSimilarity(name, tmName);
        const visual = normalizedSimilarity(name, tmName);
        const combinedSimilarity = Math.max(phonetic, visual);

        const itemClasses = extractClassNumbers(item.code);
        const classOverlap = usptoClasses.some((c) => itemClasses.includes(c));

        // Flag as conflict if:
        // - High similarity (>0.7) regardless of class
        // - Moderate similarity (>0.5) AND class overlap
        if (combinedSimilarity > 0.7 || (combinedSimilarity > 0.5 && classOverlap)) {
          conflicts.push({
            registeredName: tmName,
            serialNumber: item.serialnumber || "",
            status: item.status_label || item.status_code || "unknown",
            similarityScore: combinedSimilarity,
            overlappingClasses: classOverlap,
            classNumbers: itemClasses,
          });
        }
      }
    }

    // Blocking conflict: high similarity + same class
    const hasBlockingConflict = conflicts.some(
      (c) => c.similarityScore > 0.85 && c.overlappingClasses
    );

    return {
      passed: !hasBlockingConflict,
      conflicts: conflicts.sort(
        (a, b) => b.similarityScore - a.similarityScore
      ),
      riskLevel: hasBlockingConflict
        ? "high"
        : conflicts.length > 0
          ? "medium"
          : "low",
    };
  } catch (error) {
    console.error(`Trademark search failed for "${name}":`, error);
    return {
      passed: true,
      conflicts: [],
      riskLevel: "low",
    };
  }
}
