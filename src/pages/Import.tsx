import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useTable } from "../hooks/useTable";
import type { ImportTable, ParsedRow } from "../lib/parseClient";
import { parseScreenshot } from "../lib/parseClient";
import { newId } from "../lib/id";

type Mode = "batch" | "interactive";

const TABLE_LABELS: Record<ImportTable, string> = {
  recruits: "Recruiting board",
  school_prestige: "School prestige",
  season_team_stats: "Season team stats",
};

const COLUMNS: Record<ImportTable, string[]> = {
  recruits: ["name", "position", "home_state", "stars", "overall", "type"],
  school_prestige: ["school", "conference", "year", "prestige"],
  season_team_stats: [
    "school", "year",
    "off_pts_pg", "off_yds_pg", "off_pass_yds_pg", "off_rush_yds_pg", "off_int", "off_fum",
    "def_pts_pg", "def_yds_pg", "def_pass_yds_pg", "def_rush_yds_pg", "def_sacks", "def_int", "def_fum",
    "turnover_diff",
  ],
};

interface ReviewRow {
  key: string;
  fields: ParsedRow;
  sourceFile: string;
}

export function ImportPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [table, setTable] = useState<ImportTable>("recruits");
  const [mode, setMode] = useState<Mode>("batch");
  const [school, setSchool] = useState("");
  const [season, setSeason] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  const recruitsTable = useTable("recruits");
  const prestigeTable = useTable("school_prestige");
  const statsTable = useTable("season_team_stats");

  if (!settings.workerUrl) {
    return (
      <div className="page">
        <h1>Import from screenshot</h1>
        <p className="muted">
          Set a Worker URL in <a href="#/settings">Settings</a> first. See{" "}
          <code>worker/README.md</code> for how to deploy the parsing worker.
        </p>
      </div>
    );
  }

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setParsing(true);
    try {
      for (const file of files) {
        const result = await parseScreenshot(
          settings.workerUrl,
          table,
          file,
          { school, season },
          settings.workerSecret
        );
        const parsed = result.rows.map((fields) => ({ key: newId("row"), fields, sourceFile: file.name }));
        // Batch mode parses everything then shows one review table; interactive mode
        // surfaces each screenshot's rows as soon as they're parsed (same state, same UI).
        setRows((prev) => [...prev, ...parsed]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  }

  function updateField(key: string, field: string, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, fields: { ...r.fields, [field]: value } } : r))
    );
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  async function commitAll() {
    setCommitting(true);
    setError(null);
    try {
      for (const row of rows) {
        if (table === "recruits") {
          await recruitsTable.save(
            {
              id: newId("recruit"),
              school: String(row.fields.school ?? school),
              season: Number(row.fields.season ?? season),
              name: String(row.fields.name ?? ""),
              home_state: String(row.fields.home_state ?? ""),
              position: String(row.fields.position ?? ""),
              stars: Number(row.fields.stars ?? 3),
              overall: Number(row.fields.overall ?? 0),
              type: (row.fields.type as never) ?? "HS Signee",
              transfer_from: String(row.fields.transfer_from ?? ""),
              transfer_to: String(row.fields.transfer_to ?? ""),
              notes: String(row.fields.notes ?? ""),
            },
            `Import recruit: ${row.fields.name}`
          );
        } else if (table === "school_prestige") {
          await prestigeTable.save(
            {
              id: newId("prestige"),
              school: String(row.fields.school ?? school),
              conference: String(row.fields.conference ?? ""),
              year: Number(row.fields.year ?? season),
              prestige: Number(row.fields.prestige ?? 0),
            },
            `Import prestige: ${row.fields.school} ${row.fields.year}`
          );
        } else {
          await statsTable.save(
            {
              id: newId("stats"),
              school: String(row.fields.school ?? school),
              year: Number(row.fields.year ?? season),
              off_pts_pg: Number(row.fields.off_pts_pg ?? 0),
              off_yds_pg: Number(row.fields.off_yds_pg ?? 0),
              off_pass_yds_pg: Number(row.fields.off_pass_yds_pg ?? 0),
              off_rush_yds_pg: Number(row.fields.off_rush_yds_pg ?? 0),
              off_int: Number(row.fields.off_int ?? 0),
              off_fum: Number(row.fields.off_fum ?? 0),
              def_pts_pg: Number(row.fields.def_pts_pg ?? 0),
              def_yds_pg: Number(row.fields.def_yds_pg ?? 0),
              def_pass_yds_pg: Number(row.fields.def_pass_yds_pg ?? 0),
              def_rush_yds_pg: Number(row.fields.def_rush_yds_pg ?? 0),
              def_sacks: Number(row.fields.def_sacks ?? 0),
              def_int: Number(row.fields.def_int ?? 0),
              def_fum: Number(row.fields.def_fum ?? 0),
              turnover_diff: Number(row.fields.turnover_diff ?? 0),
            },
            `Import team stats: ${row.fields.school} ${row.fields.year}`
          );
        }
      }
      setRows([]);
      navigate(table === "recruits" ? "/recruits" : "/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCommitting(false);
    }
  }

  const columns = COLUMNS[table];

  return (
    <div className="page">
      <h1>Import from screenshot</h1>
      <p className="muted">
        Photograph or upload the {TABLE_LABELS[table].toLowerCase()} screen. Parsed rows are a
        draft — review and edit before committing.
      </p>

      <div className="form-grid">
        <label>
          Data type
          <select value={table} onChange={(e) => setTable(e.target.value as ImportTable)}>
            {Object.entries(TABLE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="batch">Batch (upload several, review once)</option>
            <option value="interactive">Interactive (one at a time)</option>
          </select>
        </label>
        <label>
          School (context hint)
          <input value={school} onChange={(e) => setSchool(e.target.value)} />
        </label>
        <label>
          Season (context hint)
          <input type="number" value={season} onChange={(e) => setSeason(Number(e.target.value))} />
        </label>
      </div>

      <label className="button">
        {parsing ? "Parsing..." : "Take photo / choose image(s)"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple={mode === "batch"}
          onChange={handleFiles}
          disabled={parsing}
          style={{ display: "none" }}
        />
      </label>

      {error && <p className="status error">{error}</p>}

      {rows.length > 0 && (
        <>
          <h2>Review ({rows.length} row{rows.length === 1 ? "" : "s"})</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    {columns.map((c) => (
                      <td key={c}>
                        <input
                          value={String(r.fields[c] ?? "")}
                          onChange={(e) => updateField(r.key, c, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button type="button" className="button-link" onClick={() => removeRow(r.key)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={commitAll} disabled={committing}>
            {committing ? "Committing..." : `Commit ${rows.length} row(s) to GitHub`}
          </button>
        </>
      )}
    </div>
  );
}
