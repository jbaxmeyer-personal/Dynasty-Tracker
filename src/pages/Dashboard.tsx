import { Link } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { useSettings } from "../context/SettingsContext";
import { TeamLogo } from "../components/TeamLogo";
import { teamGradient } from "../lib/teamColors";
import { currentStreak, formatRecord, gameResult, seasonRecord } from "../lib/computedStats";
import type { Game, Week } from "../types/models";

function weekSort(week: Week): number {
  if (week === "CC") return 100;
  if (week === "Bowl") return 101;
  return week;
}

function weekLabel(week: Week): string {
  if (week === "CC") return "CC";
  if (week === "Bowl") return "Bowl";
  return `Wk ${week}`;
}

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
  const latestClass = recruits.filter((r) => r.season === latest?.year);
  const seasonGames = latest ? games.filter((g) => g.season_id === latest.id) : [];
  const recentGames: Game[] = seasonGames
    .filter((g) => g.my_score != null && g.opp_score != null)
    .sort((a, b) => weekSort(b.week) - weekSort(a.week))
    .slice(0, 6)
    .reverse();

  return (
    <div className="page">
      {!latest ? (
        <>
          <h1>Dashboard</h1>
          <p className="muted">
            No seasons yet. <Link to="/seasons/new">Add your first season</Link>.
          </p>
        </>
      ) : (
        <>
          <div className="hero-card" style={{ background: teamGradient(latest.school) }}>
            <div className="list-row">
              <TeamLogo school={latest.school} size={48} />
              <div>
                <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
                  {latest.year} {latest.school}
                </h1>
                <div className="muted small">
                  {formatRecord(seasonRecord(games, latest.id))} · Streak{" "}
                  {currentStreak(seasonGames, seasons)} · {latest.prestige}★ prestige
                </div>
              </div>
            </div>

            <div className="stat-tiles">
              <div className="stat-tile">
                <div className="stat-label">Rank</div>
                <div className="stat-value">
                  {latest.preseason_rank ?? "NR"} → {latest.final_rank ?? "-"}
                </div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Ovr / Off / Def</div>
                <div className="stat-value">
                  {latest.ovr_rating}/{latest.off_rating}/{latest.def_rating}
                </div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Recruits</div>
                <div className="stat-value">{latestClass.length}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Dynasty pts</div>
                <div className="stat-value">{latest.dynasty_points_earned}</div>
              </div>
            </div>

            <div className="button-row" style={{ marginTop: "1rem" }}>
              <Link className="button" to={`/seasons/${latest.id}`}>
                View season
              </Link>
              <Link className="button" to={`/seasons/${latest.id}/games/new`}>
                + Log game
              </Link>
            </div>
          </div>

          {recentGames.length > 0 && (
            <>
              <h2 className="section-title">Recent games</h2>
              <div className="ticker">
                {recentGames.map((g) => {
                  const res = gameResult(g);
                  return (
                    <Link
                      key={g.id}
                      to={`/seasons/${latest.id}/games/${g.id}`}
                      className="ticker-chip"
                    >
                      <TeamLogo school={g.opponent} size={28} />
                      <span className={`ticker-result result-${res ?? "none"}`}>
                        {res ?? "-"} {g.my_score}-{g.opp_score}
                      </span>
                      <span className="muted small">{weekLabel(g.week)}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

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
