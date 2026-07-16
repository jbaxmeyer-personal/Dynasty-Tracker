import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import type { Game, HomeAway } from "../types/models";
import { newId } from "../lib/id";
import { OPPONENT_NAMES } from "../data/schools";
import { TeamLogo } from "../components/TeamLogo";

// Regular season weeks only - conference champ and bowl opponents aren't
// known until after the season plays out, so those stay on the one-by-one
// "+ Add game" flow instead of this upfront schedule.
const REGULAR_SEASON_WEEKS = Array.from({ length: 16 }, (_, i) => i);

interface WeekRow {
  week: number;
  opponent: string; // "" = not scheduled, "BYE" = bye week, else school name
  home_away: HomeAway;
}

function emptyRow(week: number): WeekRow {
  return { week, opponent: "", home_away: "" };
}

export function ScheduleSetupPage() {
  const { seasonId } = useParams();
  const navigate = useNavigate();
  const { rows: seasons } = useTable("seasons");
  const { rows: games, loading, saveMany } = useTable("games");
  const season = seasons.find((s) => s.id === seasonId);

  const [weekRows, setWeekRows] = useState<WeekRow[]>(
    REGULAR_SEASON_WEEKS.map((w) => emptyRow(w))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedExisting, setLoadedExisting] = useState(false);

  // Pre-fill from any games already logged for this season, so this page
  // doubles as "view/edit the whole schedule," not just first-time setup.
  useEffect(() => {
    if (!loading && !loadedExisting) {
      const bySeasonGames = games.filter((g) => g.season_id === seasonId);
      if (bySeasonGames.length > 0) {
        setWeekRows((prev) =>
          prev.map((r) => {
            const existing = bySeasonGames.find((g) => g.week === r.week);
            return existing
              ? { week: r.week, opponent: existing.opponent, home_away: existing.home_away }
              : r;
          })
        );
      }
      setLoadedExisting(true);
    }
  }, [loading, loadedExisting, games, seasonId]);

  function updateRow(week: number, patch: Partial<WeekRow>) {
    setWeekRows((prev) => prev.map((r) => (r.week === week ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!seasonId) return;
    setSaving(true);
    setError(null);
    try {
      const existingBySeasonGames = games.filter((g) => g.season_id === seasonId);
      const toSave: Game[] = [];
      for (const row of weekRows) {
        if (!row.opponent) continue;
        const existing = existingBySeasonGames.find((g) => g.week === row.week);
        if (existing) {
          toSave.push({ ...existing, opponent: row.opponent, home_away: row.home_away });
        } else {
          toSave.push({
            id: newId("game"),
            season_id: seasonId,
            week: row.week,
            my_rank: null,
            opp_rank: null,
            tv_tier: null,
            home_away: row.home_away,
            opponent: row.opponent,
            my_score: null,
            opp_score: null,
            ot: false,
            notes: "",
          });
        }
      }
      if (toSave.length === 0) {
        setError("Set at least one week's opponent before saving.");
        setSaving(false);
        return;
      }
      await saveMany(toSave, `Set up ${season?.year ?? ""} schedule (${toSave.length} weeks)`);
      navigate(`/seasons/${seasonId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>{season ? `${season.year} ${season.school} schedule` : "Season schedule"}</h1>
      <p className="muted small">
        Lay out the regular season now - opponents and byes as you know them. Scores get filled
        in week by week as you play; conference championship and bowl games are added separately
        once you know who you're facing.
      </p>
      {error && <p className="status error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="schedule-rows">
          {weekRows.map((row) => (
            <div className="schedule-row" key={row.week}>
              <span className="schedule-week">Wk {row.week}</span>
              {row.opponent && row.opponent !== "BYE" && <TeamLogo school={row.opponent} size={22} />}
              <select
                value={row.opponent}
                onChange={(e) => updateRow(row.week, { opponent: e.target.value })}
              >
                <option value="">-- not scheduled --</option>
                <option value="BYE">BYE</option>
                {OPPONENT_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {row.opponent && row.opponent !== "BYE" && (
                <select
                  value={row.home_away}
                  onChange={(e) => updateRow(row.week, { home_away: e.target.value as HomeAway })}
                  className="schedule-homeaway"
                >
                  <option value="">Home</option>
                  <option value="@">Away</option>
                  <option value="N">Neutral</option>
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="button-row" style={{ marginTop: "1rem" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}
