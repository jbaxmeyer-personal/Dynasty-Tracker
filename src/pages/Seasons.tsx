import { Link } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamBadge } from "../components/TeamBadge";
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
      <ul className="list">
        {sorted.map((s) => {
          const record = seasonRecord(games, s.id);
          return (
            <li key={s.id}>
              <Link to={`/seasons/${s.id}`} className="list-row">
                <TeamBadge school={s.school} />
                <div className="list-row-main">
                  <strong>{s.year}</strong> — {s.school}
                  <div className="muted small">
                    {formatRecord(record)} · Prestige {s.prestige}★ · {s.ovr_grade}
                    {s.final_rank ? ` · Final rank #${s.final_rank}` : ""}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
