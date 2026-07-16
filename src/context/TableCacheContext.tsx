import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSettings } from "./SettingsContext";
import { deleteRow, readTable, upsertRow, upsertRows } from "../lib/dataStore";
import type { TableName } from "../types/models";

// GitHub's Contents API caches GET responses for up to 60s server-side, so
// re-fetching a table right after writing to it can hand back stale data -
// this bit someone as "my new season took a minute to show up". Since we
// already know what we just wrote, update the shared cache directly instead
// of re-reading it from the network, and share that cache across every page
// (via context) so navigating right after a save sees the same fresh state
// instead of each page doing its own cold fetch.
interface CacheEntry {
  rows: unknown[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

const EMPTY_ENTRY: CacheEntry = { rows: [], loading: false, error: null, loaded: false };

interface TableCacheContextValue {
  getEntry: (table: TableName) => CacheEntry;
  refresh: (table: TableName) => Promise<void>;
  save: (table: TableName, row: { id: string }, message: string) => Promise<void>;
  saveMany: (table: TableName, rows: Array<{ id: string }>, message: string) => Promise<void>;
  remove: (table: TableName, id: string, message: string) => Promise<void>;
}

const TableCacheContext = createContext<TableCacheContextValue | undefined>(undefined);

export function TableCacheProvider({ children }: { children: ReactNode }) {
  const { githubConfig, settings } = useSettings();
  const [cache, setCache] = useState<Map<TableName, CacheEntry>>(new Map());
  const prevDynastyId = useRef(settings.activeDynastyId);
  // Guards re-entrancy independent of the entry's `loading` flag, since a
  // setCache call doesn't make its way back into a fresh `entry.loading`
  // read (via a re-render) until after the current tick - relying on that
  // flag alone let two near-simultaneous mounts both slip through and
  // double-fetch the same table.
  const inFlight = useRef<Set<TableName>>(new Set());

  // Switching dynasties invalidates everything cached under the old one.
  useEffect(() => {
    if (prevDynastyId.current !== settings.activeDynastyId) {
      prevDynastyId.current = settings.activeDynastyId;
      setCache(new Map());
    }
  }, [settings.activeDynastyId]);

  function getEntry(table: TableName): CacheEntry {
    return cache.get(table) ?? EMPTY_ENTRY;
  }

  // Applies patch via a functional updater so back-to-back calls (e.g. a
  // loop of saves during import) each build on the true latest state, not
  // whatever `cache` looked like when the enclosing async function started.
  function updateEntry(table: TableName, updater: (prev: CacheEntry) => CacheEntry) {
    setCache((prev) => {
      const prevEntry = prev.get(table) ?? EMPTY_ENTRY;
      const next = new Map(prev);
      next.set(table, updater(prevEntry));
      return next;
    });
  }

  async function refresh(table: TableName) {
    if (!githubConfig || !settings.activeDynastyId) {
      updateEntry(table, () => ({ rows: [], loading: false, error: null, loaded: true }));
      return;
    }
    if (inFlight.current.has(table)) return;
    inFlight.current.add(table);
    updateEntry(table, (prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { rows } = await readTable(githubConfig, settings.activeDynastyId, table);
      updateEntry(table, (prev) => ({ ...prev, rows, loading: false, error: null, loaded: true }));
    } catch (e) {
      updateEntry(table, (prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      inFlight.current.delete(table);
    }
  }

  async function save(table: TableName, row: { id: string }, message: string) {
    if (!githubConfig || !settings.activeDynastyId) throw new Error("Not configured");
    await upsertRow(githubConfig, settings.activeDynastyId, table, row as never, message);
    updateEntry(table, (prev) => {
      const rows = prev.rows as Array<{ id: string }>;
      const idx = rows.findIndex((r) => r.id === row.id);
      const next = [...rows];
      if (idx >= 0) next[idx] = row;
      else next.push(row);
      return { ...prev, rows: next, loaded: true, error: null };
    });
  }

  async function saveMany(table: TableName, rowsToSave: Array<{ id: string }>, message: string) {
    if (!githubConfig || !settings.activeDynastyId) throw new Error("Not configured");
    await upsertRows(githubConfig, settings.activeDynastyId, table, rowsToSave as never, message);
    updateEntry(table, (prev) => {
      const rows = prev.rows as Array<{ id: string }>;
      const byId = new Map(rows.map((r) => [r.id, r]));
      for (const r of rowsToSave) byId.set(r.id, r);
      return { ...prev, rows: Array.from(byId.values()), loaded: true, error: null };
    });
  }

  async function remove(table: TableName, id: string, message: string) {
    if (!githubConfig || !settings.activeDynastyId) throw new Error("Not configured");
    await deleteRow(githubConfig, settings.activeDynastyId, table, id, message);
    updateEntry(table, (prev) => {
      const rows = prev.rows as Array<{ id: string }>;
      return { ...prev, rows: rows.filter((r) => r.id !== id), loaded: true, error: null };
    });
  }

  const value: TableCacheContextValue = { getEntry, refresh, save, saveMany, remove };

  return <TableCacheContext.Provider value={value}>{children}</TableCacheContext.Provider>;
}

export function useTableCacheContext(): TableCacheContextValue {
  const ctx = useContext(TableCacheContext);
  if (!ctx) throw new Error("useTableCacheContext must be used within TableCacheProvider");
  return ctx;
}
