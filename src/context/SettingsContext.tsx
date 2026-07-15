import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { GitHubConfig } from "../lib/github";

export interface Settings {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  workerUrl: string;
  workerSecret: string;
  activeDynastyId: string;
  activeSeasonId: string; // last-viewed season, so the app reopens where you left off
}

const DEFAULT_SETTINGS: Settings = {
  token: "",
  owner: "",
  repo: "",
  branch: "main",
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

  const githubConfig: GitHubConfig | null = useMemo(() => {
    if (!settings.token || !settings.owner || !settings.repo) return null;
    return {
      token: settings.token,
      owner: settings.owner,
      repo: settings.repo,
      branch: settings.branch || "main",
    };
  }, [settings.token, settings.owner, settings.repo, settings.branch]);

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
