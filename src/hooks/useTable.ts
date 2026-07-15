import { useCallback, useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { deleteRow, readTable, upsertRow, upsertRows } from "../lib/dataStore";
import type { DataTables, TableName } from "../types/models";

interface UseTableResult<K extends TableName> {
  rows: DataTables[K];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (row: DataTables[K][number] & { id: string }, message: string) => Promise<void>;
  saveMany: (rows: Array<DataTables[K][number] & { id: string }>, message: string) => Promise<void>;
  remove: (id: string, message: string) => Promise<void>;
}

export function useTable<K extends TableName>(table: K): UseTableResult<K> {
  const { githubConfig, settings } = useSettings();
  const [rows, setRows] = useState<DataTables[K]>([] as unknown as DataTables[K]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!githubConfig || !settings.activeDynastyId) {
      setRows([] as unknown as DataTables[K]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { rows: next } = await readTable(githubConfig, settings.activeDynastyId, table);
      setRows(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [githubConfig, settings.activeDynastyId, table]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (row: DataTables[K][number] & { id: string }, message: string) => {
      if (!githubConfig || !settings.activeDynastyId) throw new Error("Not configured");
      await upsertRow(githubConfig, settings.activeDynastyId, table, row, message);
      await refresh();
    },
    [githubConfig, settings.activeDynastyId, table, refresh]
  );

  const saveMany = useCallback(
    async (rowsToSave: Array<DataTables[K][number] & { id: string }>, message: string) => {
      if (!githubConfig || !settings.activeDynastyId) throw new Error("Not configured");
      await upsertRows(githubConfig, settings.activeDynastyId, table, rowsToSave, message);
      await refresh();
    },
    [githubConfig, settings.activeDynastyId, table, refresh]
  );

  const remove = useCallback(
    async (id: string, message: string) => {
      if (!githubConfig || !settings.activeDynastyId) throw new Error("Not configured");
      await deleteRow(githubConfig, settings.activeDynastyId, table, id, message);
      await refresh();
    },
    [githubConfig, settings.activeDynastyId, table, refresh]
  );

  return { rows, loading, error, refresh, save, saveMany, remove };
}
