import { Link, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamLogo } from "../components/TeamLogo";
import { teamGradient } from "../lib/teamColors";
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
      <div className="hero-card" style={{ background: teamGradient(season.school) }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="list-row">
            <TeamLogo school={season.school} size={44} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.4rem" }}>
                {season.year} {season.school}
              </h1>
              <div className="muted small">
                {formatRecord(record)} · {season.prestige}★ prestige
              </div>
            </div>
          </div>
          <Link className="button" to={`/seasons/${season.id}/edit`}>
            Edit
          </Link>
        </div>
        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="stat-label">Rank</div>
            <div className="stat-value">{season.preseason_rank ?? "NR"} → {season.final_rank ?? "-"}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Ovr / Off / Def</div>
            <div className="stat-value">{season.ovr_rating}/{season.off_rating}/{season.def_rating}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Dynasty pts</div>
            <div className="stat-value">{season.dynasty_points_earned}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Recruiting class</div>
            <div className="stat-value">{season.recruiting_class_rank || "-"}</div>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="grid-2col small">
          <div>Toughest place to play: {season.toughest_place_to_play_rank ?? "-"}</div>
          <div>Conf champ opponent: {season.conf_champ_opponent || "-"}</div>
          <div>NIL total: {season.nil_total.toLocaleString()}</div>
          <div>Roster NIL: {season.nil_roster_spend.toLocaleString()}</div>
          <div className="span-2">
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
