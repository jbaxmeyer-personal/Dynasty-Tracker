import { useState } from "react";
import { findSchool } from "../data/schools";
import { TeamBadge } from "./TeamBadge";

// Real team logos via ESPN's public logo CDN, keyed by a best-effort id
// mapping in src/data/schools.ts. Not an official partnership - just ESPN's
// own asset URLs, which is how most fan/hobby tools source these since there
// is no formally licensed college-logo API for a project this size. Falls
// back to the generated abbreviation badge if the school has no mapped id,
// or if the image fails to load (wrong/stale id, offline, etc.) - so a bad
// mapping degrades gracefully instead of showing a broken image.
interface TeamLogoProps {
  school: string;
  size?: number;
}

export function TeamLogo({ school, size = 32 }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const espnId = findSchool(school)?.espnId;

  if (!espnId || failed) {
    return <TeamBadge school={school} size={size} />;
  }

  return (
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
}
