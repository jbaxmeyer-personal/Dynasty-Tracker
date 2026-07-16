import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { Game, HomeAway, TvTier, Week } from "../types/models";
import { newId } from "../lib/id";
import { OPPONENT_NAMES } from "../data/schools";
import { TeamLogo } from "../components/TeamLogo";
import { gameResult, weekLabel } from "../lib/computedStats";

function emptyGame(seasonId: string): Game {
  return {
    id: newId("game"),
    season_id: seasonId,
    week: 1,
    my_rank: null,
    opp_rank: null,
    tv_tier: null,
    home_away: "",
    opponent: "",
    my_score: null,
    opp_score: null,
    ot: false,
    notes: "",
  };
}

const WEEK_OPTIONS: Week[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  "CC", "Bowl", "CFP1", "CFPQF", "CFPSF", "Natty",
];

export function GameFormPage() {
  const { seasonId, gameId } = useParams();
  const isNew = !gameId || gameId === "new";
  const navigate = useNavigate();
  const { rows, save, remove, loading } = useTable("games");
  const { rows: seasons } = useTable("seasons");
  const mySchool = seasons.find((s) => s.id === seasonId)?.school ?? "";
  const [game, setGame] = useState<Game>(emptyGame(seasonId ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && !loading) {
      const existing = rows.find((g) => g.id === gameId);
      if (existing) setGame(existing);
    }
  }, [isNew, gameId, rows, loading]);

  function set<K extends keyof Game>(key: K, value: Game[K]) {
    setGame((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!game.opponent.trim()) {
      setError('Opponent is required (use "BYE" for a bye week).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await save(game, `${isNew ? "Add" : "Update"} game vs ${game.opponent || "TBD"} (wk ${game.week})`);
      navigate(`/seasons/${seasonId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this game?")) return;
    await remove(game.id, `Delete game vs ${game.opponent} (wk ${game.week})`);
    navigate(`/seasons/${seasonId}`);
  }

  const isBye = game.opponent === "BYE";
  const res = gameResult(game);

  return (
    <div className="page">
      <h1>{isNew ? "New game" : `Edit game vs ${game.opponent}`}</h1>
      {error && <p className="status error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label className="span-2" style={{ marginBottom: "0.75rem" }}>
          Opponent
          <select value={game.opponent} onChange={(e) => set("opponent", e.target.value)}>
            <option value="">-- select --</option>
            <option value="BYE">BYE</option>
            {OPPONENT_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        {!isBye && game.opponent && (() => {
          const me = (
            <div className="scoreboard-team" key="me">
              <TeamLogo school={mySchool || "TBD"} size={44} />
              <span className="muted small">{mySchool || "You"}</span>
              <input
                type="number"
                inputMode="numeric"
                className="scoreboard-input"
                value={game.my_score ?? ""}
                onChange={(e) => set("my_score", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="-"
              />
            </div>
          );
          const opp = (
            <div className="scoreboard-team" key="opp">
              <TeamLogo school={game.opponent} size={44} />
              <span className="muted small">{game.opponent}</span>
              <input
                type="number"
                inputMode="numeric"
                className="scoreboard-input"
                value={game.opp_score ?? ""}
                onChange={(e) => set("opp_score", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="-"
              />
            </div>
          );
          // Home team on the right, away on the left - neutral site keeps me on the left.
          const meIsHome = game.home_away === "";
          return (
            <div className={`scoreboard ${res ? `scoreboard-${res}` : ""}`}>
              {meIsHome ? opp : me}
              <div className="scoreboard-mid">
                <span className="scoreboard-dash">-</span>
                {res && <span className={`result-badge result-${res}`}>{res}</span>}
              </div>
              {meIsHome ? me : opp}
            </div>
          );
        })()}

        <div className="form-grid">
          <label>
            Week
            <select value={String(game.week)} onChange={(e) => {
              const v = e.target.value;
              set("week", /^\d+$/.test(v) ? Number(v) : (v as Week));
            }}>
              {WEEK_OPTIONS.map((w) => (
                <option key={String(w)} value={String(w)}>
                  {weekLabel(w)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Home / away
            <select value={game.home_away} onChange={(e) => set("home_away", e.target.value as HomeAway)}>
              <option value="">Home</option>
              <option value="@">Away</option>
              <option value="N">Neutral</option>
            </select>
          </label>
          <label>
            TV tier
            <select
              value={game.tv_tier ?? ""}
              onChange={(e) => set("tv_tier", (e.target.value || null) as TvTier)}
            >
              <option value="">-</option>
              <option value="Regional">Regional</option>
              <option value="National">National</option>
              <option value="Gameday">Gameday</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={game.ot} onChange={(e) => set("ot", e.target.checked)} />
            Overtime
          </label>
          <label>
            My rank
            <input
              type="number"
              value={game.my_rank ?? ""}
              onChange={(e) => set("my_rank", e.target.value === "" ? null : Number(e.target.value))}
            />
          </label>
          <label>
            Opponent rank
            <input
              type="number"
              value={game.opp_rank ?? ""}
              onChange={(e) => set("opp_rank", e.target.value === "" ? null : Number(e.target.value))}
            />
          </label>
          <label className="span-2">
            Notes (the recap)
            <textarea value={game.notes} onChange={(e) => set("notes", e.target.value)} rows={6} />
          </label>

          <div className="span-2 button-row">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save game"}
            </button>
            {!isNew && (
              <button type="button" className="danger" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
