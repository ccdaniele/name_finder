import type { ValidationConfig } from "@/lib/types";

const CONFIG_KEY = "name-generator-validation-config";

const DEFAULT_CONFIG: ValidationConfig = {
  webSearch: { enabled: true, canFail: false },
  domain: { enabled: true, canFail: true, tlds: [".com"] },
  trademark: { enabled: true, canFail: false },
};

export function getDefaultValidationConfig(): ValidationConfig {
  return structuredClone(DEFAULT_CONFIG);
}

export function loadValidationConfig(): ValidationConfig {
  if (typeof window === "undefined") return getDefaultValidationConfig();
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (!stored) return getDefaultValidationConfig();
    return JSON.parse(stored) as ValidationConfig;
  } catch {
    return getDefaultValidationConfig();
  }
}

export function saveValidationConfig(config: ValidationConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save validation config:", error);
  }
}
