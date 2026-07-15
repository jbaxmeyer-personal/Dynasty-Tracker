import { Link } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamLogo } from "../components/TeamLogo";
import { teamGradient } from "../lib/teamColors";
import { formatRecord, seasonRecord } from "../lib/computedStats";

export function SeasonsPage() {
  const { rows: seasons, loading, error } = useTable("seasons");
  const { rows: games } = useTable("games");

  const sorted = [...seasons].sort((a, b) => b.year - a.year);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Seasons</h1>
        <Link className="button" to="/seasons/new">
          + New season
        </Link>
      </div>
      {loading && <p className="muted">Loading...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && sorted.length === 0 && (
        <p className="muted">No seasons yet. Add your first one.</p>
      )}
      <div className="season-grid">
        {sorted.map((s) => {
          const record = seasonRecord(games, s.id);
          return (
            <Link
              key={s.id}
              to={`/seasons/${s.id}`}
              className="season-card"
              style={{ background: teamGradient(s.school) }}
            >
              <div className="list-row">
                <TeamLogo school={s.school} size={36} />
                <div>
                  <strong>{s.year} {s.school}</strong>
                  <div className="muted small">
                    {formatRecord(record)} · {s.prestige}★
                    {s.final_rank ? ` · #${s.final_rank}` : ""}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
