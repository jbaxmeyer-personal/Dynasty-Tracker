// Team logos are trademarked assets we don't have a license to hot-link, so
// instead of pulling real school logos we render a small deterministic
// abbreviation badge (school initials on a hashed color) - self-hosted SVG,
// zero licensing risk. See README "Team logos" for the reasoning.

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function abbreviate(school: string): string {
  const words = school
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

function colorFor(school: string): { bg: string; fg: string } {
  const hue = hashString(school) % 360;
  return { bg: `hsl(${hue}, 55%, 32%)`, fg: `hsl(${hue}, 70%, 92%)` };
}

interface TeamBadgeProps {
  school: string;
  size?: number;
}

export function TeamBadge({ school, size = 32 }: TeamBadgeProps) {
  const { bg, fg } = colorFor(school);
  const label = abbreviate(school);
  const fontSize = label.length > 3 ? size * 0.32 : size * 0.4;
  return (
    <span
      role="img"
      aria-label={school}
      title={school}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: bg,
        color: fg,
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      {label}
    </span>
  );
}
