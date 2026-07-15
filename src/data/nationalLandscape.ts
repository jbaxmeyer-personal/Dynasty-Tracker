import { CONFERENCES } from "./conferences";

// Fixed slots for the National Landscape form - every real conference with a
// champion. Independent isn't a conference and has no champion, so it's excluded.
export const ALL_CONFERENCES = Object.keys(CONFERENCES).filter((c) => c !== "Independent");
