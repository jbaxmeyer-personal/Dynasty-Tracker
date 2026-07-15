import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamLogo } from "../components/TeamLogo";

const OFFENSE_POSITIONS = new Set(["QB", "RB", "HB", "FB", "WR", "TE", "OT", "OG", "OL", "C", "G", "T"]);
const DEFENSE_POSITIONS = new Set([
  "DE", "DT", "NT", "DL", "OLB", "MLB", "ILB", "LB", "CB", "FS", "SS", "S", "DB", "EDGE",
]);

function positionGroup(position: string): "offense" | "defense" | "special" {
  const p = position.trim().toUpperCase();
  if (OFFENSE_POSITIONS.has(p)) return "offense";
  if (DEFENSE_POSITIONS.has(p)) return "defense";
  return "special";
}

export function RecruitsPage() {
  const { rows: recruits, loading, error } = useTable("recruits");
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const seasons = useMemo(
    () => Array.from(new Set(recruits.map((r) => r.season))).sort((a, b) => b - a),
    [recruits]
  );

  const filtered = recruits
    .filter((r) => (seasonFilter ? String(r.season) === seasonFilter : true))
    .filter((r) => (typeFilter ? r.type === typeFilter : true))
    .sort((a, b) => b.season - a.season || b.stars - a.stars);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Recruiting classes</h1>
        <Link className="button" to="/recruits/new">
          + Add recruit
        </Link>
      </div>

      <div className="form-grid">
        <label>
          Season
          <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}>
            <option value="">All</option>
            {seasons.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All</option>
            <option value="HS Signee">HS Signee</option>
            <option value="Transfer">Transfer</option>
          </select>
        </label>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="status error">{error}</p>}

      <div className="recruit-grid">
        {filtered.map((r) => (
          <Link key={r.id} to={`/recruits/${r.id}`} className={`recruit-card group-${positionGroup(r.position)}`}>
            <div className="recruit-card-top">
              <TeamLogo school={r.school} size={28} />
              <span className="position-badge">{r.position || "?"}</span>
            </div>
            <strong className="recruit-name">{r.name || "Unnamed"}</strong>
            <div className="recruit-stars">
              {"★".repeat(r.stars)}
              <span className="recruit-stars-empty">{"★".repeat(5 - r.stars)}</span>
            </div>
            <div className="muted small">
              {r.overall} OVR{r.home_state ? ` · ${r.home_state}` : ""}
            </div>
            <div className="muted small">
              {r.season} · {r.type}
              {r.type === "Transfer" && r.class_year ? ` (${r.class_year})` : ""}
              {r.in_season ? " · portal" : ""}
            </div>
          </Link>
        ))}
        {!loading && filtered.length === 0 && <p className="muted">No recruits match.</p>}
      </div>
    </div>
  );
}
