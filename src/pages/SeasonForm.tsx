import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { AdGoal, Season } from "../types/models";
import { newId } from "../lib/id";

const PRESTIGE_OPTIONS = Array.from({ length: 11 }, (_, i) => i * 0.5);

function emptySeason(): Season {
  return {
    id: newId("season"),
    year: new Date().getFullYear(),
    school: "",
    prestige: 2.5,
    ovr_rating: 50,
    off_rating: 50,
    def_rating: 50,
    nil_total: 0,
    nil_roster_spend: 0,
    dynasty_points_earned: 0,
    preseason_rank: null,
    final_rank: null,
    recruiting_class_rank: "",
    toughest_place_to_play_rank: null,
    conf_champ_opponent: "",
    bowl_name: "",
    bowl_opponent: "",
    bowl_result: "",
    ad_goals: [],
    notes: "",
  };
}

export function SeasonFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { rows, save, remove, loading } = useTable("seasons");
  const [season, setSeason] = useState<Season>(emptySeason());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && !loading) {
      const existing = rows.find((s) => s.id === id);
      if (existing) setSeason(existing);
    }
  }, [isNew, id, rows, loading]);

  // Pre-fill school (and bump the year) from the most recent season so the
  // required "School" field isn't blank by default - an empty required field
  // silently blocks submit via native browser validation, which is easy to
  // miss and looks like the Save button just isn't working.
  useEffect(() => {
    if (isNew && !loading && rows.length > 0) {
      const latest = [...rows].sort((a, b) => b.year - a.year)[0];
      setSeason((prev) =>
        prev.school ? prev : { ...prev, school: latest.school, year: latest.year + 1 }
      );
    }
  }, [isNew, loading, rows]);

  function set<K extends keyof Season>(key: K, value: Season[K]) {
    setSeason((prev) => ({ ...prev, [key]: value }));
  }

  function updateGoal(idx: number, patch: Partial<AdGoal>) {
    setSeason((prev) => {
      const goals = [...prev.ad_goals];
      goals[idx] = { ...goals[idx], ...patch };
      return { ...prev, ad_goals: goals };
    });
  }

  function addGoal() {
    setSeason((prev) => ({ ...prev, ad_goals: [...prev.ad_goals, { goal: "", met: false }] }));
  }

  function removeGoal(idx: number) {
    setSeason((prev) => ({ ...prev, ad_goals: prev.ad_goals.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!season.school.trim()) {
      setError("School is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await save(season, `${isNew ? "Add" : "Update"} ${season.year} season (${season.school})`);
      navigate(`/seasons/${season.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this season? Games linked to it will remain but become orphaned.")) return;
    await remove(season.id, `Delete ${season.year} season (${season.school})`);
    navigate("/seasons");
  }

  return (
    <div className="page">
      <h1>{isNew ? "New season" : `Edit ${season.year} season`}</h1>
      {error && <p className="status error">{error}</p>}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Year
          <input
            type="number"
            value={season.year}
            onChange={(e) => set("year", Number(e.target.value))}
          />
        </label>
        <label>
          School
          <input value={season.school} onChange={(e) => set("school", e.target.value)} />
        </label>
        <label>
          Prestige
          <select
            value={season.prestige}
            onChange={(e) => set("prestige", Number(e.target.value))}
          >
            {PRESTIGE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}★
              </option>
            ))}
          </select>
        </label>
        <label>
          Overall rating
          <input
            type="number"
            min={0}
            max={99}
            value={season.ovr_rating}
            onChange={(e) => set("ovr_rating", Number(e.target.value))}
          />
        </label>
        <label>
          Offense rating
          <input
            type="number"
            min={0}
            max={99}
            value={season.off_rating}
            onChange={(e) => set("off_rating", Number(e.target.value))}
          />
        </label>
        <label>
          Defense rating
          <input
            type="number"
            min={0}
            max={99}
            value={season.def_rating}
            onChange={(e) => set("def_rating", Number(e.target.value))}
          />
        </label>
        <label>
          NIL total budget
          <input
            type="number"
            value={season.nil_total}
            onChange={(e) => set("nil_total", Number(e.target.value))}
          />
        </label>
        <label>
          Roster NIL spend
          <input
            type="number"
            value={season.nil_roster_spend}
            onChange={(e) => set("nil_roster_spend", Number(e.target.value))}
          />
        </label>
        <p className="muted small span-2">
          Recruiting NIL (derived): {(season.nil_total - season.nil_roster_spend).toLocaleString()}
        </p>
        <label>
          Dynasty points earned
          <input
            type="number"
            value={season.dynasty_points_earned}
            onChange={(e) => set("dynasty_points_earned", Number(e.target.value))}
          />
        </label>
        <label>
          Preseason rank
          <input
            type="number"
            value={season.preseason_rank ?? ""}
            onChange={(e) => set("preseason_rank", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
        <label>
          Final rank
          <input
            type="number"
            value={season.final_rank ?? ""}
            onChange={(e) => set("final_rank", e.target.value === "" ? null : Number(e.target.value))}
          />
        </label>
        <label>
          Recruiting class rank
          <input
            value={season.recruiting_class_rank}
            onChange={(e) => set("recruiting_class_rank", e.target.value)}
            placeholder='e.g. 12 or "40 with PSU"'
          />
        </label>
        <label>
          Toughest place to play rank
          <input
            type="number"
            value={season.toughest_place_to_play_rank ?? ""}
            onChange={(e) =>
              set("toughest_place_to_play_rank", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </label>
        <label>
          Conference champ opponent
          <input
            value={season.conf_champ_opponent}
            onChange={(e) => set("conf_champ_opponent", e.target.value)}
          />
        </label>
        <label>
          Bowl name
          <input value={season.bowl_name} onChange={(e) => set("bowl_name", e.target.value)} />
        </label>
        <label>
          Bowl opponent
          <input value={season.bowl_opponent} onChange={(e) => set("bowl_opponent", e.target.value)} />
        </label>
        <label>
          Bowl result
          <input value={season.bowl_result} onChange={(e) => set("bowl_result", e.target.value)} />
        </label>

        <div className="span-2">
          <h3>AD goals</h3>
          {season.ad_goals.map((g, idx) => (
            <div key={idx} className="ad-goal-row">
              <input
                value={g.goal}
                onChange={(e) => updateGoal(idx, { goal: e.target.value })}
                placeholder="Goal text"
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={g.met}
                  onChange={(e) => updateGoal(idx, { met: e.target.checked })}
                />
                Met
              </label>
              <button type="button" className="button-link" onClick={() => removeGoal(idx)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addGoal}>
            + Add goal
          </button>
        </div>

        <label className="span-2">
          Season notes
          <textarea
            value={season.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={4}
          />
        </label>

        <div className="span-2 button-row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save season"}
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
