import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamBadge } from "../components/TeamBadge";

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
            <option value="Transfer In">Transfer In</option>
            <option value="Transfer Out">Transfer Out</option>
          </select>
        </label>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="status error">{error}</p>}

      <ul className="list">
        {filtered.map((r) => (
          <li key={r.id}>
            <Link to={`/recruits/${r.id}`} className="list-row">
              <TeamBadge school={r.school} />
              <div className="list-row-main">
                <strong>{r.name}</strong> · {r.position} · {"★".repeat(r.stars)} · {r.overall} OVR
                <div className="muted small">
                  {r.season} · {r.type}
                  {r.type === "Transfer In" && r.transfer_from ? ` from ${r.transfer_from}` : ""}
                  {r.type === "Transfer Out" && r.transfer_to ? ` to ${r.transfer_to}` : ""}
                  {r.home_state ? ` · ${r.home_state}` : ""}
                </div>
              </div>
            </Link>
          </li>
        ))}
        {!loading && filtered.length === 0 && <p className="muted">No recruits match.</p>}
      </ul>
    </div>
  );
}
