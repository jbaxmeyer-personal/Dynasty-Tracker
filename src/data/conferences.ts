// Best-effort ESPN "group" ids for conference logos, same convention as the
// per-school espnId in schools.ts (ESPN's own asset CDN, not a licensed
// API). Backs a small logo badge on schedule rows; falls back gracefully
// to a hashed abbreviation badge if an id is missing or wrong.
export interface ConferenceInfo {
  espnId: number | null;
  abbr: string;
}

export const CONFERENCES: Record<string, ConferenceInfo> = {
  ACC: { espnId: 1, abbr: "ACC" },
  "Big 12": { espnId: 4, abbr: "B12" },
  "Big Ten": { espnId: 5, abbr: "B1G" },
  SEC: { espnId: 8, abbr: "SEC" },
  "Pac-12": { espnId: 9, abbr: "P12" },
  CUSA: { espnId: 12, abbr: "CUSA" },
  MAC: { espnId: 15, abbr: "MAC" },
  "Mountain West": { espnId: 17, abbr: "MWC" },
  "Sun Belt": { espnId: 37, abbr: "SBC" },
  AAC: { espnId: 151, abbr: "AAC" },
  Independent: { espnId: null, abbr: "IND" },
};
