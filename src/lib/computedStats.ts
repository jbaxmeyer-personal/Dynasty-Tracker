import type { Game, Season } from "../types/models";

export type GameResult = "W" | "L" | "T";

export function gameResult(g: Game): GameResult | null {
  if (g.my_score == null || g.opp_score == null) return null;
  if (g.my_score > g.opp_score) return "W";
  if (g.my_score < g.opp_score) return "L";
  return "T";
}

export function isBye(g: Game): boolean {
  return g.opponent.trim().toUpperCase() === "BYE" || g.my_score == null;
}

export interface RecordSummary {
  wins: number;
  losses: number;
  ties: number;
}

function tally(games: Game[]): RecordSummary {
  const r: RecordSummary = { wins: 0, losses: 0, ties: 0 };
  for (const g of games) {
    if (isBye(g)) continue;
    const res = gameResult(g);
    if (res === "W") r.wins++;
    else if (res === "L") r.losses++;
    else if (res === "T") r.ties++;
  }
  return r;
}

export function winPct(r: RecordSummary): number {
  const total = r.wins + r.losses + r.ties;
  if (total === 0) return 0;
  return (r.wins + r.ties * 0.5) / total;
}

export function seasonRecord(games: Game[], seasonId: string): RecordSummary {
  return tally(games.filter((g) => g.season_id === seasonId));
}

export function careerRecord(games: Game[]): RecordSummary {
  return tally(games);
}

export function homeAwayRecord(games: Game[]): { home: RecordSummary; away: RecordSummary; neutral: RecordSummary } {
  return {
    home: tally(games.filter((g) => g.home_away === "")),
    away: tally(games.filter((g) => g.home_away === "@")),
    neutral: tally(games.filter((g) => g.home_away === "N")),
  };
}

export function bowlRecord(games: Game[]): RecordSummary {
  return tally(games.filter((g) => g.week === "Bowl"));
}

export function rankedRecord(games: Game[]): RecordSummary {
  return tally(games.filter((g) => g.opp_rank != null));
}

export function tvTierSplits(games: Game[]): Record<string, RecordSummary> {
  const tiers = ["Regional", "National", "Gameday"] as const;
  const out: Record<string, RecordSummary> = {};
  for (const tier of tiers) {
    out[tier] = tally(games.filter((g) => g.tv_tier === tier));
  }
  return out;
}

/** Longest current streak, e.g. "W4" or "L2". Based on chronological order (season year, then week). */
export function currentStreak(games: Game[], seasons: Season[]): string {
  const seasonYear = new Map(seasons.map((s) => [s.id, s.year]));
  const played = games
    .filter((g) => !isBye(g))
    .slice()
    .sort((a, b) => {
      const ya = seasonYear.get(a.season_id) ?? 0;
      const yb = seasonYear.get(b.season_id) ?? 0;
      if (ya !== yb) return ya - yb;
      return weekSortValue(a.week) - weekSortValue(b.week);
    });
  if (played.length === 0) return "-";
  let streakType: GameResult | null = null;
  let count = 0;
  for (let i = played.length - 1; i >= 0; i--) {
    const res = gameResult(played[i]);
    if (res === null) break;
    if (streakType === null) {
      streakType = res;
      count = 1;
    } else if (res === streakType) {
      count++;
    } else {
      break;
    }
  }
  return streakType ? `${streakType}${count}` : "-";
}

function weekSortValue(week: Game["week"]): number {
  if (week === "CC") return 100;
  if (week === "Bowl") return 101;
  return week;
}

/** Career record broken down by opponent school. */
export function vsOpponent(games: Game[]): Map<string, RecordSummary> {
  const map = new Map<string, RecordSummary>();
  for (const g of games) {
    if (isBye(g)) continue;
    const existing = map.get(g.opponent) ?? { wins: 0, losses: 0, ties: 0 };
    const res = gameResult(g);
    if (res === "W") existing.wins++;
    else if (res === "L") existing.losses++;
    else if (res === "T") existing.ties++;
    map.set(g.opponent, existing);
  }
  return map;
}

export interface CoachStats {
  record: RecordSummary;
  winPct: number;
  seasons: number;
  bowlRecord: RecordSummary;
  rankedRecord: RecordSummary;
}

export function coachStats(games: Game[], seasons: Season[]): CoachStats {
  const record = careerRecord(games);
  return {
    record,
    winPct: winPct(record),
    seasons: seasons.length,
    bowlRecord: bowlRecord(games),
    rankedRecord: rankedRecord(games),
  };
}

export function formatRecord(r: RecordSummary): string {
  return r.ties > 0 ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}
