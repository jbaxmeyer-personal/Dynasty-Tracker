import { Link } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { useSettings } from "../context/SettingsContext";
import { TeamBadge } from "../components/TeamBadge";
import { currentStreak, formatRecord, seasonRecord } from "../lib/computedStats";

export function DashboardPage() {
  const { isConfigured } = useSettings();
  const { rows: seasons, loading: seasonsLoading } = useTable("seasons");
  const { rows: games, loading: gamesLoading } = useTable("games");
  const { rows: recruits } = useTable("recruits");

  if (!isConfigured) {
    return (
      <div className="page">
        <h1>Welcome</h1>
        <p>
          Head to <Link to="/settings">Settings</Link> to connect your GitHub repo and pick or
          create a dynasty.
        </p>
      </div>
    );
  }

  if (seasonsLoading || gamesLoading) return <div className="page">Loading...</div>;

  const latest = [...seasons].sort((a, b) => b.year - a.year)[0];
  const latestClass = recruits.filter((r) => r.season === latest?.year && r.type !== "Transfer Out");

  return (
    <div className="page">
      <h1>Dashboard</h1>
      {!latest ? (
        <p className="muted">
          No seasons yet. <Link to="/seasons/new">Add your first season</Link>.
        </p>
      ) : (
        <>
          <section className="card">
            <div className="list-row">
              <TeamBadge school={latest.school} size={40} />
              <div>
                <h2 style={{ margin: 0 }}>
                  {latest.year} {latest.school}
                </h2>
                <div className="muted small">
                  {formatRecord(seasonRecord(games, latest.id))} · Streak{" "}
                  {currentStreak(
                    games.filter((g) => g.season_id === latest.id),
                    seasons
                  )}{" "}
                  · Prestige {latest.prestige}★
                </div>
              </div>
            </div>
            <div className="grid-2col small" style={{ marginTop: "1rem" }}>
              <div>Rank: {latest.preseason_rank ?? "-"} → {latest.final_rank ?? "-"}</div>
              <div>Grades: {latest.ovr_grade} / {latest.off_grade} / {latest.def_grade}</div>
              <div>Recruiting class: {latestClass.length} signed</div>
              <div>Dynasty points: {latest.dynasty_points_earned}</div>
            </div>
            <div className="button-row" style={{ marginTop: "1rem" }}>
              <Link className="button" to={`/seasons/${latest.id}`}>
                View season
              </Link>
              <Link className="button" to={`/seasons/${latest.id}/games/new`}>
                + Log game
              </Link>
            </div>
          </section>

          <div className="button-row">
            <Link className="button" to="/seasons">Season history</Link>
            <Link className="button" to="/recruits">Recruiting</Link>
            <Link className="button" to="/career">Career stats</Link>
            <Link className="button" to="/import">Import screenshot</Link>
          </div>
        </>
      )}
    </div>
  );
}
