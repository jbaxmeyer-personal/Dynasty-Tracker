import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamLogo } from "../components/TeamLogo";
import type { Recruit } from "../types/models";
import { POSITIONS } from "../data/recruiting";

const OFFENSE_POSITIONS = new Set(["QB", "RB", "HB", "FB", "WR", "TE", "OT", "OG", "OL", "C", "G", "T"]);
const DEFENSE_POSITIONS = new Set([
  "DE", "DT", "NT", "DL", "EDGE", "OLB", "MLB", "ILB", "LB", "MIKE", "CB", "FS", "SS", "S", "DB",
]);

function positionGroup(position: string): "offense" | "defense" | "special" {
  const p = position.trim().toUpperCase();
  if (OFFENSE_POSITIONS.has(p)) return "offense";
  if (DEFENSE_POSITIONS.has(p)) return "defense";
  return "special";
}

// Position filter value is either "" (all), "group:offense|defense|special", or
// an exact position code.
function positionMatches(r: Recruit, filter: string): boolean {
  if (!filter) return true;
  if (filter.startsWith("group:")) return positionGroup(r.position) === filter.slice(6);
  return r.position === filter;
}

const VIEW_KEY = "dynasty-tracker:recruit-view";

function Flags({ r }: { r: Recruit }) {
  return (
    <>
      {r.gem && <span className="gem-flag" title="Gem"> ◆</span>}
      {r.bust && <span title="Bust"> ❌</span>}
    </>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="recruit-stars">
      {"★".repeat(n)}
      <span className="recruit-stars-empty">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function BeatOut({ r, size }: { r: Recruit; size: number }) {
  const schools = r.schools_beaten_out.filter(Boolean);
  if (schools.length === 0) return null;
  return (
    <span className="recruit-beat-out" title="Schools beaten out">
      <span className="muted small">Beat out</span>
      {schools.map((s, i) => (
        <TeamLogo key={i} school={s} size={size} />
      ))}
    </span>
  );
}

function metaLine(r: Recruit): string {
  const parts = [`${r.overall} OVR`];
  if (r.home_state) parts.push(r.home_state);
  if (r.archetype) parts.push(r.archetype);
  if (r.dev_trait) parts.push(r.dev_trait);
  let season = `${r.season} ${r.type}`;
  if (r.type === "Transfer" && r.class_year) season += ` (${r.class_year})`;
  if (r.in_season) season += " · portal";
  parts.push(season);
  return parts.join(" · ");
}

export function RecruitsPage() {
  const { rows: recruits, loading, error } = useTable("recruits");
  const [seasonFilter, setSeasonFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [starsFilter, setStarsFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [view, setView] = useState<"card" | "list">(
    () => (localStorage.getItem(VIEW_KEY) === "list" ? "list" : "card")
  );

  function chooseView(v: "card" | "list") {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  }

  const seasons = useMemo(
    () => Array.from(new Set(recruits.map((r) => r.season))).sort((a, b) => b - a),
    [recruits]
  );

  // Only offer states we actually have recruits from.
  const states = useMemo(
    () => Array.from(new Set(recruits.map((r) => r.home_state).filter(Boolean))).sort(),
    [recruits]
  );

  const filtered = recruits
    .filter((r) => (seasonFilter ? String(r.season) === seasonFilter : true))
    .filter((r) => (typeFilter ? r.type === typeFilter : true))
    .filter((r) => positionMatches(r, positionFilter))
    .filter((r) => (starsFilter ? r.stars === Number(starsFilter) : true))
    .filter((r) => (stateFilter ? r.home_state === stateFilter : true))
    .sort((a, b) => b.season - a.season || b.stars - a.stars);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Recruiting classes</h1>
        <Link className="button" to="/recruits/new">
          + Add recruit
        </Link>
      </div>

      <div className="filter-grid">
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
        <label>
          Position
          <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            <option value="">All</option>
            <optgroup label="By side">
              <option value="group:offense">Offense</option>
              <option value="group:defense">Defense</option>
              <option value="group:special">Special teams</option>
            </optgroup>
            <optgroup label="By position">
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label>
          Stars
          <select value={starsFilter} onChange={(e) => setStarsFilter(e.target.value)}>
            <option value="">All</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} ★</option>
            ))}
          </select>
        </label>
        <label>
          State
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">All</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="view-toggle" role="group" aria-label="View">
        <button type="button" className={view === "card" ? "active" : ""} onClick={() => chooseView("card")}>
          Cards
        </button>
        <button type="button" className={view === "list" ? "active" : ""} onClick={() => chooseView("list")}>
          List
        </button>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="status error">{error}</p>}

      {view === "card" ? (
        <div className="recruit-grid">
          {filtered.map((r) => (
            <Link key={r.id} to={`/recruits/${r.id}`} className={`recruit-card group-${positionGroup(r.position)}`}>
              <div className="recruit-card-top">
                <TeamLogo school={r.school} size={28} />
                <span className="position-badge">{r.position || "?"}</span>
              </div>
              <strong className="recruit-name">
                {r.name || "Unnamed"}
                <Flags r={r} />
              </strong>
              <Stars n={r.stars} />
              <div className="muted small">
                {r.overall} OVR{r.home_state ? ` · ${r.home_state}` : ""}
              </div>
              {(r.archetype || r.dev_trait) && (
                <div className="muted small">{[r.archetype, r.dev_trait].filter(Boolean).join(" · ")}</div>
              )}
              <BeatOut r={r} size={16} />
              <div className="muted small">
                {r.season} · {r.type}
                {r.type === "Transfer" && r.class_year ? ` (${r.class_year})` : ""}
                {r.in_season ? " · portal" : ""}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="recruit-list">
          {filtered.map((r) => (
            <Link key={r.id} to={`/recruits/${r.id}`} className={`recruit-row group-${positionGroup(r.position)}`}>
              <TeamLogo school={r.school} size={34} />
              <div className="recruit-row-main">
                <div className="recruit-row-head">
                  <strong className="recruit-name">
                    {r.name || "Unnamed"}
                    <Flags r={r} />
                  </strong>
                  <span className="position-badge">{r.position || "?"}</span>
                </div>
                <div className="recruit-row-sub muted small">
                  <Stars n={r.stars} />
                  <span>{metaLine(r)}</span>
                  <BeatOut r={r} size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && <p className="muted">No recruits match.</p>}
    </div>
  );
}
