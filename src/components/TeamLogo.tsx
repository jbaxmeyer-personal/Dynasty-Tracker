import { useState } from "react";
import { findSchool } from "../data/schools";
import { TeamBadge } from "./TeamBadge";

// Real team logos via ESPN's public logo CDN, keyed by a best-effort id
// mapping in src/data/schools.ts. Not an official partnership - just ESPN's
// own asset URLs, which is how most fan/hobby tools source these since there
// is no formally licensed college-logo API for a project this size. Falls
// back to the generated abbreviation badge if the school has no mapped id,
// or if the image fails to load.
interface TeamLogoProps {
  school: string;
  size?: number;
  // Poll ranking to show as a small badge on the logo's corner. Null/0/absent
  // renders the logo alone with no wrapper (so existing layouts are untouched).
  rank?: number | null;
}

export function TeamLogo({ school, size = 32, rank }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const espnId = findSchool(school)?.espnId;

  const logo =
    !espnId || failed ? (
      <TeamBadge school={school} size={size} />
    ) : (
      <img
        src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`}
        alt={school}
        title={school}
        width={size}
        height={size}
        style={{ objectFit: "contain", flexShrink: 0 }}
        onError={() => setFailed(true)}
      />
    );

  if (rank == null || rank <= 0) return logo;

  return (
    <span className="logo-rank-wrap">
      {logo}
      <span className="rank-badge" title={`#${rank}`}>
        {rank}
      </span>
    </span>
  );
}
