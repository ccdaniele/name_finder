import type {
  HistoryData,
  SearchHistoryEntry,
  ExclusionEntry,
  ExclusionListExport,
  ValidatedName,
  FailedName,
} from "@/lib/types";

const HISTORY_KEY = "name-generator-history";
const MAX_SEARCHES = 5;

function getDefaultHistory(): HistoryData {
  return { version: 1, searches: [], exclusionList: [] };
}

export function loadHistory(): HistoryData {
  if (typeof window === "undefined") return getDefaultHistory();
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return getDefaultHistory();
    return JSON.parse(stored) as HistoryData;
  } catch {
    return getDefaultHistory();
  }
}

export function saveHistory(data: HistoryData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
}

export function addSearchNamesToExclusions(
  data: HistoryData,
  searchId: string,
  validatedNames: ValidatedName[],
  failedNames: FailedName[]
): void {
  const now = new Date().toISOString();
  const existingNames = new Set(
    data.exclusionList.map((e) => e.name.toLowerCase())
  );

  for (const v of validatedNames) {
    if (!existingNames.has(v.generated.name.toLowerCase())) {
      data.exclusionList.push({
        name: v.generated.name,
        source: "search-passed",
        sourceSearchId: searchId,
        addedAt: now,
      });
      existingNames.add(v.generated.name.toLowerCase());
    }
  }

  for (const f of failedNames) {
    if (!existingNames.has(f.generated.name.toLowerCase())) {
      data.exclusionList.push({
        name: f.generated.name,
        source: "search-failed",
        sourceSearchId: searchId,
        addedAt: now,
      });
      existingNames.add(f.generated.name.toLowerCase());
    }
  }
}

export function addSearchToHistory(entry: SearchHistoryEntry): void {
  const data = loadHistory();

  // FIFO eviction — remove oldest if at capacity
  while (data.searches.length >= MAX_SEARCHES) {
    data.searches.shift();
  }

  data.searches.push(entry);

  // Add all names from this search to exclusions
  addSearchNamesToExclusions(
    data,
    entry.id,
    entry.validatedNames,
    entry.failedNames
  );

  saveHistory(data);
}

export function addNamesToExclusions(
  searchId: string,
  validatedNames: ValidatedName[],
  failedNames: FailedName[]
): void {
  const data = loadHistory();
  addSearchNamesToExclusions(data, searchId, validatedNames, failedNames);
  saveHistory(data);
}

export function getExclusionNames(): string[] {
  const data = loadHistory();
  return data.exclusionList.map((e) => e.name);
}

export function getExclusionEntries(): ExclusionEntry[] {
  const data = loadHistory();
  return data.exclusionList;
}

export function removeExclusion(name: string): void {
  const data = loadHistory();
  data.exclusionList = data.exclusionList.filter(
    (e) => e.name.toLowerCase() !== name.toLowerCase()
  );
  saveHistory(data);
}

export function clearExclusionList(): void {
  const data = loadHistory();
  data.exclusionList = [];
  saveHistory(data);
}

export function importExclusions(entries: ExclusionEntry[]): void {
  const data = loadHistory();
  const existingNames = new Set(
    data.exclusionList.map((e) => e.name.toLowerCase())
  );
  const now = new Date().toISOString();

  for (const entry of entries) {
    if (!existingNames.has(entry.name.toLowerCase())) {
      data.exclusionList.push({
        name: entry.name,
        source: entry.source || "manual-import",
        sourceSearchId: entry.sourceSearchId,
        addedAt: entry.addedAt || now,
      });
      existingNames.add(entry.name.toLowerCase());
    }
  }

  saveHistory(data);
}

export function addManualExclusions(names: string[]): void {
  const data = loadHistory();
  const existingNames = new Set(
    data.exclusionList.map((e) => e.name.toLowerCase())
  );
  const now = new Date().toISOString();

  for (const name of names) {
    const trimmed = name.trim();
    if (trimmed && !existingNames.has(trimmed.toLowerCase())) {
      data.exclusionList.push({
        name: trimmed,
        source: "manual-add",
        addedAt: now,
      });
      existingNames.add(trimmed.toLowerCase());
    }
  }

  saveHistory(data);
}

export function exportExclusionList(): ExclusionListExport {
  const data = loadHistory();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: data.exclusionList,
  };
}

export function deleteSearchFromHistory(searchId: string): void {
  const data = loadHistory();
  data.searches = data.searches.filter((s) => s.id !== searchId);
  saveHistory(data);
}

export function clearHistory(preserveExclusions: boolean): void {
  const data = loadHistory();
  data.searches = [];
  if (!preserveExclusions) {
    data.exclusionList = [];
  }
  saveHistory(data);
}
