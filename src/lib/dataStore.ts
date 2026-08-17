import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import type { DocumentReference } from "firebase/firestore";
import { db } from "./firebase";
import type { DataTables, DynastyMeta, TableName } from "../types/models";

// Data lives per-user in Firestore:
//   users/{uid}/dynasties/{dynastyId}              -> DynastyMeta
//   users/{uid}/dynasties/{dynastyId}/{table}/{id} -> one row per document
// Security rules scope every read/write to request.auth.uid == uid, so a
// signed-in user can only ever touch their own dynasties.

const TABLES: TableName[] = [
  "seasons",
  "games",
  "recruits",
  "season_team_stats",
  "school_prestige",
  "national_landscape",
];

function dynastiesCol(uid: string) {
  return collection(db, "users", uid, "dynasties");
}
function dynastyDoc(uid: string, id: string) {
  return doc(db, "users", uid, "dynasties", id);
}
function tableCol(uid: string, dynastyId: string, table: TableName) {
  return collection(db, "users", uid, "dynasties", dynastyId, table);
}

export async function listDynasties(uid: string): Promise<DynastyMeta[]> {
  const snap = await getDocs(dynastiesCol(uid));
  return snap.docs.map((d) => d.data() as DynastyMeta);
}

export async function createDynasty(
  uid: string,
  meta: Omit<DynastyMeta, "created_at"> & { created_at?: string }
): Promise<void> {
  const next: DynastyMeta = { ...meta, created_at: meta.created_at ?? new Date().toISOString() };
  await setDoc(dynastyDoc(uid, meta.id), next);
}

/** Deletes a dynasty and every row document under it, in chunked batches. */
export async function deleteDynasty(uid: string, dynastyId: string): Promise<void> {
  const refs: DocumentReference[] = [];
  for (const table of TABLES) {
    const snap = await getDocs(tableCol(uid, dynastyId, table));
    for (const d of snap.docs) refs.push(d.ref);
  }
  refs.push(dynastyDoc(uid, dynastyId));
  await deleteInChunks(refs);
}

async function deleteInChunks(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + 400)) batch.delete(ref);
    await batch.commit();
  }
}

// Older rows written before a field was added to the schema won't have it -
// normalize on read so newer UI code (which assumes the field always exists,
// e.g. `season.all_americans.length`) doesn't crash on legacy data.
function normalizeRow(table: TableName, row: Record<string, unknown>): Record<string, unknown> {
  if (table === "recruits") {
    const normalized = { archetype: "", schools_beaten_out: [], gem: false, bust: false, dev_trait: "", ...row };
    // The WR "Deep Threat" archetype was renamed to "Speedster" - rewrite the
    // old value on read so legacy recruits show (and re-save) under the new
    // name and don't fall out of the archetype dropdown.
    if (normalized.archetype === "Deep Threat") normalized.archetype = "Speedster";
    return normalized;
  }
  if (table === "seasons") {
    const s: Record<string, unknown> = {
      ad_goals: [],
      all_americans: [],
      all_conference: [],
      draft_picks: [],
      dynasty_points_spent_staff: 0,
      dynasty_points_spent_facilities: 0,
      nil_recruiting_spend: 0,
      offensive_coordinator: "",
      defensive_coordinator: "",
      support_staff: [],
      ...row,
    };
    // All-American / All-Conference honors gained a `position` field - default
    // it on older rows so the newer UI doesn't hit undefined.
    const withPos = (a: unknown) => ({ position: "", ...(a as object) });
    s.all_americans = (s.all_americans as unknown[]).map(withPos);
    s.all_conference = (s.all_conference as unknown[]).map(withPos);
    return s;
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
      heisman_position: "",
      ...row,
      playoff: { ...emptyPlayoff, ...(row.playoff as object | undefined) },
    };
  }
  return row;
}

export async function readTable<K extends TableName>(
  uid: string,
  dynastyId: string,
  table: K
): Promise<{ rows: DataTables[K] }> {
  const snap = await getDocs(tableCol(uid, dynastyId, table));
  const rows = snap.docs.map((d) => normalizeRow(table, d.data())) as unknown as DataTables[K];
  return { rows };
}

// The `message` params below are ignored (they were git commit messages under
// the old GitHub storage); kept so callers don't need to change.
export async function upsertRow<K extends TableName>(
  uid: string,
  dynastyId: string,
  table: K,
  row: DataTables[K][number] & { id: string },
  _message?: string
): Promise<void> {
  await setDoc(doc(tableCol(uid, dynastyId, table), row.id), row);
}

export async function upsertRows<K extends TableName>(
  uid: string,
  dynastyId: string,
  table: K,
  rows: Array<DataTables[K][number] & { id: string }>,
  _message?: string
): Promise<void> {
  for (let i = 0; i < rows.length; i += 400) {
    const batch = writeBatch(db);
    for (const row of rows.slice(i, i + 400)) {
      batch.set(doc(tableCol(uid, dynastyId, table), row.id), row);
    }
    await batch.commit();
  }
}

export async function deleteRow<K extends TableName>(
  uid: string,
  dynastyId: string,
  table: K,
  id: string,
  _message?: string
): Promise<void> {
  await deleteDoc(doc(tableCol(uid, dynastyId, table), id));
}
