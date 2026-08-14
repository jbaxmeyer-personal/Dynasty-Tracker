import { useEffect, useState } from "react";
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
  const espnId = findSchool(school)?.espnId;
  // "pending" while the CDN image loads, "ok" once it does, "fail" on an error
  // or if it stalls past the timeout. Reset whenever the target logo changes so
  // a reused list row, or a slow/silently-hung CDN response (which iOS does
  // sometimes without ever firing an error event), falls back to the badge
  // instead of leaving a blank box.
  const [status, setStatus] = useState<"pending" | "ok" | "fail">("pending");

  useEffect(() => {
    if (espnId == null) return;
    setStatus("pending");
    const timer = setTimeout(() => {
      setStatus((s) => (s === "pending" ? "fail" : s));
    }, 6000);
    return () => clearTimeout(timer);
  }, [espnId]);

  const logo =
    espnId == null || status === "fail" ? (
      <TeamBadge school={school} size={size} />
    ) : (
      <img
        key={espnId}
        src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`}
        alt={school}
        title={school}
        width={size}
        height={size}
        style={{ objectFit: "contain", flexShrink: 0 }}
        onLoad={() => setStatus("ok")}
        onError={() => setStatus("fail")}
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
