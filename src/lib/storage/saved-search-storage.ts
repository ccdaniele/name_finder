import type { SavedSearch, SavedSearchData } from "@/lib/types";

const KEY = "name-generator-saved-searches";
const MAX = 5;

function getDefault(): SavedSearchData {
  return { version: 1, searches: [] };
}

export function loadSavedSearches(): SavedSearchData {
  if (typeof window === "undefined") return getDefault();
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return getDefault();
    return JSON.parse(stored) as SavedSearchData;
  } catch {
    return getDefault();
  }
}

function save(data: SavedSearchData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save searches:", error);
  }
}

export function addSavedSearch(search: SavedSearch): void {
  const data = loadSavedSearches();
  while (data.searches.length >= MAX) {
    data.searches.shift();
  }
  data.searches.push(search);
  save(data);
}

export function deleteSavedSearch(id: string): void {
  const data = loadSavedSearches();
  data.searches = data.searches.filter((s) => s.id !== id);
  save(data);
}
