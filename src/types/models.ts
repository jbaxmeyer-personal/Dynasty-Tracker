// Data model for the CFB 27 Dynasty Tracker.
// Each dynasty owns one JSON file per table under /data/{dynasty-id}/*.json in the repo.

export interface AdGoal {
  goal: string;
  met: boolean;
}

export interface AllAmericanHonor {
  name: string;
  team: "1st" | "2nd" | "Freshman";
}

export interface AllConferenceHonor {
  name: string;
  team: "1st" | "2nd";
}

export interface DraftPick {
  name: string;
  round: number | null;
  pick: number | null;
}

export interface Season {
  id: string;
  year: number;
  school: string;
  prestige: number; // 0-5, 0.5 increments
  ovr_rating: number; // CFB 27 shows team Ovr/Off/Def as plain integer ratings, not letter grades
  off_rating: number;
  def_rating: number;
  nil_total: number;
  nil_roster_spend: number;
  dynasty_points_earned: number;
  preseason_rank: number | null;
  final_rank: number | null;
  recruiting_class_rank: string; // text to allow combined-class notation e.g. "40 with PSU"
  toughest_place_to_play_rank: number | null;
  conf_champ_opponent: string;
  bowl_name: string;
  bowl_opponent: string;
  bowl_result: string;
  ad_goals: AdGoal[];
  all_americans: AllAmericanHonor[];
  all_conference: AllConferenceHonor[];
  draft_picks: DraftPick[];
  notes: string;
}

// Playoff rounds cover the 12-team CFP format: first round byes for the top
// four seeds, then quarterfinal, semifinal, and the national championship.
export type Week = number | "CC" | "CFP1" | "CFPQF" | "CFPSF" | "Natty" | "Bowl";

export type TvTier = "Regional" | "National" | "Gameday" | null;

export type HomeAway = "" | "@" | "N";

export interface Game {
  id: string;
  season_id: string;
  week: Week;
  my_rank: number | null;
  opp_rank: number | null;
  tv_tier: TvTier;
  home_away: HomeAway;
  opponent: string;
  my_score: number | null;
  opp_score: number | null;
  ot: boolean;
  notes: string;
}

// Only incoming players are tracked (matches the source sheet) - there is no
// "Transfer Out" row type; a player leaving isn't logged here at all.
export type RecruitType = "HS Signee" | "Transfer";

export type ClassYear = "Fr" | "So" | "Jr" | "Sr" | "Gr";

export interface Recruit {
  id: string;
  school: string;
  season: number;
  name: string;
  home_state: string;
  position: string;
  stars: number; // 1-5 integer
  overall: number;
  type: RecruitType;
  class_year: ClassYear | ""; // only meaningful when type is "Transfer"
  in_season: boolean; // joined via transfer portal mid-season rather than the normal signing period
  notes: string;
}

export interface SeasonTeamStats {
  id: string;
  year: number;
  school: string;
  off_pts_pg: number;
  off_yds_pg: number;
  off_pass_yds_pg: number;
  off_rush_yds_pg: number;
  off_int: number;
  off_fum: number;
  def_pts_pg: number;
  def_yds_pg: number;
  def_pass_yds_pg: number;
  def_rush_yds_pg: number;
  def_sacks: number;
  def_int: number;
  def_fum: number;
  turnover_diff: number;
}

export interface SchoolPrestige {
  id: string;
  school: string;
  conference: string;
  year: number;
  prestige: number; // 0-5, 0.5 increments
}

export interface ConferenceChampion {
  conference: string;
  champion: string;
}

// A national snapshot of the CFB world for one simulated year - distinct
// from `seasons`, which tracks only the user's own team. Matches the
// source sheet's "Season Review" tab.
export interface NationalLandscape {
  id: string;
  year: number;
  national_champion: string;
  national_runner_up: string;
  playoff_semifinalists: [string, string]; // the two teams eliminated in the semifinals
  conference_champions: ConferenceChampion[];
  heisman_winner: string;
  heisman_school: string;
  final_top_25: string[]; // 25 school names, index 0 = #1
  notes: string;
}

export interface DynastyMeta {
  id: string;
  name: string;
  school: string;
  created_at: string;
}

export interface DataTables {
  seasons: Season[];
  games: Game[];
  recruits: Recruit[];
  season_team_stats: SeasonTeamStats[];
  school_prestige: SchoolPrestige[];
  national_landscape: NationalLandscape[];
}

export type TableName = keyof DataTables;
