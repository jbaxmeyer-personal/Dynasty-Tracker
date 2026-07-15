import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { useSettings } from "../context/SettingsContext";
import { TeamLogo } from "../components/TeamLogo";
import { ConferenceBadge } from "../components/ConferenceBadge";
import { findSchool } from "../data/schools";
import { teamGradient } from "../lib/teamColors";
import {
  conferenceRecord,
  formatRecord,
  gameResult,
  seasonRecord,
  weekLabel,
  weekSortValue,
} from "../lib/computedStats";

export function SeasonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSettings } = useSettings();
  const { rows: seasons, loading: seasonsLoading } = useTable("seasons");
  const { rows: games, loading: gamesLoading } = useTable("games");

  const season = seasons.find((s) => s.id === id);
  const seasonGames = games
    .filter((g) => g.season_id === id)
    .sort((a, b) => weekSortValue(a.week) - weekSortValue(b.week));

  // Whatever season you're looking at is "current" - the app reopens here next time.
  useEffect(() => {
    if (season) setSettings({ activeSeasonId: season.id });
  }, [season, setSettings]);

  if (seasonsLoading || gamesLoading) return <div className="page">Loading...</div>;
  if (!season) return <div className="page">Season not found.</div>;

  const record = seasonRecord(games, season.id);
  const confRecord = conferenceRecord(seasonGames, seasons);
  const sortedSeasons = [...seasons].sort((a, b) => b.year - a.year);
  const myConference = findSchool(season.school)?.conference;

  return (
    <div className="page">
      <div className="hero-card" style={{ background: teamGradient(season.school) }}>
        {sortedSeasons.length > 1 && (
          <select
            className="hero-select"
            value={season.id}
            onChange={(e) => navigate(`/seasons/${e.target.value}`)}
            aria-label="Switch season"
          >
            {sortedSeasons.map((s) => (
              <option key={s.id} value={s.id}>{s.year} {s.school}</option>
            ))}
          </select>
        )}
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="list-row">
            <TeamLogo school={season.school} size={44} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.4rem" }}>
                {season.year} {season.school}
              </h1>
              <div className="muted small">
                {formatRecord(record)} ({formatRecord(confRecord)}) · {season.prestige}★ prestige
              </div>
            </div>
          </div>
          <div className="button-row">
            <Link className="button" to={`/seasons/${season.id}/edit`}>
              Edit
            </Link>
            <Link className="button" to="/seasons">
              All seasons
            </Link>
          </div>
        </div>
        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="stat-label">Rank</div>
            <div className="stat-value">{season.preseason_rank ?? "NR"} → {season.final_rank ?? "-"}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Ovr / Off / Def</div>
            <div className="stat-value">{season.ovr_rating}/{season.off_rating}/{season.def_rating}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Toughest place to play</div>
            <div className="stat-value">{season.toughest_place_to_play_rank ?? "-"}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Recruiting class</div>
            <div className="stat-value">{season.recruiting_class_rank || "-"}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Dynasty pts</div>
            <div className="stat-value">{season.dynasty_points_earned}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Roster NIL</div>
            <div className="stat-value">{season.nil_roster_spend.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="page-header">
        <h2>Schedule</h2>
        <div className="button-row">
          <Link className="button" to={`/seasons/${season.id}/schedule`}>
            {seasonGames.length === 0 ? "Set up schedule" : "Edit schedule"}
          </Link>
          <Link className="button" to={`/seasons/${season.id}/games/new`}>
            + Add game
          </Link>
        </div>
      </div>
      <ul className="list">
        {seasonGames.map((g) => {
          const res = gameResult(g);
          const played = res !== null;
          const isBye = g.opponent.trim().toUpperCase() === "BYE";
          return (
            <li key={g.id}>
              <Link to={`/seasons/${season.id}/games/${g.id}`} className="list-row">
                {played ? (
                  <span className={`result-badge result-${res}`}>{res}</span>
                ) : (
                  <span className="result-badge result-none">{isBye ? "-" : ""}</span>
                )}
                {!isBye && g.opponent && (
                  <span className="fixture-logo-wrap">
                    <TeamLogo school={g.opponent} size={36} />
                    <span className="fixture-indicator">
                      {g.home_away === "@" ? "@" : g.home_away === "N" ? "N" : "vs"}
                    </span>
                    {myConference && findSchool(g.opponent)?.conference === myConference && (
                      <ConferenceBadge conference={myConference} className="fixture-conf-badge" />
                    )}
                  </span>
                )}
                <div className="list-row-main">
                  <strong>{weekLabel(g.week)}</strong>{" "}
                  {isBye ? "BYE" : g.opponent || <span className="muted">not scheduled</span>}{" "}
                  {played ? `${g.my_score}-${g.opp_score}${g.ot ? " OT" : ""}` : ""}
                  {g.opp_rank ? ` (#${g.opp_rank})` : ""}
                  {g.notes && <div className="muted small">{g.notes.slice(0, 100)}</div>}
                </div>
              </Link>
            </li>
          );
        })}
        {seasonGames.length === 0 && (
          <p className="muted">
            No schedule yet. <Link to={`/seasons/${season.id}/schedule`}>Set it up</Link> so you
            can see the whole season laid out and fill in results as you play.
          </p>
        )}
      </ul>

      {(season.ad_goals.length > 0 || season.notes) && (
        <div className="hero-card" style={{ background: teamGradient(season.school) }}>
          {season.ad_goals.length > 0 && (
            <>
              <h3 style={{ marginTop: 0 }}>AD goals</h3>
              <ul className="list">
                {season.ad_goals.map((g, i) => (
                  <li key={i}>
                    {g.met ? "✅" : "⬜"} {g.goal}
                  </li>
                ))}
              </ul>
            </>
          )}
          {season.notes && (
            <>
              <h3 style={{ marginTop: season.ad_goals.length > 0 ? undefined : 0 }}>Notes</h3>
              <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{season.notes}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
