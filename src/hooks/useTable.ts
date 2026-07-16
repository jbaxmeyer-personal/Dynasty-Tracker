import { useEffect } from "react";
import { useTableCacheContext } from "../context/TableCacheContext";
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
  const ctx = useTableCacheContext();
  const entry = ctx.getEntry(table);

  useEffect(() => {
    if (!entry.loaded && !entry.loading) {
      ctx.refresh(table);
    }
    // Only re-run when the table identity or its loaded/loading state
    // changes - ctx itself is a fresh object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, entry.loaded, entry.loading]);

  return {
    rows: entry.rows as DataTables[K],
    loading: entry.loading,
    error: entry.error,
    refresh: () => ctx.refresh(table),
    save: (row, message) => ctx.save(table, row, message),
    saveMany: (rows, message) => ctx.saveMany(table, rows, message),
    remove: (id, message) => ctx.remove(table, id, message),
  };
}
