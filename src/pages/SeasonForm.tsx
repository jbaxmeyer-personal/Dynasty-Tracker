import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type {
  AdGoal,
  AllAmericanHonor,
  AllConferenceHonor,
  DraftPick,
  Season,
  StaffTier,
  SupportStaffMember,
} from "../types/models";
import { newId } from "../lib/id";
import { SCHOOL_NAMES } from "../data/schools";
import { POSITIONS } from "../data/recruiting";
import { TeamLogo } from "../components/TeamLogo";
import { NumberInput } from "../components/NumberInput";
import { NameInput } from "../components/NameInput";

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
    nil_roster_spend: 0,
    nil_recruiting_spend: 0,
    dynasty_points_earned: 0,
    dynasty_points_spent_staff: 0,
    dynasty_points_spent_facilities: 0,
    offensive_coordinator: "",
    defensive_coordinator: "",
    support_staff: [],
    preseason_rank: null,
    final_rank: null,
    recruiting_class_rank: "",
    toughest_place_to_play_rank: null,
    ad_goals: [],
    all_americans: [],
    all_conference: [],
    draft_picks: [],
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

  function updateStaff(idx: number, patch: Partial<SupportStaffMember>) {
    setSeason((prev) => {
      const staff = [...prev.support_staff];
      staff[idx] = { ...staff[idx], ...patch };
      return { ...prev, support_staff: staff };
    });
  }

  function addStaff() {
    setSeason((prev) => ({
      ...prev,
      support_staff: [...prev.support_staff, { role: "", name: "", tier: "Bronze" as StaffTier }],
    }));
  }

  function removeStaff(idx: number) {
    setSeason((prev) => ({ ...prev, support_staff: prev.support_staff.filter((_, i) => i !== idx) }));
  }

  function updateAllAmerican(idx: number, patch: Partial<AllAmericanHonor>) {
    setSeason((prev) => {
      const next = [...prev.all_americans];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, all_americans: next };
    });
  }

  function addAllAmerican() {
    setSeason((prev) => ({
      ...prev,
      all_americans: [...prev.all_americans, { name: "", position: "", team: "1st" }],
    }));
  }

  function removeAllAmerican(idx: number) {
    setSeason((prev) => ({ ...prev, all_americans: prev.all_americans.filter((_, i) => i !== idx) }));
  }

  function updateAllConference(idx: number, patch: Partial<AllConferenceHonor>) {
    setSeason((prev) => {
      const next = [...prev.all_conference];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, all_conference: next };
    });
  }

  function addAllConference() {
    setSeason((prev) => ({
      ...prev,
      all_conference: [...prev.all_conference, { name: "", position: "", team: "1st" }],
    }));
  }

  function removeAllConference(idx: number) {
    setSeason((prev) => ({ ...prev, all_conference: prev.all_conference.filter((_, i) => i !== idx) }));
  }

  function updateDraftPick(idx: number, patch: Partial<DraftPick>) {
    setSeason((prev) => {
      const next = [...prev.draft_picks];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, draft_picks: next };
    });
  }

  function addDraftPick() {
    setSeason((prev) => ({
      ...prev,
      draft_picks: [...prev.draft_picks, { name: "", round: null, position: "" }],
    }));
  }

  function removeDraftPick(idx: number) {
    setSeason((prev) => ({ ...prev, draft_picks: prev.draft_picks.filter((_, i) => i !== idx) }));
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
      <div className="list-row" style={{ marginBottom: "0.5rem" }}>
        {season.school && <TeamLogo school={season.school} size={32} />}
        <h1 style={{ margin: 0 }}>{isNew ? "New season" : `Edit ${season.year} season`}</h1>
      </div>
      {error && <p className="status error">{error}</p>}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Year
          <NumberInput value={season.year} onChange={(v) => set("year", v ?? 0)} />
        </label>
        <label>
          School
          <select value={season.school} onChange={(e) => set("school", e.target.value)}>
            <option value="">-- select --</option>
            {SCHOOL_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
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
          <NumberInput min={0} max={99} value={season.ovr_rating} onChange={(v) => set("ovr_rating", v ?? 0)} />
        </label>
        <label>
          Offense rating
          <NumberInput min={0} max={99} value={season.off_rating} onChange={(v) => set("off_rating", v ?? 0)} />
        </label>
        <label>
          Defense rating
          <NumberInput min={0} max={99} value={season.def_rating} onChange={(v) => set("def_rating", v ?? 0)} />
        </label>
        <label>
          Dynasty Points
          <NumberInput value={season.dynasty_points_earned} onChange={(v) => set("dynasty_points_earned", v ?? 0)} />
        </label>
        <label>
          Roster NIL spend
          <NumberInput value={season.nil_roster_spend} onChange={(v) => set("nil_roster_spend", v ?? 0)} />
        </label>
        <label>
          NIL spent on Recruits
          <NumberInput value={season.nil_recruiting_spend} onChange={(v) => set("nil_recruiting_spend", v ?? 0)} />
        </label>
        <label>
          Dynasty points spent on staff
          <NumberInput value={season.dynasty_points_spent_staff} onChange={(v) => set("dynasty_points_spent_staff", v ?? 0)} />
        </label>
        <label>
          Dynasty Points spent on Facilities
          <NumberInput value={season.dynasty_points_spent_facilities} onChange={(v) => set("dynasty_points_spent_facilities", v ?? 0)} />
        </label>
        <label>
          Preseason rank
          <NumberInput nullable value={season.preseason_rank} onChange={(v) => set("preseason_rank", v)} />
        </label>
        <label>
          Final rank
          <NumberInput nullable value={season.final_rank} onChange={(v) => set("final_rank", v)} />
        </label>
        <label>
          Recruiting class rank
          <input
            value={season.recruiting_class_rank}
            onChange={(e) => set("recruiting_class_rank", e.target.value)}
          />
        </label>
        <label>
          Toughest place to play rank
          <NumberInput
            nullable
            value={season.toughest_place_to_play_rank}
            onChange={(v) => set("toughest_place_to_play_rank", v)}
          />
        </label>

        <label>
          Offensive coordinator
          <NameInput
            value={season.offensive_coordinator}
            onChange={(e) => set("offensive_coordinator", e.target.value)}
          />
        </label>
        <label>
          Defensive coordinator
          <NameInput
            value={season.defensive_coordinator}
            onChange={(e) => set("defensive_coordinator", e.target.value)}
          />
        </label>

        <div className="span-2">
          <h3>Support staff</h3>
          {season.support_staff.map((s, idx) => (
            <div key={idx} className="ad-goal-row">
              <input
                value={s.role}
                onChange={(e) => updateStaff(idx, { role: e.target.value })}
                placeholder="Role, e.g. Recruiting Coordinator"
              />
              <NameInput
                value={s.name}
                onChange={(e) => updateStaff(idx, { name: e.target.value })}
                placeholder="Name"
              />
              <select
                value={s.tier}
                onChange={(e) => updateStaff(idx, { tier: e.target.value as StaffTier })}
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
              <button type="button" className="button-link" onClick={() => removeStaff(idx)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addStaff}>
            + Add staff member
          </button>
        </div>

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

        <div className="span-2">
          <h3>All-Americans</h3>
          {season.all_americans.map((a, idx) => (
            <div key={idx} className="ad-goal-row">
              <NameInput
                value={a.name}
                onChange={(e) => updateAllAmerican(idx, { name: e.target.value })}
                placeholder="Player name"
              />
              <select
                value={a.position}
                onChange={(e) => updateAllAmerican(idx, { position: e.target.value })}
                style={{ flex: "0 0 5rem" }}
                aria-label="Position"
              >
                <option value="">Pos</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={a.team}
                onChange={(e) => updateAllAmerican(idx, { team: e.target.value as AllAmericanHonor["team"] })}
              >
                <option value="1st">1st team</option>
                <option value="2nd">2nd team</option>
                <option value="Freshman">Freshman</option>
              </select>
              <button type="button" className="button-link" onClick={() => removeAllAmerican(idx)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addAllAmerican}>
            + Add All-American
          </button>
        </div>

        <div className="span-2">
          <h3>All-Conference</h3>
          {season.all_conference.map((a, idx) => (
            <div key={idx} className="ad-goal-row">
              <NameInput
                value={a.name}
                onChange={(e) => updateAllConference(idx, { name: e.target.value })}
                placeholder="Player name"
              />
              <select
                value={a.position}
                onChange={(e) => updateAllConference(idx, { position: e.target.value })}
                style={{ flex: "0 0 5rem" }}
                aria-label="Position"
              >
                <option value="">Pos</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={a.team}
                onChange={(e) => updateAllConference(idx, { team: e.target.value as AllConferenceHonor["team"] })}
              >
                <option value="1st">1st team</option>
                <option value="2nd">2nd team</option>
              </select>
              <button type="button" className="button-link" onClick={() => removeAllConference(idx)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addAllConference}>
            + Add All-Conference
          </button>
        </div>

        <div className="span-2">
          <h3>Draft picks</h3>
          {season.draft_picks.map((d, idx) => (
            <div key={idx} className="ad-goal-row">
              <NameInput
                value={d.name}
                onChange={(e) => updateDraftPick(idx, { name: e.target.value })}
                placeholder="Player name"
              />
              <NumberInput
                nullable
                value={d.round}
                onChange={(v) => updateDraftPick(idx, { round: v })}
                placeholder="Rd"
                style={{ flex: "0 0 4rem" }}
              />
              <select
                value={d.position}
                onChange={(e) => updateDraftPick(idx, { position: e.target.value })}
                style={{ flex: "0 0 5rem" }}
                aria-label="Position"
              >
                <option value="">Pos</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button type="button" className="button-link" onClick={() => removeDraftPick(idx)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addDraftPick}>
            + Add draft pick
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
          <button type="button" className="secondary" onClick={() => navigate("/seasons")} disabled={saving}>
            Cancel
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
