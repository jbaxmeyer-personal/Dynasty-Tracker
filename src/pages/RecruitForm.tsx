import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { Recruit, RecruitType } from "../types/models";
import { newId } from "../lib/id";

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
    transfer_from: "",
    transfer_to: "",
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
      <h1>{isNew ? "New recruit" : `Edit ${recruit.name}`}</h1>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={recruit.name} onChange={(e) => set("name", e.target.value)} required />
        </label>
        <label>
          Position
          <input value={recruit.position} onChange={(e) => set("position", e.target.value)} />
        </label>
        <label>
          School
          <input value={recruit.school} onChange={(e) => set("school", e.target.value)} required />
        </label>
        <label>
          Season
          <input
            type="number"
            value={recruit.season}
            onChange={(e) => set("season", Number(e.target.value))}
            required
          />
        </label>
        <label>
          Home state
          <input value={recruit.home_state} onChange={(e) => set("home_state", e.target.value)} />
        </label>
        <label>
          Stars
          <select value={recruit.stars} onChange={(e) => set("stars", Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((s) => (
              <option key={s} value={s}>{"★".repeat(s)}</option>
            ))}
          </select>
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
          <select value={recruit.type} onChange={(e) => set("type", e.target.value as RecruitType)}>
            <option value="HS Signee">HS Signee</option>
            <option value="Transfer In">Transfer In</option>
            <option value="Transfer Out">Transfer Out</option>
          </select>
        </label>
        {recruit.type === "Transfer In" && (
          <label>
            Transfer from
            <input value={recruit.transfer_from} onChange={(e) => set("transfer_from", e.target.value)} />
          </label>
        )}
        {recruit.type === "Transfer Out" && (
          <label>
            Transfer to
            <input value={recruit.transfer_to} onChange={(e) => set("transfer_to", e.target.value)} />
          </label>
        )}
        <label className="span-2">
          Notes
          <textarea value={recruit.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
        </label>

        {error && <p className="status error span-2">{error}</p>}

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
