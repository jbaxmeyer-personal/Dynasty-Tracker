import { TeamLogo } from "./TeamLogo";
import type { Game } from "../types/models";
import { gameResult } from "../lib/computedStats";

// Read-only version of the game-form scoreboard: two logos with rank badges,
// final scores, and the W/L/T result. Used in the schedule list's expanded row.
export function GameScoreboard({ game, mySchool }: { game: Game; mySchool: string }) {
  const res = gameResult(game);

  const me = (
    <div className="scoreboard-team" key="me">
      <TeamLogo school={mySchool || "TBD"} size={44} rank={game.my_rank} />
      <span className="muted small">{mySchool || "You"}</span>
      <span className="scoreboard-score">{game.my_score ?? "-"}</span>
    </div>
  );
  const opp = (
    <div className="scoreboard-team" key="opp">
      <TeamLogo school={game.opponent} size={44} rank={game.opp_rank} />
      <span className="muted small">{game.opponent}</span>
      <span className="scoreboard-score">{game.opp_score ?? "-"}</span>
    </div>
  );

  // Home team on the right, away on the left - neutral keeps me on the left.
  const meIsHome = game.home_away === "";
  return (
    <div className={`scoreboard ${res ? `scoreboard-${res}` : ""}`}>
      {meIsHome ? opp : me}
      <div className="scoreboard-mid">
        <span className="scoreboard-dash">-</span>
        {res && <span className={`result-badge result-${res}`}>{res}</span>}
        {game.ot && <span className="muted small">OT</span>}
      </div>
      {meIsHome ? me : opp}
    </div>
  );
}
