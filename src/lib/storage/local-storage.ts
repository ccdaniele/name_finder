import type { SessionData } from "@/lib/types";

const STORAGE_KEY = "name-generator-session";

export function saveSession(data: SessionData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

export function loadSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function createNewSession(requestedCount: number): SessionData {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    validatedNames: [],
    failedNames: [],
    requestedCount,
  };
}
