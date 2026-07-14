// Data model for the CFB 27 Dynasty Tracker.
// Each dynasty owns one JSON file per table under /data/{dynasty-id}/*.json in the repo.

export type LetterGrade =
  | "A+" | "A" | "A-"
  | "B+" | "B" | "B-"
  | "C+" | "C" | "C-"
  | "D+" | "D" | "D-"
  | "F";

export interface AdGoal {
  goal: string;
  met: boolean;
}

export interface Season {
  id: string;
  year: number;
  school: string;
  prestige: number; // 0-5, 0.5 increments
  ovr_grade: LetterGrade;
  off_grade: LetterGrade;
  def_grade: LetterGrade;
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
  notes: string;
}

export type Week = number | "CC" | "Bowl";

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

export type RecruitType = "HS Signee" | "Transfer In" | "Transfer Out";

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
  transfer_from: string;
  transfer_to: string;
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
}

export type TableName = keyof DataTables;
