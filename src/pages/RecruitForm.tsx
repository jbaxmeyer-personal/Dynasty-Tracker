import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { ClassYear, Recruit, RecruitType } from "../types/models";
import { DEV_TRAITS } from "../types/models";
import { newId } from "../lib/id";
import { SCHOOL_NAMES } from "../data/schools";
import { HOME_LOCATIONS, POSITIONS, archetypesFor } from "../data/recruiting";
import { TeamLogo } from "../components/TeamLogo";
import { SchoolCombobox } from "../components/SchoolCombobox";
import { NumberInput } from "../components/NumberInput";
import { NameInput } from "../components/NameInput";

const CLASS_YEARS: ClassYear[] = ["Fr", "So", "Jr", "Sr", "Gr"];

function emptyRecruit(school: string, season: number): Recruit {
  return {
    id: newId("recruit"),
    school,
    season,
    name: "",
    home_state: "",
    position: "",
    archetype: "",
    stars: 3,
    overall: 0,
    type: "HS Signee",
    class_year: "",
    in_season: false,
    schools_beaten_out: [],
    gem: false,
    bust: false,
    dev_trait: "",
    notes: "",
  };
}

export function RecruitFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { rows, save, remove, loading } = useTable("recruits");
  const { rows: seasons } = useTable("seasons");
  const currentSchool = seasons.slice().sort((a, b) => b.year - a.year)[0]?.school ?? "";
  const currentYear = seasons.slice().sort((a, b) => b.year - a.year)[0]?.year ?? new Date().getFullYear();

  const [recruit, setRecruit] = useState<Recruit>(emptyRecruit(currentSchool, currentYear));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && !loading) {
      const existing = rows.find((r) => r.id === id);
      if (existing) setRecruit(existing);
    }
  }, [isNew, id, rows, loading]);

  // Default a new recruit to the latest season's school/year.
  useEffect(() => {
    if (isNew) {
      setRecruit((prev) => ({ ...prev, school: currentSchool, season: currentYear }));
    }
  }, [isNew, currentSchool, currentYear]);

  function set<K extends keyof Recruit>(key: K, value: Recruit[K]) {
    setRecruit((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!recruit.name.trim() || !recruit.school.trim()) {
      setError("Name and school are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await save(recruit, `${isNew ? "Add" : "Update"} recruit: ${recruit.name}`);
      navigate("/recruits");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this recruit?")) return;
    await remove(recruit.id, `Delete recruit: ${recruit.name}`);
    navigate("/recruits");
  }

  function addBeatenSchool() {
    setRecruit((prev) => ({ ...prev, schools_beaten_out: [...prev.schools_beaten_out, ""] }));
  }
  function updateBeatenSchool(idx: number, value: string) {
    setRecruit((prev) => {
      const next = [...prev.schools_beaten_out];
      next[idx] = value;
      return { ...prev, schools_beaten_out: next };
    });
  }
  function removeBeatenSchool(idx: number) {
    setRecruit((prev) => ({
      ...prev,
      schools_beaten_out: prev.schools_beaten_out.filter((_, i) => i !== idx),
    }));
  }

  return (
    <div className="page">
      <div className="list-row" style={{ marginBottom: "0.5rem" }}>
        {recruit.school && <TeamLogo school={recruit.school} size={32} />}
        <h1 style={{ margin: 0 }}>{isNew ? "New recruit" : `Edit ${recruit.name}`}</h1>
      </div>
      {error && <p className="status error">{error}</p>}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Name
          <NameInput value={recruit.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          Position
          <select
            value={recruit.position}
            onChange={(e) => {
              const position = e.target.value;
              // Drop the archetype if it doesn't belong to the new position.
              setRecruit((prev) => ({
                ...prev,
                position,
                archetype: archetypesFor(position).includes(prev.archetype) ? prev.archetype : "",
              }));
            }}
          >
            <option value="">-- select --</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Archetype
          <select
            value={recruit.archetype}
            onChange={(e) => set("archetype", e.target.value)}
            disabled={archetypesFor(recruit.position).length === 0}
          >
            <option value="">
              {recruit.position ? "-- select --" : "-- pick a position first --"}
            </option>
            {archetypesFor(recruit.position).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          School
          <select value={recruit.school} onChange={(e) => set("school", e.target.value)}>
            <option value="">-- select --</option>
            {SCHOOL_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Season
          <NumberInput value={recruit.season} onChange={(v) => set("season", v ?? 0)} />
        </label>
        <label>
          Home state
          <select value={recruit.home_state} onChange={(e) => set("home_state", e.target.value)}>
            <option value="">-- select --</option>
            {HOME_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </label>
        <label>
          Stars
          <div className="star-picker">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className={`star-picker-btn ${s <= recruit.stars ? "filled" : ""}`}
                onClick={() => set("stars", s)}
                aria-label={`${s} star${s === 1 ? "" : "s"}`}
              >
                ★
              </button>
            ))}
          </div>
        </label>
        <label>
          Overall
          <NumberInput min={0} max={99} value={recruit.overall} onChange={(v) => set("overall", v ?? 0)} />
        </label>
        <label>
          Dev trait
          <select value={recruit.dev_trait} onChange={(e) => set("dev_trait", e.target.value)}>
            <option value="">-- select --</option>
            {DEV_TRAITS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <div className="span-2 flag-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={recruit.gem}
              disabled={recruit.bust}
              onChange={(e) => set("gem", e.target.checked)}
            />
            <span className="gem-flag">◆</span> Gem
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={recruit.bust}
              disabled={recruit.gem}
              onChange={(e) => set("bust", e.target.checked)}
            />
            ❌ Bust
          </label>
        </div>
        <label>
          Type
          <select
            value={recruit.type}
            onChange={(e) => {
              const type = e.target.value as RecruitType;
              setRecruit((prev) => ({ ...prev, type, class_year: type === "HS Signee" ? "" : prev.class_year }));
            }}
          >
            <option value="HS Signee">HS Signee</option>
            <option value="Transfer">Transfer</option>
          </select>
        </label>
        {recruit.type === "Transfer" && (
          <>
            <label>
              Class year
              <select value={recruit.class_year} onChange={(e) => set("class_year", e.target.value as ClassYear)}>
                <option value="">-- select --</option>
                {CLASS_YEARS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={recruit.in_season}
                onChange={(e) => set("in_season", e.target.checked)}
              />
              Joined in-season (portal)
            </label>
          </>
        )}
        <h3 className="span-2" style={{ marginBottom: 0 }}>
          Schools beaten out <span className="muted small" style={{ fontWeight: 400 }}>· optional</span>
        </h3>
        {recruit.schools_beaten_out.map((s, i) => (
          <div className="span-2 beaten-row" key={i}>
            <SchoolCombobox
              label=""
              value={s}
              onChange={(v) => updateBeatenSchool(i, v)}
              placeholder="Search schools you beat…"
            />
            <button type="button" className="button-link" onClick={() => removeBeatenSchool(i)}>
              Remove
            </button>
          </div>
        ))}
        <div className="span-2">
          <button type="button" onClick={addBeatenSchool}>Add school</button>
        </div>

        <label className="span-2">
          Notes
          <textarea value={recruit.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
        </label>

        <div className="span-2 button-row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save recruit"}
          </button>
          <button type="button" className="secondary" onClick={() => navigate("/recruits")} disabled={saving}>
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
