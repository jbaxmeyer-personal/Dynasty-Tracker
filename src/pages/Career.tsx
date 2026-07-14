import { useTable } from "../hooks/useTable";
import {
  bowlRecord,
  coachStats,
  formatRecord,
  homeAwayRecord,
  tvTierSplits,
  vsOpponent,
} from "../lib/computedStats";
import { TeamLogo } from "../components/TeamLogo";

export function CareerPage() {
  const { rows: games, loading: gamesLoading } = useTable("games");
  const { rows: seasons, loading: seasonsLoading } = useTable("seasons");

  if (gamesLoading || seasonsLoading) return <div className="page">Loading...</div>;

  const stats = coachStats(games, seasons);
  const splits = homeAwayRecord(games);
  const tiers = tvTierSplits(games);
  const vs = Array.from(vsOpponent(games).entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="page">
      <h1>Career stats</h1>

      <section className="card">
        <h2>Coach record</h2>
        <div className="grid-2col small">
          <div>Overall: {formatRecord(stats.record)} ({(stats.winPct * 100).toFixed(1)}%)</div>
          <div>Seasons coached: {stats.seasons}</div>
          <div>Bowl record: {formatRecord(stats.bowlRecord)}</div>
          <div>Vs. ranked: {formatRecord(stats.rankedRecord)}</div>
        </div>
      </section>

      <section className="card">
        <h2>Splits</h2>
        <div className="grid-2col small">
          <div>Home: {formatRecord(splits.home)}</div>
          <div>Away: {formatRecord(splits.away)}</div>
          <div>Neutral: {formatRecord(splits.neutral)}</div>
          <div>Bowl: {formatRecord(bowlRecord(games))}</div>
        </div>
        <h3>By TV tier</h3>
        <div className="grid-2col small">
          {Object.entries(tiers).map(([tier, r]) => (
            <div key={tier}>{tier}: {formatRecord(r)}</div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Record by opponent</h2>
        <ul className="list">
          {vs.map(([opponent, r]) => (
            <li key={opponent} className="list-row">
              <TeamLogo school={opponent} size={24} />
              <span>{opponent}: {formatRecord(r)}</span>
            </li>
          ))}
          {vs.length === 0 && <p className="muted">No games logged yet.</p>}
        </ul>
      </section>
    </div>
  );
}
