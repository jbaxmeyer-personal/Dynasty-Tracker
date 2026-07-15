import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { ClassYear, Recruit, RecruitType } from "../types/models";
import { newId } from "../lib/id";
import { SCHOOL_NAMES } from "../data/schools";
import { TeamLogo } from "../components/TeamLogo";

const CLASS_YEARS: ClassYear[] = ["Fr", "So", "Jr", "Sr", "Gr"];

function emptyRecruit(school: string, season: number): Recruit {
  return {
    id: newId("recruit"),
    school,
    season,
    name: "",
    home_state: "",
    position: "",
    stars: 3,
    overall: 60,
    type: "HS Signee",
    class_year: "",
    in_season: false,
    notes: "",
  };
}

export function RecruitFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { rows, save, remove, loading } = useTable("recruits");
  const { rows: seasons } = useTable("seasons");
  const currentSchool = seasons.slice().sort((a, b) => b.year - a.year)[0]?.school ?? "";
  const currentYear = seasons.slice().sort((a, b) => b.year - a.year)[0]?.year ?? new Date().getFullYear();

  const [recruit, setRecruit] = useState<Recruit>(emptyRecruit(currentSchool, currentYear));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializedFromPrefill, setInitializedFromPrefill] = useState(false);

  useEffect(() => {
    if (!isNew && !loading) {
      const existing = rows.find((r) => r.id === id);
      if (existing) setRecruit(existing);
    }
  }, [isNew, id, rows, loading]);

  // Support prefill from the screenshot-import review flow via query params.
  useEffect(() => {
    if (isNew && !initializedFromPrefill && searchParams.has("prefill")) {
      try {
        const prefill = JSON.parse(searchParams.get("prefill") ?? "{}");
        setRecruit((prev) => ({ ...prev, ...prefill }));
      } catch {
        // ignore malformed prefill
      }
      setInitializedFromPrefill(true);
    }
  }, [isNew, initializedFromPrefill, searchParams]);

  useEffect(() => {
    if (isNew && !initializedFromPrefill) {
      setRecruit((prev) => ({ ...prev, school: currentSchool, season: currentYear }));
    }
  }, [isNew, initializedFromPrefill, currentSchool, currentYear]);

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
          <input value={recruit.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          Position
          <input value={recruit.position} onChange={(e) => set("position", e.target.value)} />
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
          <input
            type="number"
            value={recruit.season}
            onChange={(e) => set("season", Number(e.target.value))}
          />
        </label>
        <label>
          Home state
          <input value={recruit.home_state} onChange={(e) => set("home_state", e.target.value)} />
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
          <input
            type="number"
            value={recruit.overall}
            onChange={(e) => set("overall", Number(e.target.value))}
          />
        </label>
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
        <label className="span-2">
          Notes
          <textarea value={recruit.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
        </label>

        <div className="span-2 button-row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save recruit"}
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
