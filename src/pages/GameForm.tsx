import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { Game, HomeAway, TvTier, Week } from "../types/models";
import { newId } from "../lib/id";

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
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, "CC", "Bowl",
];

export function GameFormPage() {
  const { seasonId, gameId } = useParams();
  const isNew = !gameId || gameId === "new";
  const navigate = useNavigate();
  const { rows, save, remove, loading } = useTable("games");
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

  return (
    <div className="page">
      <h1>{isNew ? "New game" : `Edit game vs ${game.opponent}`}</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Week
          <select value={String(game.week)} onChange={(e) => {
            const v = e.target.value;
            set("week", v === "CC" || v === "Bowl" ? v : Number(v));
          }}>
            {WEEK_OPTIONS.map((w) => (
              <option key={String(w)} value={String(w)}>
                {w === "CC" ? "Conf. Champ" : w === "Bowl" ? "Bowl" : `Week ${w}`}
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
          Opponent
          <input value={game.opponent} onChange={(e) => set("opponent", e.target.value)} required />
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
        <label>
          My score
          <input
            type="number"
            value={game.my_score ?? ""}
            onChange={(e) => set("my_score", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
        <label>
          Opponent score
          <input
            type="number"
            value={game.opp_score ?? ""}
            onChange={(e) => set("opp_score", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={game.ot} onChange={(e) => set("ot", e.target.checked)} />
          Overtime
        </label>
        <label className="span-2">
          Notes (the recap)
          <textarea value={game.notes} onChange={(e) => set("notes", e.target.value)} rows={6} />
        </label>

        {error && <p className="status error span-2">{error}</p>}

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
      </form>
    </div>
  );
}
