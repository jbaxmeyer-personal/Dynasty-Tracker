import { useTable } from "../hooks/useTable";
import {
  bowlRecord,
  coachStats,
  formatRecord,
  homeAwayRecord,
  seasonRecord,
  tvTierSplits,
  vsOpponent,
  winPct,
} from "../lib/computedStats";
import { TeamLogo } from "../components/TeamLogo";
import { BarTrendChart, LineTrendChart } from "../components/TrendCharts";
import type { BarPoint, LineSeries } from "../components/TrendCharts";

export function CareerPage() {
  const { rows: games, loading: gamesLoading } = useTable("games");
  const { rows: seasons, loading: seasonsLoading } = useTable("seasons");

  if (gamesLoading || seasonsLoading) return <div className="page">Loading...</div>;

  const stats = coachStats(games, seasons);
  const splits = homeAwayRecord(games);
  const tiers = tvTierSplits(games);
  const vs = Array.from(vsOpponent(games, seasons).entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const sortedSeasons = [...seasons].sort((a, b) => a.year - b.year);
  const winPctPoints: BarPoint[] = sortedSeasons.map((s) => {
    const record = seasonRecord(games, s.id);
    const pct = Math.round(winPct(record) * 100);
    return {
      year: s.year,
      value: pct,
      color: pct >= 50 ? "var(--win)" : "var(--loss)",
      detail: `${formatRecord(record)} (${pct}%)`,
    };
  });
  const ratingsSeries: LineSeries[] = [
    { label: "Ovr", color: "#c98500", points: sortedSeasons.map((s) => ({ year: s.year, value: s.ovr_rating })) },
    { label: "Off", color: "var(--offense)", points: sortedSeasons.map((s) => ({ year: s.year, value: s.off_rating })) },
    { label: "Def", color: "var(--defense)", points: sortedSeasons.map((s) => ({ year: s.year, value: s.def_rating })) },
  ];
  const prestigeSeries: LineSeries[] = [
    { label: "Prestige", color: "var(--accent)", points: sortedSeasons.map((s) => ({ year: s.year, value: s.prestige })) },
  ];

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
          <div>Playoff record: {formatRecord(stats.playoffRecord)}</div>
          <div>Conference titles: {stats.conferenceChampionships}</div>
          <div>National titles: {stats.nationalChampionships}</div>
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
        <h2>Trends</h2>
        {sortedSeasons.length > 1 ? (
          <>
            <BarTrendChart title="Win % by season" points={winPctPoints} yFormat={(v) => `${v}%`} />
            <LineTrendChart title="Team ratings by season" series={ratingsSeries} />
            <LineTrendChart
              title="Prestige by season"
              series={prestigeSeries}
              area
              yDomain={[0, 5]}
              yFormat={(v) => v.toFixed(1)}
            />
          </>
        ) : (
          <p className="muted">Trends will show up once you've logged a couple seasons.</p>
        )}
      </section>

      <section className="card">
        <h2>Record by opponent</h2>
        <ul className="list">
          {vs.map(([opponent, r]) => (
            <li key={opponent} className="list-row">
              <TeamLogo school={opponent} size={28} />
              <div className="list-row-main">
                <strong>{opponent}</strong>
                <div className="muted small">
                  {formatRecord(r)}
                  {r.streak !== "-" && (
                    <span className={`streak-pill streak-${r.streak.endsWith("W") ? "W" : "L"}`}>
                      {r.streak}
                    </span>
                  )}
                  {r.lastGameYear ? ` · last played ${r.lastGameYear}` : ""}
                </div>
              </div>
            </li>
          ))}
          {vs.length === 0 && <p className="muted">No games logged yet.</p>}
        </ul>
      </section>
    </div>
  );
}
