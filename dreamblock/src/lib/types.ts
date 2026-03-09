// ── Primitive enums ────────────────────────────────────────────────────────────

export type DreamCategory =
  | "Music" | "Podcast" | "Art" | "Business" | "Athletic"
  | "Writing" | "Lifestyle" | "Other";

export type YearsDelayed =
  | "< 1 year" | "1–3 years" | "3–7 years" | "7–15 years" | "15+ years";

export type Emotion =
  | "fear" | "shame" | "overwhelm" | "boredom" | "excite_crash" | "numbness";

export type FirstThought =
  | "not_enough" | "judgment" | "no_start" | "too_late" | "wont_matter";

export type StuckPoint =
  | "starting" | "consistency" | "finishing" | "publishing" | "promoting" | "committing";

export type ProtectedThing =
  | "comfort" | "identity" | "relationships" | "control" | "certainty";

export type TrueWant =
  | "status" | "identity" | "process" | "meaning" | "output";

export type SacrificeType =
  | "sleep" | "social" | "income" | "career" | "creative" | "family";

export type TimeRealistic = "yes" | "some" | "little" | "none";
export type PhysicalConstraint = "none" | "minor" | "significant" | "impossible";
export type DreamStatus = "active" | "paused" | "completed" | "archived" | "released";
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type DailyMode =
  | "do" | "plan" | "ask" | "learn" | "reduce_friction" | "rest";

export type HardReason =
  | "fear" | "perfectionism" | "unclear" | "energy" | "time" | "distraction" | "other";

export type BadgeType =
  | "first_step" | "three_day_streak" | "seven_day_streak" | "fourteen_day_streak"
  | "thirty_day_streak" | "first_checkin" | "honest_moment" | "comeback"
  | "one_month" | "six_months" | "one_year" | "weekly_token" | "dream_released"
  | "personal_best" | "fail_fast" | "clarity_seeker" | "returner";

export type ResistanceArchetype =
  | "Fear of Visibility" | "Perfectionist Freeze" | "Overwhelm Fog"
  | "Identity Conflict" | "Fear of Success" | "Shame Loop"
  | "Consistency Collapse" | "Misalignment";

export type StuckPhase =
  | "Spark" | "Preparation" | "First-Step Resistance" | "Momentum"
  | "Pre-Publish Panic" | "Dormancy" | "Return";

export type DreamClassification =
  | "Viable & Aligned" | "Viable but Misaligned"
  | "Symbolic / Transformable" | "Unrealistic in Current Form";

export type EventType =
  | "assessment_completed" | "checkin_completed" | "weekly_summary_viewed"
  | "milestone_awarded" | "dream_team_invited" | "dream_team_joined"
  | "dream_team_ping_sent" | "dream_released" | "grace_day_applied"
  | "personal_best_set" | "xp_earned";

export type SharingLevel =
  | "private" | "streak_only" | "tiny_action" | "weekly_summary";

export type MomentumLayer = "all" | "actions" | "resistance" | "weekly";

export type XPReason =
  | "checkin" | "tiny_action" | "restart" | "reflection" | "team_support"
  | "grace_day_converted" | "streak_milestone" | "weekly_token" | "assessment";

// ── Intake / assessment answer shapes ─────────────────────────────────────────

export interface DreamIntake {
  title: string;
  category: DreamCategory | "Other" | "";
  category_other?: string;
  years_delayed: YearsDelayed | "";
  importance: number;
  pain: number;
  fear: number;
}

export interface ResistanceAnswers {
  emotion: Emotion | "other" | "not_sure" | "";
  emotion_other?: string;
  first_thought: FirstThought | "other" | "not_sure" | "";
  first_thought_other?: string;
  stuck_point: StuckPoint | "other" | "not_sure" | "";
  stuck_point_other?: string;
  protecting: ProtectedThing | "other" | "not_sure" | "";
  protecting_other?: string;
  guaranteed_hesitate: "yes" | "no" | "";
}

export interface RealityAnswers {
  physical_constraint: PhysicalConstraint | "";
  time_realistic: TimeRealistic | "";
  sacrifice: SacrificeType[];
  responsibility_conflict: boolean | null;
  realistic_years: string;
  willing_to_commit: boolean | null;
  true_want: TrueWant | "other" | "";
  true_want_other?: string;
  without_reward: boolean | null;
}

export interface DiscoveryAnswers {
  feels_like: string;
  drawn_to: string;
  fear_underneath: string;
  if_easy: string;
  resolved_title?: string;
}

// ── Insight Summary (SEEN / HELD / MOVED) ─────────────────────────────────────

export interface InsightSummary {
  seen: string;
  held: string;
  moved: string;
  moved_doorway: string;
  moved_mode: DailyMode;
  philosophy_line: string;
}

// ── Daily Check-In ─────────────────────────────────────────────────────────────

export interface DailyCheckIn {
  id: string;
  dream_id: string;
  date: string;
  did_something: boolean;
  tiny_action: string;
  hard_reason: HardReason | "";
  easy_version: string;
  daily_mode: DailyMode | "";
  step_statement: string;
  mood: MoodLevel;
  resistance_note: string;
  tiny_win: string;
  shared_with_team: boolean;
  created_at: string;
}

// ── Weekly Summary ─────────────────────────────────────────────────────────────

export interface WeeklySummary {
  id: string;
  dream_id: string;
  week_number: number;
  week_start: string;
  week_end: string;
  checkin_count: number;
  did_days: number;
  tiny_wins: string[];
  friction_reducers: string[];
  patterns: string;
  focus_next_week: string;
  token_awarded: boolean;
  philosophy_line: string;
  created_at: string;
  viewed_at?: string;
}

// ── Badge ──────────────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  dream_id: string;
  type: BadgeType;
  earned_at: string;
  label: string;
  description: string;
  emoji: string;
}

// ── XP System ─────────────────────────────────────────────────────────────────

export interface XPEvent {
  id: string;
  dream_id: string;
  reason: XPReason;
  amount: number;
  label: string;
  created_at: string;
}

export interface DreamXP {
  dream_id: string;
  total: number;
  history: XPEvent[];
}

// ── Personal Best ─────────────────────────────────────────────────────────────

export interface PersonalBest {
  dream_id: string;
  best_streak: number;
  achieved_at: string;
}

// ── Grace Day System ──────────────────────────────────────────────────────────

export interface GraceDay {
  id: string;
  dream_id: string;
  used_for_date: string;
  created_at: string;
}

// ── Momentum Graph ─────────────────────────────────────────────────────────────

export interface MomentumPoint {
  date: string;
  score: number;
  checkin_done: boolean;
  tiny_action_done: boolean;
  is_restart: boolean;
  grace_day_used: boolean;
  note: string;
  hard_reason: string;
  daily_mode: string;
}

// ── Event Log ─────────────────────────────────────────────────────────────────

export interface EventLog {
  id: string;
  event_type: EventType;
  dream_id?: string;
  team_id?: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

// ── Dream Team ─────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  name: string;
  emoji: string;
  dream_title: string;
  is_me: boolean;
  sharing_level: SharingLevel;
  joined_at: string;
}

export interface TeamSignal {
  id: string;
  team_id: string;
  member_id: string;
  date: string;
  did_something: boolean;
  action_shared?: string;
  streak?: number;
  is_restart: boolean;
  created_at: string;
}

export interface DreamTeam {
  id: string;
  code: string;
  name: string;
  my_dream_id: string;
  my_member_id: string;
  sharing_level: SharingLevel;
  privacy_locked: boolean;
  members: TeamMember[];
  signals: TeamSignal[];
  created_at: string;
}

// ── Dream ─────────────────────────────────────────────────────────────────────

export interface Dream {
  id: string;
  title: string;
  category: string;
  category_other?: string;
  years_delayed: string;
  importance: number;
  pain: number;
  fear: number;
  emotion: string;
  emotion_other?: string;
  first_thought: string;
  first_thought_other?: string;
  stuck_point: string;
  stuck_point_other?: string;
  protecting: string;
  protecting_other?: string;
  guaranteed_hesitate: string;
  physical_constraint: string;
  time_realistic: string;
  sacrifice: string[];
  responsibility_conflict: boolean;
  realistic_years: string;
  willing_to_commit: boolean;
  true_want: string;
  true_want_other?: string;
  without_reward: boolean;
  archetype: string;
  stuck_phase: string;
  classification: string;
  micro_steps: string[];
  insight_summary?: InsightSummary;
  status: DreamStatus;
  discovery_answers?: DiscoveryAnswers;
  user_intention?: string;
  released_at?: string;
  release_reflection?: { taught_me: string; no_longer_carry: string; energy_goes_to: string; };
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  dream_id?: string;
  avoided: string;
  resistance_showed: string;
  emotion: string;
  stuck_point: string;
  tiny_step: string;
  created_at: string;
}

// ── Released Dreams Vault ──────────────────────────────────────────────────────

export type RevisitAnswer =
  | "lighter"
  | "miss_it"
  | "still_unsure"
  | "five_minutes"
  | "release_fully";

export interface VaultEntry {
  id: string;
  dream_id: string;
  dream_title: string;
  released_at: string;
  truth_reason: string;
  holding_reason: string;
  reflection: {
    taught_me: string;
    no_longer_carry: string;
    energy_goes_to: string;
  };
  summary: string;
  meanings: string[];
  next_review_date: string;
  revisit_answer?: RevisitAnswer;
  revisited_at?: string;
  archived_permanently?: boolean;
}
