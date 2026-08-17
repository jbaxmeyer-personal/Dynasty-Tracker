// A fully-populated fake dynasty for demos/advertising - no real strategy or
// data of the owner's. A four-season "coaching climb": two years rebuilding
// Toledo in the MAC, then hired away to Kansas in the Big 12. Deterministic
// (fixed ids) so tapping "Load sample dynasty" again resets it rather than
// piling up duplicates.
import { createDynasty, upsertRows } from "./dataStore";
import type {
  Season, Game, Recruit, NationalLandscape, SeasonTeamStats, SchoolPrestige,
  PlayoffBracket, Week, HomeAway,
} from "../types/models";

export const DEMO_DYNASTY_ID = "sample-the-climb";
const HC = "Jordan Vale"; // the fake head coach

// --- small builders --------------------------------------------------------

let gseq = 0;
function g(
  seasonId: string, week: Week, ha: HomeAway, opponent: string,
  my: number, opp: number,
  extra: Partial<Game> = {}
): Game {
  gseq += 1;
  return {
    id: `${seasonId}-g${String(gseq).padStart(2, "0")}`,
    season_id: seasonId,
    week,
    my_rank: null,
    opp_rank: null,
    tv_tier: null,
    home_away: ha,
    opponent,
    my_score: my,
    opp_score: opp,
    ot: false,
    notes: "",
    ...extra,
  };
}

let rseq = 0;
function r(
  season: number, school: string, name: string, position: string, archetype: string,
  home_state: string, stars: number, overall: number,
  extra: Partial<Recruit> = {}
): Recruit {
  rseq += 1;
  return {
    id: `${DEMO_DYNASTY_ID}-r${String(rseq).padStart(2, "0")}`,
    school,
    season,
    name,
    home_state,
    position,
    archetype,
    stars,
    overall,
    type: "HS Signee",
    class_year: "",
    in_season: false,
    schools_beaten_out: [],
    gem: false,
    bust: false,
    dev_trait: "",
    notes: "",
    ...extra,
  };
}

function season(
  id: string, year: number, school: string, prestige: number,
  ovr: number, off: number, def: number,
  preseason: number | null, final: number | null,
  classRank: string, extra: Partial<Season> = {}
): Season {
  return {
    id, year, school, prestige,
    ovr_rating: ovr, off_rating: off, def_rating: def,
    nil_roster_spend: 0, nil_recruiting_spend: 0,
    dynasty_points_earned: 0, dynasty_points_spent_staff: 0, dynasty_points_spent_facilities: 0,
    offensive_coordinator: "", defensive_coordinator: "",
    support_staff: [],
    preseason_rank: preseason, final_rank: final,
    recruiting_class_rank: classRank,
    toughest_place_to_play_rank: null,
    ad_goals: [], all_americans: [], all_conference: [], draft_picks: [],
    notes: "",
    ...extra,
  };
}

function bracket(seeds: string[], winners: Partial<PlayoffBracket>): PlayoffBracket {
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12] = seeds;
  return {
    seed1: s1, seed2: s2, seed3: s3, seed4: s4, seed5: s5, seed6: s6,
    seed7: s7, seed8: s8, seed9: s9, seed10: s10, seed11: s11, seed12: s12,
    r1_5v12_winner: "", r1_6v11_winner: "", r1_7v10_winner: "", r1_8v9_winner: "",
    qf1_winner: "", qf2_winner: "", qf3_winner: "", qf4_winner: "",
    sf1_winner: "", sf2_winner: "", champion: "",
    ...winners,
  };
}

function top25(names: string[]): string[] {
  const out = names.slice(0, 25);
  while (out.length < 25) out.push("");
  return out;
}

// --- seasons ---------------------------------------------------------------

const S27 = "sample-2027", S28 = "sample-2028", S29 = "sample-2029", S30 = "sample-2030";

const seasons: Season[] = [
  season(S27, 2027, "Toledo", 1.5, 79, 81, 76, null, null, "58th (MAC)", {
    notes: "Year 1 of the rebuild. Inherited a roster picked to finish 5th in the MAC West and squeezed a bowl out of it. Foundation year.",
    ad_goals: [
      { goal: "Make a bowl game", met: true },
      { goal: "Win 7+ games", met: true },
      { goal: "Top-3 MAC recruiting class", met: false },
    ],
    all_conference: [{ name: "Marcus Odum", position: "WR", team: "2nd" }],
  }),
  season(S28, 2028, "Toledo", 2.0, 84, 86, 82, 24, 15, "41st (MAC)", {
    notes: "The breakthrough. Ran the MAC, won the conference title, and grabbed the Group of Five's playoff auto-bid. First-round exit, but it put the program - and the staff - on the map.",
    ad_goals: [
      { goal: "Win the MAC", met: true },
      { goal: "Reach the College Football Playoff", met: true },
      { goal: "Finish ranked", met: true },
    ],
    all_americans: [{ name: "Marcus Odum", position: "WR", team: "2nd" }],
    all_conference: [
      { name: "Marcus Odum", position: "WR", team: "1st" },
      { name: "Deshawn Reyes", position: "QB", team: "1st" },
      { name: "Tyrell Banks", position: "EDGE", team: "2nd" },
    ],
    draft_picks: [{ name: "Marcus Odum (WR)", round: 2, pick: 51 }],
  }),
  season(S29, 2029, "Kansas", 3.0, 86, 88, 83, null, null, "29th (Big 12)", {
    notes: "The P4 job. Left Toledo for Kansas and a Big 12 roster. Bumpy first year against the step up in competition, but a bowl win to close it built momentum.",
    ad_goals: [
      { goal: "Make a bowl in Year 1", met: true },
      { goal: "Beat a ranked opponent", met: true },
      { goal: "Top-30 recruiting class", met: true },
    ],
    all_conference: [{ name: "Cole Whitaker", position: "QB", team: "2nd" }],
  }),
  season(S30, 2030, "Kansas", 3.5, 90, 91, 88, 19, 8, "18th (Big 12)", {
    notes: "Kansas arrives. Won 11, reached the Big 12 Championship, and slid into the 12-team Playoff as an at-large. Lost a first-round nail-biter but the ceiling is now real.",
    ad_goals: [
      { goal: "Reach the Big 12 title game", met: true },
      { goal: "Make the College Football Playoff", met: true },
      { goal: "Finish top 10", met: true },
    ],
    all_americans: [{ name: "Cole Whitaker", position: "QB", team: "1st" }],
    all_conference: [
      { name: "Cole Whitaker", position: "QB", team: "1st" },
      { name: "Isaiah Fontaine", position: "CB", team: "1st" },
      { name: "Gabe Marsh", position: "OT", team: "2nd" },
    ],
    draft_picks: [
      { name: "Cole Whitaker (QB)", round: 1, pick: 14 },
      { name: "Isaiah Fontaine (CB)", round: 3, pick: 78 },
    ],
  }),
];

// --- games -----------------------------------------------------------------
// Records: 2027 Toledo 9-4, 2028 Toledo 12-2 (MAC champ, CFP), 2029 Kansas 9-4,
// 2030 Kansas 11-3 (Big 12 finalist, CFP).

const games: Game[] = [
  // 2027 Toledo (MAC) - 9-4
  g(S27, 1, "", "E. Michigan", 31, 17),
  g(S27, 2, "@", "Cincinnati", 20, 34, { opp_rank: 22 }),
  g(S27, 3, "", "Ball State", 38, 24),
  g(S27, 4, "@", "Bowling Green", 27, 21),
  g(S27, 5, "", "Kent State", 45, 10),
  g(S27, 6, "@", "W. Michigan", 24, 28),
  g(S27, 7, "", "Ohio", 33, 30, { ot: true }),
  g(S27, 8, "@", "Buffalo", 35, 21),
  g(S27, 9, "", "Miami (OH)", 17, 23),
  g(S27, 10, "@", "Akron", 41, 13),
  g(S27, 11, "", "C. Michigan", 30, 27),
  g(S27, 12, "@", "N. Illinois", 28, 20),
  g(S27, "Bowl", "N", "Georgia State", 34, 27, { notes: "Camellia Bowl - Toledo wins to finish 9-4." }),

  // 2028 Toledo (MAC) - 12-2, MAC champ, CFP first round
  g(S28, 1, "@", "Iowa State", 21, 24, { opp_rank: 18, notes: "Nearly toppled a P4 on the road." }),
  g(S28, 2, "", "UMass", 49, 7),
  g(S28, 3, "", "Buffalo", 38, 20),
  g(S28, 4, "@", "Ohio", 31, 28),
  g(S28, 5, "", "Bowling Green", 42, 17),
  g(S28, 6, "@", "Kent State", 35, 14),
  g(S28, 7, "", "W. Michigan", 30, 23),
  g(S28, 8, "@", "Miami (OH)", 27, 24, { ot: true }),
  g(S28, 9, "", "N. Illinois", 34, 21),
  g(S28, 10, "@", "Ball State", 45, 20),
  g(S28, 11, "", "Akron", 52, 10),
  g(S28, 12, "@", "C. Michigan", 33, 19, { my_rank: 25 }),
  g(S28, "CC", "N", "W. Michigan", 31, 24, { my_rank: 23, notes: "MAC Championship - Toledo wins the league." }),
  g(S28, "CFP1", "@", "Ohio State", 17, 38, { my_rank: 12, opp_rank: 5, tv_tier: "National", notes: "CFP first round at the #5 seed. Season ends 12-2." }),

  // 2029 Kansas (Big 12) - 9-4
  g(S29, 1, "", "Fresno State", 38, 20),
  g(S29, 2, "@", "Missouri", 24, 31, { opp_rank: 16 }),
  g(S29, 3, "", "UNLV", 41, 27),
  g(S29, 4, "@", "Texas Tech", 30, 33, { ot: true }),
  g(S29, 5, "", "Houston", 35, 21),
  g(S29, 6, "@", "Oklahoma State", 27, 24),
  g(S29, 7, "", "Kansas State", 28, 31, { opp_rank: 20, notes: "Sunflower Showdown heartbreaker." }),
  g(S29, 8, "@", "West Virginia", 34, 27),
  g(S29, 9, "", "Cincinnati", 38, 17),
  g(S29, 10, "@", "BYU", 21, 26, { opp_rank: 19 }),
  g(S29, 11, "", "Arizona", 33, 30, { ot: true }),
  g(S29, 12, "@", "Colorado", 37, 24),
  g(S29, "Bowl", "N", "Memphis", 31, 28, { notes: "Guaranteed Rate Bowl win - Kansas finishes 9-4." }),

  // 2030 Kansas (Big 12) - 11-3, Big 12 finalist, CFP at-large
  g(S30, 1, "", "Nevada", 45, 10, { my_rank: 19 }),
  g(S30, 2, "", "Missouri", 27, 20, { my_rank: 18, opp_rank: 14, notes: "Statement non-con win over a ranked SEC foe." }),
  g(S30, 3, "@", "Houston", 34, 17, { my_rank: 15 }),
  g(S30, 4, "", "Texas Tech", 31, 28, { my_rank: 14, opp_rank: 21, ot: true }),
  g(S30, 5, "@", "UCF", 38, 24, { my_rank: 12 }),
  g(S30, 6, "", "Oklahoma State", 30, 13, { my_rank: 11 }),
  g(S30, 7, "@", "Kansas State", 24, 27, { my_rank: 9, opp_rank: 13, notes: "Rivalry loss in Manhattan." }),
  g(S30, 8, "", "BYU", 33, 20, { my_rank: 12 }),
  g(S30, 9, "@", "Arizona State", 28, 21, { my_rank: 11 }),
  g(S30, 10, "", "West Virginia", 41, 17, { my_rank: 10 }),
  g(S30, 11, "@", "Baylor", 35, 31, { my_rank: 9 }),
  g(S30, 12, "", "Iowa State", 27, 24, { my_rank: 8, opp_rank: 17, ot: true, notes: "Clinched a Big 12 title-game berth." }),
  g(S30, "CC", "N", "Utah", 20, 27, { my_rank: 8, opp_rank: 6, tv_tier: "National", notes: "Big 12 Championship - fell just short." }),
  g(S30, "CFP1", "", "Tennessee", 31, 34, { my_rank: 9, opp_rank: 8, tv_tier: "National", notes: "Home CFP first round - lost by three. Season ends 11-3." }),
];

// --- recruits (only the team Coach Vale led that year) ----------------------

const recruits: Recruit[] = [
  // 2027 Toledo class
  r(2027, "Toledo", "Deshawn Reyes", "QB", "Dual Threat", "Ohio", 3, 78, { dev_trait: "Star", gem: true, notes: "Future MAC Player of the Year - the cornerstone." }),
  r(2027, "Toledo", "Marcus Odum", "WR", "Speedster", "Michigan", 3, 80, { dev_trait: "Elite", gem: true }),
  r(2027, "Toledo", "Tyrell Banks", "EDGE", "Speed Rusher", "Ohio", 3, 77 ),
  r(2027, "Toledo", "Owen Brantley", "OT", "Pass Protector", "Indiana", 2, 74 ),
  r(2027, "Toledo", "Kai Thompson", "CB", "Zone", "Michigan", 3, 76 ),
  r(2027, "Toledo", "Bryce Nolan", "HB", "Elusive Bruiser", "Ohio", 2, 73, { bust: true }),

  // 2028 Toledo class - rising profile
  r(2028, "Toledo", "Jalen Ford", "WR", "Route Artist", "Illinois", 4, 84, { dev_trait: "Star", schools_beaten_out: ["Cincinnati", "Iowa State"], notes: "Flipped from a P4 - the class headliner." }),
  r(2028, "Toledo", "Cam Spresent", "DT", "Gap Specialist", "Ohio", 3, 79 ),
  r(2028, "Toledo", "Andre Willis", "MIKE", "Signal Caller", "Michigan", 3, 80, { gem: true }),
  r(2028, "Toledo", "Diego Marroquin", "K", "Accurate", "Texas", 3, 77 ),
  r(2028, "Toledo", "Reid Castellano", "TE", "Vertical Threat", "Pennsylvania", 3, 78 ),
  r(2028, "Toledo", "Malik Greer", "FS", "Hybrid", "Ohio", 3, 76 ),
  r(2028, "Toledo", "Trey Dawson", "HB", "Backfield Threat", "Georgia", 4, 82, { dev_trait: "Impact", schools_beaten_out: ["Louisville"] }),

  // 2029 Kansas class - first P4 haul
  r(2029, "Kansas", "Cole Whitaker", "QB", "Pocket Passer", "Texas", 4, 85, { dev_trait: "Elite", gem: true, schools_beaten_out: ["Oklahoma State", "Houston"], notes: "The face of the Kansas era - a future first-rounder." }),
  r(2029, "Kansas", "Isaiah Fontaine", "CB", "Bump and Run", "Louisiana", 4, 84, { dev_trait: "Star", schools_beaten_out: ["LSU", "TCU"] }),
  r(2029, "Kansas", "Gabe Marsh", "OT", "Raw Strength", "Missouri", 3, 81 ),
  r(2029, "Kansas", "Devonte Sims", "WR", "Physical Route Runner", "Kansas", 3, 80, { notes: "In-state keeper." }),
  r(2029, "Kansas", "Nate Okafor", "EDGE", "Power Rusher", "Texas", 3, 82, { gem: true }),
  r(2029, "Kansas", "Brooks Halligan", "SS", "Box Specialist", "Nebraska", 3, 78 ),
  r(2029, "Kansas", "Vince Lombardo", "OG", "Well Rounded", "Illinois", 3, 79 ),
  // one portal add
  r(2029, "Kansas", "Rashad Pierre", "HB", "East/West Playmaker", "Florida", 3, 83, { type: "Transfer", class_year: "Jr", schools_beaten_out: ["Arizona"], notes: "Portal transfer from a G5 - instant starter." }),

  // 2030 Kansas class - top-20 breakthrough
  r(2030, "Kansas", "Xavier Boone", "WR", "Contested Specialist", "Texas", 4, 87, { dev_trait: "Elite", gem: true, schools_beaten_out: ["Texas", "Oklahoma"], notes: "Highest-rated signee in program history for this run." }),
  r(2030, "Kansas", "Landon Frost", "DT", "Power Rusher", "Missouri", 4, 85, { dev_trait: "Star" }),
  r(2030, "Kansas", "Elijah Crane", "QB", "Backfield Creator", "Georgia", 4, 84, { notes: "The heir apparent at QB." }),
  r(2030, "Kansas", "Marquez Bell", "CB", "Field", "Texas", 3, 82, { gem: true }),
  r(2030, "Kansas", "Sione Latu", "OT", "Agile", "Utah", 4, 84, { schools_beaten_out: ["Utah", "BYU"] }),
  r(2030, "Kansas", "Grant Mueller", "TE", "Gritty Possession", "Kansas", 3, 80 ),
  r(2030, "Kansas", "DeAndre Coleman", "MIKE", "Thumper", "Oklahoma", 3, 81 ),
  r(2030, "Kansas", "Preston Vaughn", "P", "Power", "Colorado", 3, 76, { bust: true }),
];

// --- national landscape (one snapshot per year) ----------------------------

const CHAMPS_2027 = [
  { conference: "SEC", champion: "Georgia" },
  { conference: "Big Ten", champion: "Ohio State" },
  { conference: "Big 12", champion: "Utah" },
  { conference: "ACC", champion: "Clemson" },
  { conference: "MAC", champion: "W. Michigan" },
  { conference: "Sun Belt", champion: "James Madison" },
  { conference: "AAC", champion: "Memphis" },
  { conference: "Mountain West", champion: "Boise State" },
];
const CHAMPS_2028 = [
  { conference: "SEC", champion: "Alabama" },
  { conference: "Big Ten", champion: "Ohio State" },
  { conference: "Big 12", champion: "Kansas State" },
  { conference: "ACC", champion: "Miami" },
  { conference: "MAC", champion: "Toledo" },
  { conference: "Sun Belt", champion: "App St." },
  { conference: "AAC", champion: "Tulane" },
  { conference: "Mountain West", champion: "Boise State" },
];
const CHAMPS_2029 = [
  { conference: "SEC", champion: "Texas" },
  { conference: "Big Ten", champion: "Oregon" },
  { conference: "Big 12", champion: "BYU" },
  { conference: "ACC", champion: "Clemson" },
  { conference: "MAC", champion: "Miami (OH)" },
  { conference: "Sun Belt", champion: "Louisiana" },
  { conference: "AAC", champion: "Memphis" },
  { conference: "Mountain West", champion: "UNLV" },
];
const CHAMPS_2030 = [
  { conference: "SEC", champion: "Georgia" },
  { conference: "Big Ten", champion: "Michigan" },
  { conference: "Big 12", champion: "Utah" },
  { conference: "ACC", champion: "Miami" },
  { conference: "MAC", champion: "Ohio" },
  { conference: "Sun Belt", champion: "James Madison" },
  { conference: "AAC", champion: "Tulane" },
  { conference: "Mountain West", champion: "Boise State" },
];

const landscape: NationalLandscape[] = [
  {
    id: "sample-nl-2027", year: 2027,
    playoff: bracket(
      ["Georgia", "Ohio State", "Clemson", "Utah", "Texas", "Oregon", "Alabama", "Penn State", "Notre Dame", "Tennessee", "Ole Miss", "Boise State"],
      { r1_5v12_winner: "Texas", r1_6v11_winner: "Oregon", r1_7v10_winner: "Alabama", r1_8v9_winner: "Penn State",
        qf1_winner: "Georgia", qf2_winner: "Ohio State", qf3_winner: "Clemson", qf4_winner: "Texas",
        sf1_winner: "Georgia", sf2_winner: "Ohio State", champion: "Georgia" }
    ),
    conference_champions: CHAMPS_2027,
    heisman_winner: "Marcus Feld", heisman_position: "QB", heisman_school: "Texas",
    final_top_25: top25(["Georgia", "Ohio State", "Texas", "Clemson", "Oregon", "Alabama", "Utah", "Penn State", "Notre Dame", "Tennessee", "Ole Miss", "Michigan", "Missouri", "LSU", "Oklahoma", "Kansas State", "Miami", "BYU", "Louisville", "Iowa", "SMU", "Boise State", "James Madison", "Memphis", "Toledo"]),
    notes: "Georgia takes the title. Toledo cracks the final top 25 in Coach Vale's first year.",
  },
  {
    id: "sample-nl-2028", year: 2028,
    playoff: bracket(
      ["Ohio State", "Alabama", "Miami", "Kansas State", "Oregon", "Georgia", "Texas", "Clemson", "Penn State", "Ole Miss", "Notre Dame", "Toledo"],
      { r1_5v12_winner: "Oregon", r1_6v11_winner: "Georgia", r1_7v10_winner: "Texas", r1_8v9_winner: "Penn State",
        qf1_winner: "Ohio State", qf2_winner: "Alabama", qf3_winner: "Miami", qf4_winner: "Oregon",
        sf1_winner: "Ohio State", sf2_winner: "Alabama", champion: "Ohio State" }
    ),
    conference_champions: CHAMPS_2028,
    heisman_winner: "Cayden Ross", heisman_position: "QB", heisman_school: "Ohio State",
    final_top_25: top25(["Ohio State", "Alabama", "Oregon", "Miami", "Georgia", "Texas", "Kansas State", "Clemson", "Penn State", "Ole Miss", "Notre Dame", "Tennessee", "Michigan", "LSU", "Utah", "Oklahoma", "BYU", "Missouri", "Toledo", "Iowa State", "SMU", "Tulane", "Boise State", "App St.", "Memphis"]),
    notes: "Toledo is the Group of Five's playoff rep at #19 - the high point of the MAC era.",
  },
  {
    id: "sample-nl-2029", year: 2029,
    playoff: bracket(
      ["Texas", "Oregon", "Georgia", "BYU", "Ohio State", "Clemson", "Alabama", "Penn State", "Notre Dame", "Michigan", "Tennessee", "Memphis"],
      { r1_5v12_winner: "Ohio State", r1_6v11_winner: "Tennessee", r1_7v10_winner: "Alabama", r1_8v9_winner: "Notre Dame",
        qf1_winner: "Texas", qf2_winner: "Oregon", qf3_winner: "Alabama", qf4_winner: "Ohio State",
        sf1_winner: "Texas", sf2_winner: "Ohio State", champion: "Texas" }
    ),
    conference_champions: CHAMPS_2029,
    heisman_winner: "Julian Marsh", heisman_position: "RB", heisman_school: "Oregon",
    final_top_25: top25(["Texas", "Ohio State", "Oregon", "Georgia", "Alabama", "BYU", "Clemson", "Penn State", "Notre Dame", "Tennessee", "Michigan", "Ole Miss", "LSU", "Missouri", "Oklahoma", "Kansas State", "Utah", "Miami", "Louisville", "Iowa State", "Memphis", "Louisiana", "UNLV", "Tulane", "SMU"]),
    notes: "Kansas misses the postseason poll in Vale's first Big 12 year - the step up is real.",
  },
  {
    id: "sample-nl-2030", year: 2030,
    playoff: bracket(
      ["Georgia", "Michigan", "Utah", "Miami", "Ohio State", "Texas", "Oregon", "Alabama", "Kansas", "Clemson", "Tennessee", "Boise State"],
      { r1_5v12_winner: "Ohio State", r1_6v11_winner: "Tennessee", r1_7v10_winner: "Oregon", r1_8v9_winner: "Kansas",
        qf1_winner: "Georgia", qf2_winner: "Michigan", qf3_winner: "Utah", qf4_winner: "Ohio State",
        sf1_winner: "Georgia", sf2_winner: "Ohio State", champion: "Ohio State" }
    ),
    conference_champions: CHAMPS_2030,
    heisman_winner: "Cole Whitaker", heisman_position: "QB", heisman_school: "Kansas",
    final_top_25: top25(["Ohio State", "Georgia", "Michigan", "Utah", "Miami", "Texas", "Oregon", "Kansas", "Alabama", "Tennessee", "Clemson", "Penn State", "Notre Dame", "BYU", "Ole Miss", "LSU", "Iowa State", "Missouri", "Oklahoma", "Kansas State", "Louisville", "Boise State", "Tulane", "James Madison", "Memphis"]),
    notes: "Kansas finishes #8 and Cole Whitaker wins the Heisman. The climb pays off.",
  },
];

// --- team stats + prestige -------------------------------------------------

function stats(id: string, year: number, school: string, o: number[], d: number[], toDiff: number): SeasonTeamStats {
  return {
    id, year, school,
    off_pts_pg: o[0], off_yds_pg: o[1], off_pass_yds_pg: o[2], off_rush_yds_pg: o[3], off_int: o[4], off_fum: o[5],
    def_pts_pg: d[0], def_yds_pg: d[1], def_pass_yds_pg: d[2], def_rush_yds_pg: d[3], def_sacks: d[4], def_int: d[5], def_fum: d[6],
    turnover_diff: toDiff,
  };
}

const teamStats: SeasonTeamStats[] = [
  stats("sample-ts-2027", 2027, "Toledo", [31.2, 412, 251, 161, 9, 6], [22.8, 358, 221, 137, 28, 12, 7], 4),
  stats("sample-ts-2028", 2028, "Toledo", [35.6, 448, 274, 174, 7, 5], [19.4, 320, 198, 122, 34, 15, 9], 12),
  stats("sample-ts-2029", 2029, "Kansas", [32.1, 421, 268, 153, 11, 7], [24.6, 372, 236, 136, 26, 11, 6], 1),
  stats("sample-ts-2030", 2030, "Kansas", [33.8, 439, 281, 158, 8, 4], [20.1, 331, 205, 126, 33, 16, 8], 14),
];

const prestige: SchoolPrestige[] = [
  { id: "sample-sp-2027", school: "Toledo", conference: "MAC", year: 2027, prestige: 1.5 },
  { id: "sample-sp-2028", school: "Toledo", conference: "MAC", year: 2028, prestige: 2.5 },
  { id: "sample-sp-2029", school: "Kansas", conference: "Big 12", year: 2029, prestige: 3.0 },
  { id: "sample-sp-2030", school: "Kansas", conference: "Big 12", year: 2030, prestige: 3.5 },
];

/**
 * Creates (or resets) the sample demo dynasty under the given account and
 * returns its id. Uses fixed document ids, so re-running overwrites in place.
 */
export async function seedDemoDynasty(uid: string): Promise<string> {
  await createDynasty(uid, {
    id: DEMO_DYNASTY_ID,
    name: `The Climb - Coach ${HC} (Sample)`,
    school: "Kansas",
  });
  await upsertRows(uid, DEMO_DYNASTY_ID, "seasons", seasons);
  await upsertRows(uid, DEMO_DYNASTY_ID, "games", games);
  await upsertRows(uid, DEMO_DYNASTY_ID, "recruits", recruits);
  await upsertRows(uid, DEMO_DYNASTY_ID, "national_landscape", landscape);
  await upsertRows(uid, DEMO_DYNASTY_ID, "season_team_stats", teamStats);
  await upsertRows(uid, DEMO_DYNASTY_ID, "school_prestige", prestige);
  return DEMO_DYNASTY_ID;
}
