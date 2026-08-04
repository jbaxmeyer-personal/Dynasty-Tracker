import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { GitHubConfig } from "../lib/github";
import { GITHUB_BRANCH, GITHUB_OWNER, GITHUB_REPO } from "../config";

export interface Settings {
  token: string;
  workerUrl: string;
  workerSecret: string;
  activeDynastyId: string;
  activeSeasonId: string; // last-viewed season, so the app reopens where you left off
}

const DEFAULT_SETTINGS: Settings = {
  token: "",
  workerUrl: "",
  workerSecret: "",
  activeDynastyId: "",
  activeSeasonId: "",
};

const STORAGE_KEY = "dynasty-tracker:settings";

interface SettingsContextValue {
  settings: Settings;
  setSettings: (next: Partial<Settings>) => void;
  githubConfig: GitHubConfig | null;
  isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setSettings = useCallback(
    (next: Partial<Settings>) => setSettingsState((prev) => ({ ...prev, ...next })),
    []
  );

  // Owner/repo/branch are baked in (see config.ts) - the only thing a user
  // provides is the token, so a token is all it takes to be connected.
  const githubConfig: GitHubConfig | null = useMemo(() => {
    if (!settings.token) return null;
    return {
      token: settings.token,
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
    };
  }, [settings.token]);

  const isConfigured = githubConfig !== null && !!settings.activeDynastyId;

  const value = useMemo(
    () => ({ settings, setSettings, githubConfig, isConfigured }),
    [settings, setSettings, githubConfig, isConfigured]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
