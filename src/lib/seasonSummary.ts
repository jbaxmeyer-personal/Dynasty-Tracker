import type { Game, NationalLandscape, Recruit, Season } from "../types/models";
import {
  coachStats,
  conferenceRecord,
  formatRecord,
  gameResult,
  playoffAppearances,
  seasonRecord,
  weekLabel,
  weekSortValue,
  winPct,
} from "./computedStats";

// Builds a complete, paste-friendly plain-text dump of one season: the season
// itself, its schedule, its recruiting class, career stats to date, and the
// National Landscape for that year. Meant to be pasted into a chat to draft a
// recap - so it favors completeness and clarity over brevity.

function ha(prefix: Game["home_away"]): string {
  return prefix === "@" ? "@ " : prefix === "N" ? "vs (N) " : "vs ";
}

function gameLine(g: Game): string {
  const isBye = g.opponent.trim().toUpperCase() === "BYE";
  if (isBye) return `${weekLabel(g.week)}: BYE`;
  const res = gameResult(g);
  const score = res ? ` — ${res} ${g.my_score}-${g.opp_score}${g.ot ? " OT" : ""}` : " — (not played)";
  const myRank = g.my_rank ? `#${g.my_rank} ` : "";
  const oppRank = g.opp_rank ? `#${g.opp_rank} ` : "";
  const tv = g.tv_tier ? ` [${g.tv_tier}]` : "";
  const note = g.notes ? `  (${g.notes})` : "";
  return `${weekLabel(g.week)}: ${myRank}us ${ha(g.home_away)}${oppRank}${g.opponent}${score}${tv}${note}`;
}

function recruitLine(r: Recruit): string {
  const stars = "★".repeat(r.stars);
  const flags = [r.gem ? "GEM" : "", r.bust ? "BUST" : ""].filter(Boolean).join(", ");
  const parts = [
    `${stars} ${r.name || "Unnamed"}`,
    r.position,
    r.archetype,
    `${r.overall} OVR`,
    r.home_state,
    r.dev_trait,
    r.type === "Transfer" ? `Transfer${r.class_year ? ` (${r.class_year})` : ""}` : "HS Signee",
    r.in_season ? "portal" : "",
    flags,
  ].filter(Boolean);
  const beat = r.schools_beaten_out.filter(Boolean);
  const beatStr = beat.length ? `  (beat out: ${beat.join(", ")})` : "";
  const note = r.notes ? `  — ${r.notes}` : "";
  return `- ${parts.join(" · ")}${beatStr}${note}`;
}

function landscapeBlock(l: NationalLandscape): string {
  const p = l.playoff;
  const seeds = [p.seed1, p.seed2, p.seed3, p.seed4, p.seed5, p.seed6, p.seed7, p.seed8, p.seed9, p.seed10, p.seed11, p.seed12]
    .map((s, i) => `${i + 1}. ${s || "-"}`)
    .join("\n");
  const champs = l.conference_champions
    .filter((c) => c.champion)
    .map((c) => `${c.conference}: ${c.champion}`)
    .join("\n");
  const top25 = l.final_top_25
    .map((s, i) => (s ? `${i + 1}. ${s}` : ""))
    .filter(Boolean)
    .join("\n");
  const heisman = l.heisman_winner
    ? `${l.heisman_winner}${l.heisman_position ? ` (${l.heisman_position})` : ""}${l.heisman_school ? ` — ${l.heisman_school}` : ""}`
    : "-";

  return [
    `NATIONAL LANDSCAPE — ${l.year}`,
    `National champion: ${p.champion || "-"}`,
    `Playoff first-round winners: 5v12 ${p.r1_5v12_winner || "-"}, 6v11 ${p.r1_6v11_winner || "-"}, 7v10 ${p.r1_7v10_winner || "-"}, 8v9 ${p.r1_8v9_winner || "-"}`,
    `Quarterfinal winners: ${[p.qf1_winner, p.qf2_winner, p.qf3_winner, p.qf4_winner].filter(Boolean).join(", ") || "-"}`,
    `Semifinal winners: ${[p.sf1_winner, p.sf2_winner].filter(Boolean).join(", ") || "-"}`,
    `Heisman: ${heisman}`,
    "",
    "Playoff seeds:",
    seeds,
    "",
    "Conference champions:",
    champs || "-",
    "",
    "Final Top 25:",
    top25 || "-",
  ].join("\n");
}

export function buildSeasonSummary(args: {
  season: Season;
  seasons: Season[];
  allGames: Game[];
  recruits: Recruit[];
  landscape: NationalLandscape[];
}): string {
  const { season, seasons, allGames, recruits, landscape } = args;

  const seasonGames = allGames
    .filter((g) => g.season_id === season.id)
    .sort((a, b) => weekSortValue(a.week) - weekSortValue(b.week));
  const rec = seasonRecord(allGames, season.id);
  const confRec = conferenceRecord(seasonGames, [season]);

  const seasonRecruits = recruits
    .filter((r) => r.season === season.year)
    .sort((a, b) => b.stars - a.stars || b.overall - a.overall);

  const nl = landscape.find((l) => l.year === season.year);

  const career = coachStats(allGames, seasons);

  const staff = season.support_staff
    .map((s) => `  - ${s.role || "?"}: ${s.name || "?"} (${s.tier})`)
    .join("\n");
  const goals = season.ad_goals.map((g) => `  ${g.met ? "✅" : "⬜"} ${g.goal}`).join("\n");
  const aa = season.all_americans.map((a) => `  - ${a.name}${a.position ? ` (${a.position})` : ""} — ${a.team} team`).join("\n");
  const ac = season.all_conference.map((a) => `  - ${a.name}${a.position ? ` (${a.position})` : ""} — ${a.team} team`).join("\n");
  const draft = season.draft_picks.map((d) => `  - ${d.name}${d.position ? ` (${d.position})` : ""}${d.round ? ` — Rd ${d.round}` : ""}`).join("\n");

  const lines: string[] = [];
  lines.push(`SEASON RECAP DATA — ${season.year} ${season.school}`);
  lines.push("");
  lines.push("== SEASON ==");
  lines.push(`Record: ${formatRecord(rec)} (${formatRecord(confRec)} conference) · win% ${(winPct(rec) * 100).toFixed(1)}%`);
  lines.push(`Final rank: ${season.final_rank ?? "unranked"} · Preseason rank: ${season.preseason_rank ?? "unranked"}`);
  lines.push(`Prestige: ${season.prestige}★ · Team ratings: ${season.ovr_rating} OVR / ${season.off_rating} OFF / ${season.def_rating} DEF`);
  lines.push(`Recruiting class rank: ${season.recruiting_class_rank || "-"} · Toughest place to play: ${season.toughest_place_to_play_rank ?? "-"}`);
  lines.push(`Coordinators: OC ${season.offensive_coordinator || "-"}, DC ${season.defensive_coordinator || "-"}`);
  lines.push(`Dynasty points earned: ${season.dynasty_points_earned} · spent staff/facilities: ${season.dynasty_points_spent_staff}/${season.dynasty_points_spent_facilities}`);
  lines.push(`NIL: roster ${season.nil_roster_spend} · recruiting ${season.nil_recruiting_spend}`);
  if (staff) lines.push("Support staff:\n" + staff);
  if (goals) lines.push("AD goals:\n" + goals);
  if (season.notes) lines.push("Notes: " + season.notes);
  lines.push("");
  lines.push("== SCHEDULE ==");
  lines.push(seasonGames.length ? seasonGames.map(gameLine).join("\n") : "(no games logged)");
  lines.push("");
  lines.push("== HONORS ==");
  lines.push("All-Americans:\n" + (aa || "  (none)"));
  lines.push("All-Conference:\n" + (ac || "  (none)"));
  lines.push("Draft picks:\n" + (draft || "  (none)"));
  lines.push("");
  lines.push(`== RECRUITING CLASS (${season.year}) — ${seasonRecruits.length} signees ==`);
  lines.push(seasonRecruits.length ? seasonRecruits.map(recruitLine).join("\n") : "(no recruits logged)");
  lines.push("");
  lines.push("== CAREER TO DATE ==");
  lines.push(`Seasons: ${career.seasons} · Overall: ${formatRecord(career.record)} (${(career.winPct * 100).toFixed(1)}%)`);
  lines.push(`Conference: ${formatRecord(career.conferenceRecord)} · vs ranked: ${formatRecord(career.rankedRecord)} · Bowl: ${formatRecord(career.bowlRecord)} · Playoff: ${formatRecord(career.playoffRecord)}`);
  lines.push(`Conference titles: ${career.conferenceChampionships} · National titles: ${career.nationalChampionships} · Playoff trips: ${playoffAppearances(allGames)}`);
  lines.push("");
  lines.push(nl ? landscapeBlock(nl) : "== NATIONAL LANDSCAPE ==\n(none entered for this year)");

  return lines.join("\n");
}
