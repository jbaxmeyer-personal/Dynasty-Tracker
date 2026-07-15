import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { BowlResult, NationalLandscape } from "../types/models";
import { newId } from "../lib/id";
import { SCHOOL_NAMES } from "../data/schools";
import { MAJOR_BOWLS, MAJOR_CONFERENCES } from "../data/nationalLandscape";

function emptyLandscape(): NationalLandscape {
  return {
    id: newId("landscape"),
    year: new Date().getFullYear(),
    national_champion: "",
    national_runner_up: "",
    playoff_semifinalists: ["", ""],
    conference_champions: MAJOR_CONFERENCES.map((conference) => ({ conference, champion: "" })),
    bowl_results: MAJOR_BOWLS.map((bowl) => ({ bowl, winner: "", loser: "", score: "" })),
    heisman_winner: "",
    conference_avg_stars: MAJOR_CONFERENCES.map((conference) => ({ conference, avg_stars: 0 })),
    final_top_25: Array(25).fill(""),
    notes: "",
  };
}

function SchoolSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- select --</option>
        {SCHOOL_NAMES.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </label>
  );
}

export function NationalLandscapeFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { rows, save, remove, loading } = useTable("national_landscape");
  const [landscape, setLandscape] = useState<NationalLandscape>(emptyLandscape());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && !loading) {
      const existing = rows.find((r) => r.id === id);
      if (existing) setLandscape(existing);
    }
  }, [isNew, id, rows, loading]);

  function set<K extends keyof NationalLandscape>(key: K, value: NationalLandscape[K]) {
    setLandscape((prev) => ({ ...prev, [key]: value }));
  }

  function setSemifinalist(idx: 0 | 1, value: string) {
    setLandscape((prev) => {
      const next: [string, string] = [...prev.playoff_semifinalists];
      next[idx] = value;
      return { ...prev, playoff_semifinalists: next };
    });
  }

  function setConfChampion(idx: number, champion: string) {
    setLandscape((prev) => {
      const next = [...prev.conference_champions];
      next[idx] = { ...next[idx], champion };
      return { ...prev, conference_champions: next };
    });
  }

  function setAvgStars(idx: number, avg_stars: number) {
    setLandscape((prev) => {
      const next = [...prev.conference_avg_stars];
      next[idx] = { ...next[idx], avg_stars };
      return { ...prev, conference_avg_stars: next };
    });
  }

  function setBowl(idx: number, patch: Partial<BowlResult>) {
    setLandscape((prev) => {
      const next = [...prev.bowl_results];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, bowl_results: next };
    });
  }

  function setTop25(idx: number, value: string) {
    setLandscape((prev) => {
      const next = [...prev.final_top_25];
      next[idx] = value;
      return { ...prev, final_top_25: next };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await save(landscape, `${isNew ? "Add" : "Update"} ${landscape.year} national landscape`);
      navigate(`/landscape/${landscape.year}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this year's national landscape?")) return;
    await remove(landscape.id, `Delete ${landscape.year} national landscape`);
    navigate("/landscape");
  }

  return (
    <div className="page">
      <h1>{isNew ? "New national landscape" : `Edit ${landscape.year} national landscape`}</h1>
      <p className="muted small">
        The national picture for one simulated year - champions, bowls, and rankings across the
        whole sport, separate from your own season stats.
      </p>
      {error && <p className="status error">{error}</p>}
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Year
          <input
            type="number"
            value={landscape.year}
            onChange={(e) => set("year", Number(e.target.value))}
          />
        </label>

        <h3 className="span-2">Playoff</h3>
        <SchoolSelect
          label="National champion"
          value={landscape.national_champion}
          onChange={(v) => set("national_champion", v)}
        />
        <SchoolSelect
          label="Runner-up"
          value={landscape.national_runner_up}
          onChange={(v) => set("national_runner_up", v)}
        />
        <SchoolSelect
          label="Semifinal loser"
          value={landscape.playoff_semifinalists[0]}
          onChange={(v) => setSemifinalist(0, v)}
        />
        <SchoolSelect
          label="Semifinal loser"
          value={landscape.playoff_semifinalists[1]}
          onChange={(v) => setSemifinalist(1, v)}
        />

        <h3 className="span-2">Conference champions</h3>
        {landscape.conference_champions.map((cc, i) => (
          <SchoolSelect
            key={cc.conference}
            label={cc.conference}
            value={cc.champion}
            onChange={(v) => setConfChampion(i, v)}
          />
        ))}

        <h3 className="span-2">Bowl results</h3>
        {landscape.bowl_results.map((b, i) => (
          <div key={b.bowl} className="span-2 grid-2col small" style={{ marginBottom: "0.5rem" }}>
            <strong className="span-2">{b.bowl}</strong>
            <SchoolSelect label="Winner" value={b.winner} onChange={(v) => setBowl(i, { winner: v })} />
            <SchoolSelect label="Loser" value={b.loser} onChange={(v) => setBowl(i, { loser: v })} />
            <label className="span-2">
              Score
              <input value={b.score} onChange={(e) => setBowl(i, { score: e.target.value })} placeholder="30-27" />
            </label>
          </div>
        ))}

        <h3 className="span-2">Awards</h3>
        <label>
          Heisman winner
          <input
            value={landscape.heisman_winner}
            onChange={(e) => set("heisman_winner", e.target.value)}
            placeholder="e.g. J. Baker"
          />
        </label>

        <h3 className="span-2">Conference recruiting - average stars</h3>
        {landscape.conference_avg_stars.map((cs, i) => (
          <label key={cs.conference}>
            {cs.conference}
            <input
              type="number"
              step="0.01"
              min={0}
              max={5}
              value={cs.avg_stars}
              onChange={(e) => setAvgStars(i, Number(e.target.value))}
            />
          </label>
        ))}

        <h3 className="span-2">Final Top 25</h3>
        <div className="span-2 grid-2col small">
          {landscape.final_top_25.map((team, i) => (
            <label key={i}>
              #{i + 1}
              <select value={team} onChange={(e) => setTop25(i, e.target.value)}>
                <option value="">-- select --</option>
                {SCHOOL_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <label className="span-2">
          Notes
          <textarea value={landscape.notes} onChange={(e) => set("notes", e.target.value)} rows={4} />
        </label>

        <div className="span-2 button-row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
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
