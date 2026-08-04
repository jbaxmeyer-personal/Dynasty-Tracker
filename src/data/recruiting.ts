// CFB 27 recruit positions, in depth-chart order (offense, defense, specialists).
export const POSITIONS = [
  "QB", "HB", "FB", "WR", "TE", "OT", "OG", "C",
  "EDGE", "DT", "OLB", "MIKE", "CB", "FS", "SS",
  "K", "P",
] as const;

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming",
];

// Where a recruit is from: the 50 states, plus Canada and a catch-all International.
export const HOME_LOCATIONS = [...US_STATES, "Canada", "International"];

// CFB 26 player archetypes by position (44 total). Interior/edge positions
// share a group's list. Best-effort names matching the game's per-position
// counts - edit here if any differ from what the game shows.
const OL_ARCHETYPES = ["Agile", "Pass Protector", "Power", "Well Rounded"];
const DL_ARCHETYPES = ["Speed Rusher", "Power Rusher", "Run Stuffer", "Physical Freak"];
const LB_ARCHETYPES = ["Lurker", "Signal Caller", "Thumper"];
const S_ARCHETYPES = ["Box Specialist", "Coverage Specialist", "Hybrid"];
const KICKING_ARCHETYPES = ["Accurate", "Power"];

export const ARCHETYPES_BY_POSITION: Record<string, string[]> = {
  QB: ["Pocket Passer", "Dual Threat", "Backfield Creator", "Pure Runner"],
  HB: [
    "Backfield Threat", "Contact Seeker", "East/West Playmaker",
    "Elusive Bruiser", "North/South Blocker", "North/South Receiver",
  ],
  FB: ["Blocking", "Utility"],
  WR: [
    "Contested Specialist", "Deep Threat", "Elusive Route Runner", "Gadget",
    "Gritty Possession", "Physical Route Runner", "Route Artist",
  ],
  TE: ["Gritty Possession", "Physical Route Runner", "Possession", "Pure Blocker", "Vertical Threat"],
  OT: OL_ARCHETYPES,
  OG: OL_ARCHETYPES,
  C: OL_ARCHETYPES,
  EDGE: DL_ARCHETYPES,
  DT: DL_ARCHETYPES,
  OLB: LB_ARCHETYPES,
  MIKE: LB_ARCHETYPES,
  CB: ["Boundary", "Bump and Run", "Field", "Zone"],
  FS: S_ARCHETYPES,
  SS: S_ARCHETYPES,
  K: KICKING_ARCHETYPES,
  P: KICKING_ARCHETYPES,
};

export function archetypesFor(position: string): string[] {
  return ARCHETYPES_BY_POSITION[position] ?? [];
}
