import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";
import { listDynasties } from "../lib/dataStore";
import type { DynastyMeta } from "../types/models";

// One shared copy of the signed-in user's dynasty index so the header switcher
// and the Settings page never drift apart - creating or deleting a dynasty in
// Settings calls refresh() and the header dropdown updates too.
interface DynastiesContextValue {
  dynasties: DynastyMeta[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DynastiesContext = createContext<DynastiesContextValue | undefined>(undefined);

export function DynastiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setSettings } = useSettings();
  const [dynasties, setDynasties] = useState<DynastyMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The active dynasty/season are remembered in localStorage, but they belong
  // to whoever was last signed in. When the account changes, clear them so one
  // user never lands on another user's (now inaccessible) selection.
  const prevUid = useRef<string | null>(user?.uid ?? null);
  useEffect(() => {
    const uid = user?.uid ?? null;
    if (prevUid.current !== uid) {
      prevUid.current = uid;
      setSettings({ activeDynastyId: "", activeSeasonId: "" });
    }
  }, [user, setSettings]);

  const refresh = useCallback(async () => {
    if (!user) {
      setDynasties([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDynasties(await listDynasties(user.uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

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
