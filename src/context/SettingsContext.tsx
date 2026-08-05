import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface Settings {
  activeDynastyId: string;
  activeSeasonId: string; // last-viewed season, so the app reopens where you left off
}

const DEFAULT_SETTINGS: Settings = {
  activeDynastyId: "",
  activeSeasonId: "",
};

const STORAGE_KEY = "dynasty-tracker:settings";

interface SettingsContextValue {
  settings: Settings;
  setSettings: (next: Partial<Settings>) => void;
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

  const value = useMemo(() => ({ settings, setSettings }), [settings, setSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
