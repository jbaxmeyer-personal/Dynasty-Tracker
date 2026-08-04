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
