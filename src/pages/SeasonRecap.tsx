import { Link, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamLogo } from "../components/TeamLogo";
import { teamGradient } from "../lib/teamColors";
import { findSchool } from "../data/schools";
import {
  bestWin,
  conferenceRecord,
  formatRecord,
  gameResult,
  isPlayoffWeek,
  seasonRecord,
  weekLabel,
  weekSortValue,
} from "../lib/computedStats";

// A polished, screenshot-friendly one-card summary of a season - for sharing
// into league chats without exposing the rest of the dynasty.
export function SeasonRecapPage() {
  const { id } = useParams();
  const { rows: seasons, loading: sl } = useTable("seasons");
  const { rows: games, loading: gl } = useTable("games");
  const { rows: landscape } = useTable("national_landscape");

  if (sl || gl) return <div className="page">Loading...</div>;
  const season = seasons.find((s) => s.id === id);
  if (!season) {
    return (
      <div className="page">
        <p className="muted">Season not found.</p>
        <Link to="/seasons">Back to seasons</Link>
      </div>
    );
  }

  const seasonGames = games.filter((g) => g.season_id === season.id);
  const record = seasonRecord(games, season.id);
  const confRec = conferenceRecord(seasonGames, [season]);
  const bw = bestWin(seasonGames);
  const wonConf = seasonGames.some((g) => g.week === "CC" && gameResult(g) === "W");
  const natty = seasonGames.some((g) => g.week === "Natty" && gameResult(g) === "W");

  const cfpGames = seasonGames
    .filter((g) => isPlayoffWeek(g.week))
    .sort((a, b) => weekSortValue(a.week) - weekSortValue(b.week));
  const lastCfp = cfpGames[cfpGames.length - 1];
  let postseason = "";
  if (natty) postseason = "National Champions 🏆";
  else if (lastCfp) postseason = `${gameResult(lastCfp) === "W" ? "Won" : "Lost"} ${weekLabel(lastCfp.week)}`;
  else {
    const bowl = seasonGames.find((g) => g.week === "Bowl" && gameResult(g) !== null);
    if (bowl) postseason = `${gameResult(bowl) === "W" ? "Won" : "Lost"} bowl vs ${bowl.opponent}`;
  }

  const heisman = landscape.find(
    (l) => l.year === season.year && l.heisman_school === season.school && l.heisman_winner
  );
  const firstTeamAA = season.all_americans.filter((a) => a.team === "1st");
  const firstRounders = season.draft_picks.filter((d) => d.round === 1);
  const draftCount = season.draft_picks.length;
  const conference = findSchool(season.school)?.conference ?? "Conference";

  const shareUrl = window.location.origin + import.meta.env.BASE_URL;
  function handleShare() {
    const text =
      `${season!.year} ${season!.school}: ${formatRecord(record)}` +
      `${season!.final_rank ? `, finished #${season!.final_rank}` : ""}` +
      `${wonConf ? `, ${conference} champions` : ""}. Tracked in Dynasty Tracker.`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) nav.share({ title: "Dynasty Tracker", text, url: shareUrl }).catch(() => {});
    else navigator.clipboard?.writeText(`${text} ${shareUrl}`).catch(() => {});
  }

  return (
    <div className="page">
      <div className="button-row" style={{ marginBottom: "0.75rem" }}>
        <Link className="button secondary" to={`/seasons/${season.id}`}>
          Back
        </Link>
        <button type="button" onClick={handleShare}>
          Share
        </button>
      </div>

      <div className="recap-card" style={{ background: teamGradient(season.school) }}>
        <div className="recap-head">
          <TeamLogo school={season.school} size={72} rank={season.final_rank ?? undefined} />
          <div>
            <div className="recap-year">{season.year} Season</div>
            <div className="recap-school">{season.school}</div>
          </div>
        </div>
        <div className="recap-record">{formatRecord(record)}</div>
        <div className="recap-sub">
          {season.final_rank ? `Final #${season.final_rank}` : "Unranked"} · Conf {formatRecord(confRec)} ·{" "}
          {season.prestige}★
        </div>
        {(wonConf || postseason) && (
          <div className="recap-postseason">
            {wonConf && <span className="recap-chip">🥇 {conference} Champions</span>}
            {postseason && <span className="recap-chip">{postseason}</span>}
          </div>
        )}
      </div>

      {bw && (
        <section className="card">
          <h2>Signature win</h2>
          <div className="list-row">
            <TeamLogo school={bw.opponent} size={36} rank={bw.opp_rank ?? undefined} />
            <div className="list-row-main">
              <strong>
                {bw.home_away === "@" ? "@ " : ""}
                {bw.opponent}
              </strong>
              <div className="muted small">
                {bw.my_score}-{bw.opp_score}
                {bw.ot ? " OT" : ""} · {weekLabel(bw.week)}
              </div>
            </div>
          </div>
        </section>
      )}

      {(heisman || firstTeamAA.length > 0 || draftCount > 0) && (
        <section className="card">
          <h2>Honors</h2>
          <ul className="honor-list">
            {heisman && (
              <li>
                🏈 <span><strong>{heisman.heisman_winner}</strong>{heisman.heisman_position ? ` (${heisman.heisman_position})` : ""} · Heisman Trophy</span>
              </li>
            )}
            {firstTeamAA.map((a, i) => (
              <li key={`aa${i}`}>
                ⭐ <span>{a.name}{a.position ? ` (${a.position})` : ""} · 1st-team All-American</span>
              </li>
            ))}
            {firstRounders.map((d, i) => (
              <li key={`dp${i}`}>
                🎯 <span>{d.name} · 1st-round pick{d.pick ? ` (#${d.pick})` : ""}</span>
              </li>
            ))}
          </ul>
          {draftCount > 0 && (
            <div className="muted small">
              {draftCount} player{draftCount > 1 ? "s" : ""} drafted
            </div>
          )}
        </section>
      )}

      {season.notes && (
        <section className="card">
          <h2>The story</h2>
          <p className="recap-notes">{season.notes}</p>
        </section>
      )}

      <p className="muted small recap-brand">
        🏈 Dynasty Tracker · {shareUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </p>
    </div>
  );
}
