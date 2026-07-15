import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { NationalLandscape, PlayoffBracket } from "../types/models";
import { newId } from "../lib/id";
import { SCHOOL_NAMES } from "../data/schools";
import { ALL_CONFERENCES } from "../data/nationalLandscape";

function emptyPlayoff(): PlayoffBracket {
  return {
    seed1: "", seed2: "", seed3: "", seed4: "",
    seed5: "", seed6: "", seed7: "", seed8: "",
    seed9: "", seed10: "", seed11: "", seed12: "",
    r1_5v12_winner: "", r1_6v11_winner: "", r1_7v10_winner: "", r1_8v9_winner: "",
    qf1_winner: "", qf2_winner: "", qf3_winner: "", qf4_winner: "",
    sf1_winner: "", sf2_winner: "", champion: "",
  };
}

function emptyLandscape(): NationalLandscape {
  return {
    id: newId("landscape"),
    year: new Date().getFullYear(),
    playoff: emptyPlayoff(),
    conference_champions: ALL_CONFERENCES.map((conference) => ({ conference, champion: "" })),
    heisman_winner: "",
    heisman_school: "",
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

// A bracket-game winner picker - only offers the two teams actually in that
// game, so you can't pick someone who isn't alive in this matchup. Once
// either seed feeding the game is unset, the winner clears itself.
function WinnerSelect({
  label,
  teamA,
  teamB,
  value,
  onChange,
}: {
  label: string;
  teamA: string;
  teamB: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [teamA, teamB].filter(Boolean);
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={options.length === 0}>
        <option value="">
          {options.length === 0 ? "-- set both teams first --" : "-- select winner --"}
        </option>
        {options.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </label>
  );
}

// After any single field changes, downstream winner picks that no longer
// match either of their feeding teams are stale - clear them rather than
// silently keeping an impossible winner around.
function reconcilePlayoff(p: PlayoffBracket): PlayoffBracket {
  const next = { ...p };
  const clearIfStale = (winner: keyof PlayoffBracket, a: string, b: string) => {
    if (next[winner] && next[winner] !== a && next[winner] !== b) next[winner] = "";
  };
  clearIfStale("r1_5v12_winner", next.seed5, next.seed12);
  clearIfStale("r1_6v11_winner", next.seed6, next.seed11);
  clearIfStale("r1_7v10_winner", next.seed7, next.seed10);
  clearIfStale("r1_8v9_winner", next.seed8, next.seed9);
  clearIfStale("qf1_winner", next.seed1, next.r1_8v9_winner);
  clearIfStale("qf2_winner", next.seed2, next.r1_7v10_winner);
  clearIfStale("qf3_winner", next.seed3, next.r1_6v11_winner);
  clearIfStale("qf4_winner", next.seed4, next.r1_5v12_winner);
  clearIfStale("sf1_winner", next.qf1_winner, next.qf4_winner);
  clearIfStale("sf2_winner", next.qf2_winner, next.qf3_winner);
  clearIfStale("champion", next.sf1_winner, next.sf2_winner);
  return next;
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

  function setPlayoffField<K extends keyof PlayoffBracket>(key: K, value: PlayoffBracket[K]) {
    setLandscape((prev) => ({
      ...prev,
      playoff: reconcilePlayoff({ ...prev.playoff, [key]: value }),
    }));
  }

  function setConfChampion(idx: number, champion: string) {
    setLandscape((prev) => {
      const next = [...prev.conference_champions];
      next[idx] = { ...next[idx], champion };
      return { ...prev, conference_champions: next };
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
        The national picture for one simulated year - champions and rankings across the whole
        sport, separate from your own season stats.
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

        <h3 className="span-2">Playoff - 12-team bracket</h3>

        <h4 className="span-2">Seeds 1-4 (byes)</h4>
        <SchoolSelect label="Seed 1" value={landscape.playoff.seed1} onChange={(v) => setPlayoffField("seed1", v)} />
        <SchoolSelect label="Seed 2" value={landscape.playoff.seed2} onChange={(v) => setPlayoffField("seed2", v)} />
        <SchoolSelect label="Seed 3" value={landscape.playoff.seed3} onChange={(v) => setPlayoffField("seed3", v)} />
        <SchoolSelect label="Seed 4" value={landscape.playoff.seed4} onChange={(v) => setPlayoffField("seed4", v)} />

        <h4 className="span-2">Seeds 5-12 (first round)</h4>
        <SchoolSelect label="Seed 5" value={landscape.playoff.seed5} onChange={(v) => setPlayoffField("seed5", v)} />
        <SchoolSelect label="Seed 12" value={landscape.playoff.seed12} onChange={(v) => setPlayoffField("seed12", v)} />
        <SchoolSelect label="Seed 6" value={landscape.playoff.seed6} onChange={(v) => setPlayoffField("seed6", v)} />
        <SchoolSelect label="Seed 11" value={landscape.playoff.seed11} onChange={(v) => setPlayoffField("seed11", v)} />
        <SchoolSelect label="Seed 7" value={landscape.playoff.seed7} onChange={(v) => setPlayoffField("seed7", v)} />
        <SchoolSelect label="Seed 10" value={landscape.playoff.seed10} onChange={(v) => setPlayoffField("seed10", v)} />
        <SchoolSelect label="Seed 8" value={landscape.playoff.seed8} onChange={(v) => setPlayoffField("seed8", v)} />
        <SchoolSelect label="Seed 9" value={landscape.playoff.seed9} onChange={(v) => setPlayoffField("seed9", v)} />

        <h4 className="span-2">First round</h4>
        <WinnerSelect
          label="#5 vs #12"
          teamA={landscape.playoff.seed5}
          teamB={landscape.playoff.seed12}
          value={landscape.playoff.r1_5v12_winner}
          onChange={(v) => setPlayoffField("r1_5v12_winner", v)}
        />
        <WinnerSelect
          label="#6 vs #11"
          teamA={landscape.playoff.seed6}
          teamB={landscape.playoff.seed11}
          value={landscape.playoff.r1_6v11_winner}
          onChange={(v) => setPlayoffField("r1_6v11_winner", v)}
        />
        <WinnerSelect
          label="#7 vs #10"
          teamA={landscape.playoff.seed7}
          teamB={landscape.playoff.seed10}
          value={landscape.playoff.r1_7v10_winner}
          onChange={(v) => setPlayoffField("r1_7v10_winner", v)}
        />
        <WinnerSelect
          label="#8 vs #9"
          teamA={landscape.playoff.seed8}
          teamB={landscape.playoff.seed9}
          value={landscape.playoff.r1_8v9_winner}
          onChange={(v) => setPlayoffField("r1_8v9_winner", v)}
        />

        <h4 className="span-2">Quarterfinals</h4>
        <WinnerSelect
          label="#1 vs (8/9 winner)"
          teamA={landscape.playoff.seed1}
          teamB={landscape.playoff.r1_8v9_winner}
          value={landscape.playoff.qf1_winner}
          onChange={(v) => setPlayoffField("qf1_winner", v)}
        />
        <WinnerSelect
          label="#2 vs (7/10 winner)"
          teamA={landscape.playoff.seed2}
          teamB={landscape.playoff.r1_7v10_winner}
          value={landscape.playoff.qf2_winner}
          onChange={(v) => setPlayoffField("qf2_winner", v)}
        />
        <WinnerSelect
          label="#3 vs (6/11 winner)"
          teamA={landscape.playoff.seed3}
          teamB={landscape.playoff.r1_6v11_winner}
          value={landscape.playoff.qf3_winner}
          onChange={(v) => setPlayoffField("qf3_winner", v)}
        />
        <WinnerSelect
          label="#4 vs (5/12 winner)"
          teamA={landscape.playoff.seed4}
          teamB={landscape.playoff.r1_5v12_winner}
          value={landscape.playoff.qf4_winner}
          onChange={(v) => setPlayoffField("qf4_winner", v)}
        />

        <h4 className="span-2">Semifinals</h4>
        <WinnerSelect
          label="QF1 vs QF4 winners"
          teamA={landscape.playoff.qf1_winner}
          teamB={landscape.playoff.qf4_winner}
          value={landscape.playoff.sf1_winner}
          onChange={(v) => setPlayoffField("sf1_winner", v)}
        />
        <WinnerSelect
          label="QF2 vs QF3 winners"
          teamA={landscape.playoff.qf2_winner}
          teamB={landscape.playoff.qf3_winner}
          value={landscape.playoff.sf2_winner}
          onChange={(v) => setPlayoffField("sf2_winner", v)}
        />

        <h4 className="span-2">National Championship</h4>
        <WinnerSelect
          label="Champion"
          teamA={landscape.playoff.sf1_winner}
          teamB={landscape.playoff.sf2_winner}
          value={landscape.playoff.champion}
          onChange={(v) => setPlayoffField("champion", v)}
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

        <h3 className="span-2">Awards</h3>
        <label>
          Heisman winner
          <input
            value={landscape.heisman_winner}
            onChange={(e) => set("heisman_winner", e.target.value)}
            placeholder="e.g. J. Baker"
          />
        </label>
        <SchoolSelect
          label="Heisman school"
          value={landscape.heisman_school}
          onChange={(v) => set("heisman_school", v)}
        />

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
