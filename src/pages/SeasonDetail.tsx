import { Link, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamLogo } from "../components/TeamLogo";
import { formatRecord, gameResult, seasonRecord } from "../lib/computedStats";
import type { Week } from "../types/models";

function weekLabel(week: Week): string {
  if (week === "CC") return "Conf. Champ";
  if (week === "Bowl") return "Bowl";
  return `Week ${week}`;
}

export function SeasonDetailPage() {
  const { id } = useParams();
  const { rows: seasons, loading: seasonsLoading } = useTable("seasons");
  const { rows: games, loading: gamesLoading } = useTable("games");

  const season = seasons.find((s) => s.id === id);
  const seasonGames = games
    .filter((g) => g.season_id === id)
    .sort((a, b) => weekSort(a.week) - weekSort(b.week));

  if (seasonsLoading || gamesLoading) return <div className="page">Loading...</div>;
  if (!season) return <div className="page">Season not found.</div>;

  const record = seasonRecord(games, season.id);

  return (
    <div className="page">
      <div className="page-header">
        <div className="list-row">
          <TeamLogo school={season.school} size={40} />
          <div>
            <h1 style={{ margin: 0 }}>
              {season.year} {season.school}
            </h1>
            <div className="muted small">
              {formatRecord(record)} · Prestige {season.prestige}★ · Ovr {season.ovr_rating} / Off{" "}
              {season.off_rating} / Def {season.def_rating}
            </div>
          </div>
        </div>
        <Link className="button" to={`/seasons/${season.id}/edit`}>
          Edit season
        </Link>
      </div>

      <section className="card">
        <div className="grid-2col small">
          <div>Preseason rank: {season.preseason_rank ?? "-"}</div>
          <div>Final rank: {season.final_rank ?? "-"}</div>
          <div>Recruiting class: {season.recruiting_class_rank || "-"}</div>
          <div>Toughest place to play: {season.toughest_place_to_play_rank ?? "-"}</div>
          <div>NIL total: {season.nil_total.toLocaleString()}</div>
          <div>Roster NIL: {season.nil_roster_spend.toLocaleString()}</div>
          <div>Dynasty points: {season.dynasty_points_earned}</div>
          <div>Conf champ opponent: {season.conf_champ_opponent || "-"}</div>
          <div>
            Bowl: {season.bowl_name || "-"} vs {season.bowl_opponent || "-"} (
            {season.bowl_result || "-"})
          </div>
        </div>
        {season.ad_goals.length > 0 && (
          <>
            <h3>AD goals</h3>
            <ul className="list">
              {season.ad_goals.map((g, i) => (
                <li key={i}>
                  {g.met ? "✅" : "⬜"} {g.goal}
                </li>
              ))}
            </ul>
          </>
        )}
        {season.notes && (
          <>
            <h3>Notes</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{season.notes}</p>
          </>
        )}
      </section>

      <div className="page-header">
        <h2>Games</h2>
        <Link className="button" to={`/seasons/${season.id}/games/new`}>
          + Add game
        </Link>
      </div>
      <ul className="list">
        {seasonGames.map((g) => {
          const res = gameResult(g);
          return (
            <li key={g.id}>
              <Link to={`/seasons/${season.id}/games/${g.id}`} className="list-row">
                <span className={`result-badge result-${res ?? "none"}`}>{res ?? "-"}</span>
                {g.opponent && g.opponent !== "BYE" && <TeamLogo school={g.opponent} size={28} />}
                <div className="list-row-main">
                  <strong>{weekLabel(g.week)}</strong> {g.home_away}
                  {g.opponent}{" "}
                  {g.my_score != null && g.opp_score != null
                    ? `${g.my_score}-${g.opp_score}${g.ot ? " OT" : ""}`
                    : ""}
                  {g.opp_rank ? ` (#${g.opp_rank})` : ""}
                  <div className="muted small">{g.notes.slice(0, 100)}</div>
                </div>
              </Link>
            </li>
          );
        })}
        {seasonGames.length === 0 && <p className="muted">No games logged yet.</p>}
      </ul>
    </div>
  );
}

function weekSort(week: Week): number {
  if (week === "CC") return 100;
  if (week === "Bowl") return 101;
  return week;
}
