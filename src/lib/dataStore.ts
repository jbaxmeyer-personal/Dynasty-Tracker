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
    national_landscape: [],
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

// Older rows written before a field was added to the schema won't have it in
// their stored JSON - normalize on read so newer UI code (which assumes the
// field always exists, e.g. `season.all_americans.length`) doesn't crash on
// data saved by an earlier version of the app.
function normalizeRow(table: TableName, row: Record<string, unknown>): Record<string, unknown> {
  if (table === "seasons") {
    return {
      ad_goals: [],
      all_americans: [],
      all_conference: [],
      draft_picks: [],
      ...row,
    };
  }
  if (table === "national_landscape") {
    const emptyPlayoff = {
      seed1: "", seed2: "", seed3: "", seed4: "",
      seed5: "", seed6: "", seed7: "", seed8: "",
      seed9: "", seed10: "", seed11: "", seed12: "",
      r1_5v12_winner: "", r1_6v11_winner: "", r1_7v10_winner: "", r1_8v9_winner: "",
      qf1_winner: "", qf2_winner: "", qf3_winner: "", qf4_winner: "",
      sf1_winner: "", sf2_winner: "", champion: "",
    };
    return {
      conference_champions: [],
      final_top_25: Array(25).fill(""),
      heisman_school: "",
      ...row,
      playoff: { ...emptyPlayoff, ...(row.playoff as object | undefined) },
    };
  }
  return row;
}

export async function readTable<K extends TableName>(
  cfg: GitHubConfig,
  dynastyId: string,
  table: K
): Promise<{ rows: DataTables[K]; sha?: string }> {
  const result = await readJsonFile<DataTables[K]>(cfg, tablePath(dynastyId, table));
  if (!result) return { rows: [] as unknown as DataTables[K] };
  const rows = (result.data as unknown as Record<string, unknown>[]).map((row) =>
    normalizeRow(table, row)
  ) as unknown as DataTables[K];
  return { rows, sha: result.sha };
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

/** Upserts many rows in a single commit (e.g. setting up a whole season's schedule at once). */
export async function upsertRows<K extends TableName>(
  cfg: GitHubConfig,
  dynastyId: string,
  table: K,
  rows_: Array<DataTables[K][number] & { id: string }>,
  message: string
): Promise<void> {
  const { rows, sha } = await readTable(cfg, dynastyId, table);
  const byId = new Map((rows as Array<{ id: string }>).map((r) => [r.id, r]));
  for (const row of rows_) byId.set(row.id, row);
  await writeTable(cfg, dynastyId, table, Array.from(byId.values()) as DataTables[K], message, sha);
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
