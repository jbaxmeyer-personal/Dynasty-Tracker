import { Link, useNavigate, useParams } from "react-router-dom";
import { useTable } from "../hooks/useTable";
import { TeamLogo } from "../components/TeamLogo";
import { ConferenceBadge } from "../components/ConferenceBadge";
import { teamGradient } from "../lib/teamColors";
import type { PlayoffBracket } from "../types/models";

// The team that lost a given game - the other of the two feeding teams,
// once a winner is picked. Blank if the game hasn't been decided yet.
function loserOf(winner: string, teamA: string, teamB: string): string {
  if (!winner) return "";
  return winner === teamA ? teamB : teamA;
}

function MatchTeam({ team, isWinner }: { team: string; isWinner: boolean }) {
  return (
    <div className={`bracket-team${isWinner ? " bracket-team-winner" : ""}`}>
      {team ? <TeamLogo school={team} size={20} /> : <span className="bracket-team-slot" />}
      <span>{team || "TBD"}</span>
    </div>
  );
}

function Match({ teamA, teamB, winner }: { teamA: string; teamB: string; winner: string }) {
  if (!teamA && !teamB) return <div className="bracket-match bracket-match-empty" />;
  return (
    <div className="bracket-match">
      <MatchTeam team={teamA} isWinner={!!winner && winner === teamA} />
      <MatchTeam team={teamB} isWinner={!!winner && winner === teamB} />
    </div>
  );
}

function BracketRound({ title, matches }: { title: string; matches: Array<{ teamA: string; teamB: string; winner: string }> }) {
  return (
    <div className="bracket-round">
      <div className="bracket-round-title">{title}</div>
      <div className="bracket-round-matches">
        {matches.map((m, i) => (
          <Match key={i} teamA={m.teamA} teamB={m.teamB} winner={m.winner} />
        ))}
      </div>
    </div>
  );
}

function PlayoffBracketView({ p }: { p: PlayoffBracket }) {
  const hasFirstRound = [p.seed5, p.seed6, p.seed7, p.seed8, p.seed9, p.seed10, p.seed11, p.seed12].some(Boolean);
  const hasAnything = hasFirstRound || [p.seed1, p.seed2, p.seed3, p.seed4].some(Boolean);

  if (!hasAnything) return <p className="muted">No bracket logged yet.</p>;

  const semis = [
    { teamA: p.qf1_winner, teamB: p.qf4_winner, winner: p.sf1_winner },
    { teamA: p.qf2_winner, teamB: p.qf3_winner, winner: p.sf2_winner },
  ];
  const championship = [{ teamA: p.sf1_winner, teamB: p.sf2_winner, winner: p.champion }];

  return (
    <div className="bracket-scroll">
      <div className="bracket">
        {hasFirstRound && (
          <BracketRound
            title="First Round"
            matches={[
              { teamA: p.seed5, teamB: p.seed12, winner: p.r1_5v12_winner },
              { teamA: p.seed6, teamB: p.seed11, winner: p.r1_6v11_winner },
              { teamA: p.seed7, teamB: p.seed10, winner: p.r1_7v10_winner },
              { teamA: p.seed8, teamB: p.seed9, winner: p.r1_8v9_winner },
            ]}
          />
        )}
        {hasFirstRound && (
          <BracketRound
            title="Quarterfinal"
            matches={[
              { teamA: p.seed1, teamB: p.r1_8v9_winner, winner: p.qf1_winner },
              { teamA: p.seed2, teamB: p.r1_7v10_winner, winner: p.qf2_winner },
              { teamA: p.seed3, teamB: p.r1_6v11_winner, winner: p.qf3_winner },
              { teamA: p.seed4, teamB: p.r1_5v12_winner, winner: p.qf4_winner },
            ]}
          />
        )}
        <BracketRound title="Semifinal" matches={semis} />
        <BracketRound title="Championship" matches={championship} />
      </div>
    </div>
  );
}

export function NationalLandscapePage() {
  const { year } = useParams();
  const navigate = useNavigate();
  const { rows, loading } = useTable("national_landscape");

  if (loading) return <div className="page">Loading...</div>;

  const sorted = [...rows].sort((a, b) => b.year - a.year);
  const landscape = year ? sorted.find((r) => String(r.year) === year) : sorted[0];

  if (!landscape) {
    return (
      <div className="page">
        <h1>National landscape</h1>
        <p className="muted">
          No national landscape logged yet. Track the national champion, conference champions,
          and final rankings for each year.
        </p>
        <Link className="button" to="/landscape/new">
          + Add a year
        </Link>
      </div>
    );
  }

  const p: PlayoffBracket = landscape.playoff;
  const champion = p.champion;
  const runnerUp = loserOf(p.champion, p.sf1_winner, p.sf2_winner);

  return (
    <div className="page">
      <div className="hero-card" style={{ background: teamGradient(champion) }}>
        {sorted.length > 1 && (
          <select
            className="hero-select"
            value={landscape.year}
            onChange={(e) => navigate(`/landscape/${e.target.value}`)}
            aria-label="Switch year"
          >
            {sorted.map((r) => (
              <option key={r.id} value={r.year}>{r.year}</option>
            ))}
          </select>
        )}
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="list-row">
            <TeamLogo school={champion} size={64} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.4rem" }}>
                {landscape.year} National Champion
              </h1>
              <div className="muted small">{champion || "TBD"}</div>
            </div>
          </div>
          <div className="button-row">
            <Link className="button" to={`/landscape/${landscape.id}/edit`}>
              Edit
            </Link>
            <Link className="button" to="/landscape/new">
              + Add year
            </Link>
          </div>
        </div>
        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="stat-label">Runner-up</div>
            <div className="stat-value" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {runnerUp && <TeamLogo school={runnerUp} size={22} />}
              <span>{runnerUp || "-"}</span>
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Heisman</div>
            <div
              className="stat-value"
              style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              {landscape.heisman_school && <TeamLogo school={landscape.heisman_school} size={22} />}
              <span>
                {landscape.heisman_winner || "-"}
                {landscape.heisman_school ? ` (${landscape.heisman_school})` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Playoff bracket</h2>
        <PlayoffBracketView p={p} />
      </div>

      <div className="card">
        <h2>Conference champions</h2>
        <ul className="list">
          {landscape.conference_champions.map((cc) => (
            <li key={cc.conference} className="list-row">
              <ConferenceBadge conference={cc.conference} size={28} />
              <div className="list-row-main">
                <strong>{cc.conference}</strong>
                <div className="muted small">{cc.champion || "-"}</div>
              </div>
              {cc.champion && <TeamLogo school={cc.champion} size={28} />}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Final Top 25</h2>
        <ul className="list">
          {landscape.final_top_25.map((team, i) => (
            team && (
              <li key={i} className="list-row">
                <strong style={{ width: "1.75rem" }}>{i + 1}</strong>
                <TeamLogo school={team} size={28} />
                <div className="list-row-main">{team}</div>
              </li>
            )
          ))}
          {landscape.final_top_25.every((t) => !t) && (
            <p className="muted">No final rankings logged.</p>
          )}
        </ul>
      </div>

      {landscape.notes && (
        <div className="card">
          <h2>Notes</h2>
          <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{landscape.notes}</p>
        </div>
      )}
    </div>
  );
}
