import { useState } from "react";
import type { CSSProperties } from "react";
import { CONFERENCES } from "../data/conferences";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface ConferenceBadgeProps {
  conference: string;
  size?: number;
  className?: string;
}

export function ConferenceBadge({ conference, size = 14, className = "" }: ConferenceBadgeProps) {
  const [failed, setFailed] = useState(false);
  const info = CONFERENCES[conference];
  const style: CSSProperties = { width: size, height: size };

  if (!info?.espnId || failed) {
    const hue = hashString(conference) % 360;
    return (
      <span
        className={`conf-badge ${className}`}
        style={{ ...style, background: `hsl(${hue}, 55%, 32%)` }}
        title={conference}
      >
        <span className="conf-badge-text" style={{ fontSize: size * 0.34 }}>
          {(info?.abbr ?? conference).slice(0, 2)}
        </span>
      </span>
    );
  }

  return (
    <span className={`conf-badge ${className}`} style={style} title={conference}>
      <img
        src={`https://a.espncdn.com/i/teamlogos/ncaa_conf/500/${info.espnId}.png`}
        alt={conference}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
