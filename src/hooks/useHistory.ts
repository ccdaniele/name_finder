"use client";

import { useState, useCallback, useEffect } from "react";
import {
  loadHistory,
  addNamesToExclusions as addNamesToExclusionsStorage,
  removeExclusion as removeExclusionFromStorage,
  clearExclusionList,
  importExclusions as importExclusionsToStorage,
  addManualExclusions as addManualToStorage,
  deleteSearchFromHistory,
  clearHistory,
} from "@/lib/storage/history-storage";
import type {
  HistoryData,
  ExclusionEntry,
  ValidatedName,
  FailedName,
} from "@/lib/types";

const EMPTY_HISTORY: HistoryData = { version: 1, searches: [], exclusionList: [] };

export function useHistory() {
  const [data, setData] = useState<HistoryData>(EMPTY_HISTORY);

  // Hydrate from localStorage after mount to avoid SSR/client mismatch
  useEffect(() => {
    setData(loadHistory());
  }, []);

  const refresh = useCallback(() => {
    setData(loadHistory());
  }, []);

  const addExclusions = useCallback(
    (searchId: string, validatedNames: ValidatedName[], failedNames: FailedName[]) => {
      addNamesToExclusionsStorage(searchId, validatedNames, failedNames);
      refresh();
    },
    [refresh]
  );

  const removeExclusion = useCallback(
    (name: string) => {
      removeExclusionFromStorage(name);
      refresh();
    },
    [refresh]
  );

  const clearExclusions = useCallback(() => {
    clearExclusionList();
    refresh();
  }, [refresh]);

  const importExclusions = useCallback(
    (entries: ExclusionEntry[]) => {
      importExclusionsToStorage(entries);
      refresh();
    },
    [refresh]
  );

  const addManual = useCallback(
    (names: string[]) => {
      addManualToStorage(names);
      refresh();
    },
    [refresh]
  );

  const deleteSearch = useCallback(
    (id: string) => {
      deleteSearchFromHistory(id);
      refresh();
    },
    [refresh]
  );

  const clearAll = useCallback(
    (preserveExclusions: boolean) => {
      clearHistory(preserveExclusions);
      refresh();
    },
    [refresh]
  );

  return {
    exclusionList: data.exclusionList,
    exclusionNames: data.exclusionList.map((e) => e.name),
    addExclusions,
    removeExclusion,
    clearExclusions,
    importExclusions,
    addManual,
    deleteSearch,
    clearAll,
    refresh,
  };
}
