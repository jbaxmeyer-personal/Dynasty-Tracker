import type { GitHubConfig } from "./github";
import { readJsonFile, writeJsonFile } from "./github";
import type { DataTables, DynastyMeta, TableName } from "../types/models";

const INDEX_PATH = "data/dynasties.json";

function tablePath(dynastyId: string, table: TableName): string {
  return `data/${dynastyId}/${table}.json`;
}

export async function listDynasties(cfg: GitHubConfig): Promise<DynastyMeta[]> {
  const result = await readJsonFile<DynastyMeta[]>(cfg, INDEX_PATH);
  return result?.data ?? [];
}

export async function createDynasty(
  cfg: GitHubConfig,
  meta: Omit<DynastyMeta, "created_at">
): Promise<void> {
  const existing = await readJsonFile<DynastyMeta[]>(cfg, INDEX_PATH);
  const list = existing?.data ?? [];
  if (list.some((d) => d.id === meta.id)) {
    throw new Error(`Dynasty id "${meta.id}" already exists`);
  }
  const next: DynastyMeta = { ...meta, created_at: new Date().toISOString() };
  await writeJsonFile(
    cfg,
    INDEX_PATH,
    [...list, next],
    `Add dynasty: ${meta.name}`,
    existing?.sha
  );
  // Seed empty table files so first reads don't need special-casing.
  const emptyTables: DataTables = {
    seasons: [],
    games: [],
    recruits: [],
    season_team_stats: [],
    school_prestige: [],
  };
  for (const table of Object.keys(emptyTables) as TableName[]) {
    await writeJsonFile(
      cfg,
      tablePath(meta.id, table),
      [],
      `Seed ${table} for dynasty ${meta.name}`
    );
  }
}

export async function readTable<K extends TableName>(
  cfg: GitHubConfig,
  dynastyId: string,
  table: K
): Promise<{ rows: DataTables[K]; sha?: string }> {
  const result = await readJsonFile<DataTables[K]>(cfg, tablePath(dynastyId, table));
  if (!result) return { rows: [] as unknown as DataTables[K] };
  return { rows: result.data, sha: result.sha };
}

/** Replaces the entire table array with `rows` in one commit. */
export async function writeTable<K extends TableName>(
  cfg: GitHubConfig,
  dynastyId: string,
  table: K,
  rows: DataTables[K],
  message: string,
  sha?: string
): Promise<void> {
  await writeJsonFile(cfg, tablePath(dynastyId, table), rows, message, sha);
}

/** Read-modify-write helper: fetches current sha, applies `mutate`, writes back. */
export async function upsertRow<K extends TableName>(
  cfg: GitHubConfig,
  dynastyId: string,
  table: K,
  row: DataTables[K][number] & { id: string },
  message: string
): Promise<void> {
  const { rows, sha } = await readTable(cfg, dynastyId, table);
  const idx = (rows as Array<{ id: string }>).findIndex((r) => r.id === row.id);
  const next = [...rows] as Array<{ id: string }>;
  if (idx >= 0) next[idx] = row;
  else next.push(row);
  await writeTable(cfg, dynastyId, table, next as DataTables[K], message, sha);
}

export async function deleteRow<K extends TableName>(
  cfg: GitHubConfig,
  dynastyId: string,
  table: K,
  id: string,
  message: string
): Promise<void> {
  const { rows, sha } = await readTable(cfg, dynastyId, table);
  const next = (rows as Array<{ id: string }>).filter((r) => r.id !== id);
  await writeTable(cfg, dynastyId, table, next as DataTables[K], message, sha);
}
