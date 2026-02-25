"use client";

import { useState, useCallback, useEffect } from "react";
import type { SavedSearchData } from "@/lib/types";
import {
  loadSavedSearches,
  addSavedSearch as addSavedSearchToStorage,
  deleteSavedSearch as deleteSavedSearchFromStorage,
} from "@/lib/storage/saved-search-storage";

const EMPTY: SavedSearchData = { version: 1, searches: [] };

export function useSavedSearches() {
  const [data, setData] = useState<SavedSearchData>(EMPTY);

  useEffect(() => {
    setData(loadSavedSearches());
  }, []);

  const refresh = useCallback(() => {
    setData(loadSavedSearches());
  }, []);

  const addSearch = useCallback(
    (search: Parameters<typeof addSavedSearchToStorage>[0]) => {
      addSavedSearchToStorage(search);
      refresh();
    },
    [refresh]
  );

  const deleteSearch = useCallback(
    (id: string) => {
      deleteSavedSearchFromStorage(id);
      refresh();
    },
    [refresh]
  );

  return {
    savedSearches: data.searches,
    addSearch,
    deleteSearch,
    refresh,
  };
}
