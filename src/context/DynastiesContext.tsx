import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSettings } from "./SettingsContext";
import { listDynasties } from "../lib/dataStore";
import type { DynastyMeta } from "../types/models";

// One shared copy of the dynasty index (data/dynasties.json) so the header
// switcher and the Settings page never drift apart - creating or deleting a
// dynasty in Settings calls refresh() and the header dropdown updates too.
interface DynastiesContextValue {
  dynasties: DynastyMeta[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DynastiesContext = createContext<DynastiesContextValue | undefined>(undefined);

export function DynastiesProvider({ children }: { children: ReactNode }) {
  const { githubConfig } = useSettings();
  const [dynasties, setDynasties] = useState<DynastyMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!githubConfig) {
      setDynasties([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDynasties(await listDynasties(githubConfig));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [githubConfig]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <DynastiesContext.Provider value={{ dynasties, loading, error, refresh }}>
      {children}
    </DynastiesContext.Provider>
  );
}

export function useDynasties(): DynastiesContextValue {
  const ctx = useContext(DynastiesContext);
  if (!ctx) throw new Error("useDynasties must be used within DynastiesProvider");
  return ctx;
}
