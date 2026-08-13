import { useTable } from "../hooks/useTable";
import {
  bowlRecord,
  coachStats,
  conferenceHomeAwayRecord,
  formatRecord,
  homeAwayRecord,
  myHeismans,
  playoffAppearances,
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
  const { rows: landscape } = useTable("national_landscape");

  if (gamesLoading || seasonsLoading) return <div className="page">Loading...</div>;

  const stats = coachStats(games, seasons);
  const splits = homeAwayRecord(games);
  const confSplits = conferenceHomeAwayRecord(games, seasons);
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
  const dynastyPointsSeries: LineSeries[] = [
    { label: "Earned", color: "var(--win)", points: sortedSeasons.map((s) => ({ year: s.year, value: s.dynasty_points_earned })) },
    { label: "Spent on staff", color: "var(--gold)", points: sortedSeasons.map((s) => ({ year: s.year, value: s.dynasty_points_spent_staff })) },
  ];
  // Final ranking, drawn "higher = better" by plotting (26 - rank) and
  // formatting the labels back to #rank. Only seasons that finished ranked.
  const rankedSeasons = sortedSeasons.filter((s) => s.final_rank != null);
  const finalRankSeries: LineSeries[] = [
    {
      label: "Final rank",
      color: "var(--gold)",
      points: rankedSeasons.map((s) => ({ year: s.year, value: 26 - (s.final_rank as number) })),
    },
  ];

  // Trophy case.
  const playoffApps = playoffAppearances(games);
  const heismans = myHeismans(seasons, landscape);
  const draftPicks = sortedSeasons.flatMap((s) => s.draft_picks.map((d) => ({ ...d, year: s.year })));
  const firstRounders = draftPicks
    .filter((d) => d.round === 1)
    .sort((a, b) => a.year - b.year || (a.pick ?? 0) - (b.pick ?? 0));
  const firstTeamAA = sortedSeasons.flatMap((s) =>
    s.all_americans.filter((a) => a.team === "1st").map((a) => ({ ...a, year: s.year }))
  );

  const trophies = [
    { icon: "🏆", n: stats.nationalChampionships, label: "National titles" },
    { icon: "🥇", n: stats.conferenceChampionships, label: "Conf. titles" },
    { icon: "🎟️", n: playoffApps, label: "Playoff trips" },
    { icon: "⭐", n: firstTeamAA.length, label: "1st-team AA" },
    { icon: "🏈", n: heismans.length, label: "Heismans" },
    { icon: "🎯", n: draftPicks.length, label: "Draft picks" },
  ];

  return (
    <div className="page">
      <h1>Career stats</h1>

      <section className="card">
        <h2>Trophy case</h2>
        <div className="trophy-grid">
          {trophies.map((t) => (
            <div key={t.label} className={`trophy-tile${t.n > 0 ? "" : " empty"}`}>
              <div className="trophy-icon">{t.icon}</div>
              <div className="trophy-n">{t.n}</div>
              <div className="trophy-label">{t.label}</div>
            </div>
          ))}
        </div>
        {heismans.length > 0 && (
          <>
            <h3>Heisman winners</h3>
            <ul className="honor-list">
              {heismans.map((h, i) => (
                <li key={i}>
                  <TeamLogo school={h.school} size={22} />
                  <span><strong>{h.name}</strong> · {h.year}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {firstRounders.length > 0 && (
          <>
            <h3>First-round draft picks</h3>
            <ul className="honor-list">
              {firstRounders.map((d, i) => (
                <li key={i}>
                  <span><strong>{d.name}</strong> · {d.year}{d.pick ? ` · pick ${d.pick}` : ""}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h2>Coach record</h2>
        <div className="grid-2col small">
          <div>Seasons coached: {stats.seasons}</div>
          <div>Overall record: {formatRecord(stats.record)} ({(stats.winPct * 100).toFixed(1)}%)</div>
          <div>Conference record: {formatRecord(stats.conferenceRecord)}</div>
          <div>Vs. ranked: {formatRecord(stats.rankedRecord)}</div>
          <div>Bowl record: {formatRecord(stats.bowlRecord)}</div>
          <div>Playoff record: {formatRecord(stats.playoffRecord)}</div>
          <div>Conference titles: {stats.conferenceChampionships}</div>
          <div>National titles: {stats.nationalChampionships}</div>
        </div>
      </section>

      <section className="card">
        <h2>Splits</h2>
        <h3>Overall splits</h3>
        <div className="grid-2col small">
          <div>Home: {formatRecord(splits.home)}</div>
          <div>Away: {formatRecord(splits.away)}</div>
          <div>Neutral: {formatRecord(splits.neutral)}</div>
          <div>Bowl: {formatRecord(bowlRecord(games))}</div>
        </div>
        <h3>Conference splits</h3>
        <div className="grid-2col small">
          <div>Home: {formatRecord(confSplits.home)}</div>
          <div>Away: {formatRecord(confSplits.away)}</div>
          <div>Neutral: {formatRecord(confSplits.neutral)}</div>
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
            {rankedSeasons.length > 1 && (
              <LineTrendChart
                title="Final ranking by season (the climb)"
                series={finalRankSeries}
                yFormat={(v) => `#${26 - v}`}
              />
            )}
            <LineTrendChart title="Team ratings by season" series={ratingsSeries} />
            <LineTrendChart
              title="Prestige by season"
              series={prestigeSeries}
              area
              yDomain={[0, 5]}
              yFormat={(v) => v.toFixed(1)}
            />
            <LineTrendChart title="Dynasty points: earned vs. spent on staff" series={dynastyPointsSeries} />
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
