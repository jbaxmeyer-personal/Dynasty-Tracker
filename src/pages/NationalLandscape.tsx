import { Link, useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamLogo } from "../components/TeamLogo";
import { ConferenceBadge } from "../components/ConferenceBadge";
import { teamGradient } from "../lib/teamColors";

export function NationalLandscapePage() {
  const { year } = useParams();
  const navigate = useNavigate();
  const { rows, loading } = useTable("national_landscape");

  if (loading) return <div className="page">Loading...</div>;

  const sorted = [...rows].sort((a, b) => b.year - a.year);
  const landscape = year ? sorted.find((r) => String(r.year) === year) : sorted[0];

  if (!landscape) {
    return (
      <div className="page">
        <h1>National landscape</h1>
        <p className="muted">
          No national landscape logged yet. Track the national champion, conference champions,
          and final rankings for each year.
        </p>
        <Link className="button" to="/landscape/new">
          + Add a year
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="hero-card" style={{ background: teamGradient(landscape.national_champion) }}>
        {sorted.length > 1 && (
          <select
            className="hero-select"
            value={landscape.year}
            onChange={(e) => navigate(`/landscape/${e.target.value}`)}
            aria-label="Switch year"
          >
            {sorted.map((r) => (
              <option key={r.id} value={r.year}>{r.year}</option>
            ))}
          </select>
        )}
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="list-row">
            <TeamLogo school={landscape.national_champion} size={64} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.4rem" }}>
                {landscape.year} National Champion
              </h1>
              <div className="muted small">
                {landscape.national_champion || "TBD"}
                {landscape.national_runner_up ? ` def. ${landscape.national_runner_up}` : ""}
              </div>
            </div>
          </div>
          <div className="button-row">
            <Link className="button" to={`/landscape/${landscape.id}/edit`}>
              Edit
            </Link>
            <Link className="button" to="/landscape/new">
              + Add year
            </Link>
          </div>
        </div>
        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="stat-label">Runner-up</div>
            <div className="stat-value">{landscape.national_runner_up || "-"}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Semifinal losers</div>
            <div className="stat-value" style={{ fontSize: "0.95rem" }}>
              {landscape.playoff_semifinalists.filter(Boolean).join(", ") || "-"}
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Heisman</div>
            <div
              className="stat-value"
              style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              {landscape.heisman_school && <TeamLogo school={landscape.heisman_school} size={22} />}
              <span>
                {landscape.heisman_winner || "-"}
                {landscape.heisman_school ? ` (${landscape.heisman_school})` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Conference champions</h2>
        <ul className="list">
          {landscape.conference_champions.map((cc) => (
            <li key={cc.conference} className="list-row">
              <ConferenceBadge conference={cc.conference} size={28} />
              <div className="list-row-main">
                <strong>{cc.conference}</strong>
                <div className="muted small">{cc.champion || "-"}</div>
              </div>
              {cc.champion && <TeamLogo school={cc.champion} size={28} />}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Final Top 25</h2>
        <ul className="list">
          {landscape.final_top_25.map((team, i) => (
            team && (
              <li key={i} className="list-row">
                <strong style={{ width: "1.75rem" }}>{i + 1}</strong>
                <TeamLogo school={team} size={28} />
                <div className="list-row-main">{team}</div>
              </li>
            )
          ))}
          {landscape.final_top_25.every((t) => !t) && (
            <p className="muted">No final rankings logged.</p>
          )}
        </ul>
      </div>

      {landscape.notes && (
        <div className="card">
          <h2>Notes</h2>
          <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{landscape.notes}</p>
        </div>
      )}
    </div>
  );
}
