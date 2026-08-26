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
  // The app is dark-themed, so we load ESPN's dark-background logo variant
  // (500-dark/), which is recolored with a light outline so dark logos - like
  // Nevada's navy or Penn State's - stay visible. Not every team has a dark
  // asset, so fall back to the standard logo (500/) before the letter badge.
  const [darkFailed, setDarkFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  const espnId = findSchool(school)?.espnId;

  const variant = darkFailed ? "500" : "500-dark";
  const logo =
    !espnId || failed ? (
      <TeamBadge school={school} size={size} />
    ) : (
      <img
        src={`https://a.espncdn.com/i/teamlogos/ncaa/${variant}/${espnId}.png`}
        alt={school}
        title={school}
        width={size}
        height={size}
        style={{ objectFit: "contain", flexShrink: 0 }}
        onError={() => (darkFailed ? setFailed(true) : setDarkFailed(true))}
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
