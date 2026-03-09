import type {
  Dream, DailyCheckIn, WeeklySummary, Badge, BadgeType, EventType,
  TeamMember, TeamSignal, DreamTeam, CheckIn,
  PersonalBest, GraceDay, XPEvent, XPReason, DreamXP, MomentumPoint,
  VaultEntry, RevisitAnswer,
} from "./types";

const KEYS = {
  dreams: "dc_dreams",
  checkins: "dc_checkins",
  weekly: "dc_weekly",
  badges: "dc_badges",
  teams: "dc_teams",
  team_signals: "dc_team_signals",
  events: "dc_events",
  legacy_checkins: "dc_legacy_checkins",
  pb: "dc_pb",
  grace: "dc_grace",
  xp: "dc_xp",
  vault: "dc_vault",
};

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[]; }
  catch { return []; }
}
function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Dreams ────────────────────────────────────────────────────────────────────
export function getDreams(): Dream[] { return load<Dream>(KEYS.dreams); }
export function getDream(id: string): Dream | null {
  return getDreams().find((d) => d.id === id) ?? null;
}
export function saveDream(dream: Dream): void {
  const all = getDreams();
  const idx = all.findIndex((d) => d.id === dream.id);
  if (idx >= 0) all[idx] = dream; else all.push(dream);
  save(KEYS.dreams, all);
}
export function updateDream(id: string, patch: Partial<Dream>): void {
  const all = getDreams();
  const idx = all.findIndex((d) => d.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch, updated_at: new Date().toISOString() };
    save(KEYS.dreams, all);
  }
}
export function deleteDream(id: string): void {
  save(KEYS.dreams, getDreams().filter((d) => d.id !== id));
}

// ── Daily Check-Ins ───────────────────────────────────────────────────────────
export function getDailyCheckIns(dreamId: string): DailyCheckIn[] {
  return load<DailyCheckIn>(KEYS.checkins)
    .filter((c) => c.dream_id === dreamId)
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function getCheckInByDate(dreamId: string, date: string): DailyCheckIn | null {
  return load<DailyCheckIn>(KEYS.checkins)
    .find((c) => c.dream_id === dreamId && c.date === date) ?? null;
}
export function saveDailyCheckIn(checkin: DailyCheckIn): void {
  const all = load<DailyCheckIn>(KEYS.checkins);
  const idx = all.findIndex((c) => c.id === checkin.id);
  if (idx >= 0) all[idx] = checkin; else all.push(checkin);
  save(KEYS.checkins, all);
}

// ── Streak ────────────────────────────────────────────────────────────────────
export function getStreak(dreamId: string): number {
  const checkins = getDailyCheckIns(dreamId);
  if (!checkins.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dates = new Set(checkins.map((c) => c.date));
  if (!dates.has(today) && !dates.has(yesterday)) return 0;
  let streak = 0;
  const cur = new Date();
  if (!dates.has(today)) cur.setDate(cur.getDate() - 1);
  while (dates.has(cur.toISOString().slice(0, 10))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}
export function getLongestStreak(dreamId: string): number {
  const checkins = getDailyCheckIns(dreamId);
  if (!checkins.length) return 0;
  const dates = Array.from(new Set(checkins.map((c) => c.date))).sort();
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()) / 86400000;
    if (diff === 1) { cur++; if (cur > best) best = cur; } else cur = 1;
  }
  return best;
}
export function getDaysSinceLastCheckin(dreamId: string): number {
  const checkins = getDailyCheckIns(dreamId);
  if (!checkins.length) return -1;
  const last = checkins[checkins.length - 1].date;
  const today = new Date().toISOString().slice(0, 10);
  return Math.floor((new Date(today).getTime() - new Date(last).getTime()) / 86400000);
}

// ── Personal Best ─────────────────────────────────────────────────────────────
export function getPersonalBest(dreamId: string): PersonalBest | null {
  return load<PersonalBest>(KEYS.pb).find((p) => p.dream_id === dreamId) ?? null;
}
export function updatePersonalBest(dreamId: string): boolean {
  const current = getStreak(dreamId);
  const all = load<PersonalBest>(KEYS.pb);
  const idx = all.findIndex((p) => p.dream_id === dreamId);
  if (idx >= 0) {
    if (current > all[idx].best_streak) {
      all[idx] = { dream_id: dreamId, best_streak: current, achieved_at: new Date().toISOString() };
      save(KEYS.pb, all); return true;
    }
    return false;
  }
  all.push({ dream_id: dreamId, best_streak: current, achieved_at: new Date().toISOString() });
  save(KEYS.pb, all);
  return current > 0;
}

// ── Grace Days ────────────────────────────────────────────────────────────────
export function getGraceDays(dreamId: string): GraceDay[] {
  return load<GraceDay>(KEYS.grace).filter((g) => g.dream_id === dreamId);
}
export function getRollingGraceDaysUsed(dreamId: string): number {
  const ago = new Date(Date.now() - 30 * 86400000).toISOString();
  return getGraceDays(dreamId).filter((g) => g.created_at >= ago).length;
}
export function getRollingGraceDaysRemaining(dreamId: string): number {
  return Math.max(0, 3 - getRollingGraceDaysUsed(dreamId));
}
export function applyGraceDay(dreamId: string, forDate: string): GraceDay {
  const grace: GraceDay = {
    id: crypto.randomUUID(), dream_id: dreamId,
    used_for_date: forDate, created_at: new Date().toISOString(),
  };
  const all = load<GraceDay>(KEYS.grace);
  all.push(grace);
  save(KEYS.grace, all);
  logEvent("grace_day_applied", dreamId);
  return grace;
}
export function tryApplyGraceDay(dreamId: string): string | null {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  if (getGraceDays(dreamId).find((g) => g.used_for_date === yesterday)) return null;
  if (getCheckInByDate(dreamId, yesterday)) return null;
  if (!getCheckInByDate(dreamId, today)) return null;
  if (getRollingGraceDaysRemaining(dreamId) <= 0) return null;
  return applyGraceDay(dreamId, yesterday).used_for_date;
}
export function getStreakWithGrace(dreamId: string): number {
  const checkins = getDailyCheckIns(dreamId);
  const graceDays = getGraceDays(dreamId).map((g) => g.used_for_date);
  if (!checkins.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dates = new Set(
  Array.from(new Set(checkins.map((c) => c.date))).concat(graceDays)
);
  if (!dates.has(today) && !dates.has(yesterday)) return 0;
  let streak = 0;
  const cur = new Date();
  if (!dates.has(today)) cur.setDate(cur.getDate() - 1);
  while (dates.has(cur.toISOString().slice(0, 10))) {
    streak++; cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

// ── XP ────────────────────────────────────────────────────────────────────────
const XP_AMOUNTS: Record<XPReason, number> = {
  checkin: 10, tiny_action: 15, restart: 25, reflection: 5,
  team_support: 10, grace_day_converted: 20, streak_milestone: 50,
  weekly_token: 30, assessment: 40,
};
const XP_LABELS: Record<XPReason, string> = {
  checkin: "Daily check-in", tiny_action: "Tiny action taken",
  restart: "Restarted after a break", reflection: "Reflection written",
  team_support: "Supported a teammate", grace_day_converted: "Grace day converted",
  streak_milestone: "Streak milestone", weekly_token: "Weekly token", assessment: "Assessment completed",
};
export function getDreamXP(dreamId: string): DreamXP {
  return load<DreamXP>(KEYS.xp).find((x) => x.dream_id === dreamId)
    ?? { dream_id: dreamId, total: 0, history: [] };
}
export function addXP(dreamId: string, reason: XPReason, override?: number): XPEvent {
  const amount = override ?? XP_AMOUNTS[reason];
  const event: XPEvent = {
    id: crypto.randomUUID(), dream_id: dreamId, reason, amount,
    label: XP_LABELS[reason], created_at: new Date().toISOString(),
  };
  const all = load<DreamXP>(KEYS.xp);
  const idx = all.findIndex((x) => x.dream_id === dreamId);
  if (idx >= 0) { all[idx].total += amount; all[idx].history.push(event); }
  else all.push({ dream_id: dreamId, total: amount, history: [event] });
  save(KEYS.xp, all);
  logEvent("xp_earned", dreamId, { reason, amount });
  return event;
}

// ── Momentum ──────────────────────────────────────────────────────────────────
export function getMomentumData(dreamId: string): MomentumPoint[] {
  const checkins = getDailyCheckIns(dreamId);
  const graceDays = getGraceDays(dreamId).map((g) => g.used_for_date);
  if (!checkins.length) return [];
  const dates = Array.from(new Set(checkins.map(c => c.date))).sort();
  return dates.map((date, i) => {
    const c = checkins.find((x) => x.date === date)!;
    const grace_day_used = graceDays.includes(date);
    let score = 2;
    if (c.did_something) score += 3;
    if (c.tiny_action && c.tiny_action.length > 5) score += 1;
    if (c.step_statement && c.step_statement.length > 5) score += 1;
    if (c.daily_mode === "do") score += 1;
    else if (c.daily_mode === "plan" || c.daily_mode === "learn") score += 0.5;
    let is_restart = false;
    if (i > 0) {
      const gap = (new Date(date).getTime() - new Date(dates[i-1]).getTime()) / 86400000;
      if (gap >= 2) { score += 2; is_restart = true; }
    }
    if (grace_day_used) score = Math.max(score - 1, 0);
    score = Math.min(Math.round(score * 10) / 10, 10);
    return {
      date, score, checkin_done: true, tiny_action_done: c.did_something,
      is_restart, grace_day_used,
      note: c.tiny_win || c.tiny_action || "",
      hard_reason: c.hard_reason || "",
      daily_mode: c.daily_mode || "",
    };
  });
}

// ── Quotes ────────────────────────────────────────────────────────────────────
type QuoteContext = "restart" | "milestone" | "weekly" | "struggling" | "consistent" | "general";
const QUOTES: Record<QuoteContext, string[]> = {
  restart: [
    "The return is the practice. Every artist, athlete, and creator knows this.",
    "You didn't fail. You paused. Now you're here again. That's the whole game.",
    "Restarting is not starting over. It's continuing from where you actually are.",
    "Consistency isn't a straight line. It's a series of returns.",
  ],
  milestone: [
    "Streaks don't lie. You've built something real here.",
    "The person who shows up 30 times is different from the one who showed up once.",
    "This is what commitment looks like — not a grand gesture, just this, repeated.",
    "Momentum compounds. What you've built doesn't disappear when you rest.",
  ],
  weekly: [
    "A week of showing up is worth more than a year of planning.",
    "The work is quiet. So is the growth. Both are real.",
    "Most people stop before the results are visible. You didn't stop.",
  ],
  struggling: [
    "Hard days count. Showing up on a hard day counts double.",
    "The resistance is loudest when the work matters most.",
    "One percent forward is still forward.",
  ],
  consistent: [
    "This is who you're becoming. It's already working.",
    "The habit is forming. The identity is shifting. Stay.",
    "What you're doing daily is becoming what you are. Keep going.",
  ],
  general: [
    "Every day you show up is a day the dream stays alive.",
    "The work is the path. There is no other path.",
    "Clarity doesn't come before the work. It comes from the work.",
    "The dream doesn't need you to be perfect. It needs you to be present.",
  ],
};
export function getContextualQuote(dreamId: string, context: QuoteContext = "general"): string {
  const pool = QUOTES[context];
  const seed = getDailyCheckIns(dreamId).length + new Date().getDate();
  return pool[seed % pool.length];
}

// ── Weekly Summary ────────────────────────────────────────────────────────────
export function getWeeklySummaries(dreamId: string): WeeklySummary[] {
  return load<WeeklySummary>(KEYS.weekly).filter((w) => w.dream_id === dreamId);
}
export function saveWeeklySummary(ws: WeeklySummary): void {
  const all = load<WeeklySummary>(KEYS.weekly);
  const idx = all.findIndex((w) => w.id === ws.id);
  if (idx >= 0) all[idx] = ws; else all.push(ws);
  save(KEYS.weekly, all);
}
export function getDueWeeklySummary(dreamId: string): {
  weekNumber: number; weekStart: string; weekEnd: string; checkins: DailyCheckIn[];
} | null {
  const checkins = getDailyCheckIns(dreamId);
  if (checkins.length < 7) return null;
  const dream = getDream(dreamId);
  if (!dream) return null;
  const summaries = getWeeklySummaries(dreamId);
  const startDate = new Date(dream.created_at);
  const daysSince = Math.floor((Date.now() - startDate.getTime()) / 86400000);
  const currentWeek = Math.floor(daysSince / 7) + 1;
  if (summaries.some((s) => s.week_number === currentWeek)) return null;
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() + (currentWeek - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const ws = weekStart.toISOString().slice(0, 10);
  const we = weekEnd.toISOString().slice(0, 10);
  const weekCheckins = checkins.filter((c) => c.date >= ws && c.date <= we);
  if (weekCheckins.length < 3) return null;
  return { weekNumber: currentWeek, weekStart: ws, weekEnd: we, checkins: weekCheckins };
}

// ── Badges ────────────────────────────────────────────────────────────────────
export const BADGE_META: Record<BadgeType, { label: string; description: string; emoji: string }> = {
  first_step:         { label: "First Step",       description: "Completed your first daily check-in.", emoji: "◆" },
  three_day_streak:   { label: "3-Day Streak",      description: "Showed up 3 days in a row.",           emoji: "▲" },
  seven_day_streak:   { label: "7-Day Streak",      description: "Showed up 7 days in a row.",           emoji: "★" },
  fourteen_day_streak:{ label: "14-Day Streak",     description: "Two weeks of consistency.",            emoji: "◉" },
  thirty_day_streak:  { label: "30-Day Streak",     description: "A full month of showing up.",          emoji: "⬡" },
  first_checkin:      { label: "First Check-In",    description: "Completed your first check-in.",       emoji: "✦" },
  honest_moment:      { label: "Honest Moment",     description: "Named a hard day honestly.",           emoji: "◌" },
  comeback:           { label: "Comeback",          description: "Returned after a break.",              emoji: "↩" },
  one_month:          { label: "One Month",         description: "One month since you started.",         emoji: "○" },
  six_months:         { label: "Six Months",        description: "Six months of dreaming forward.",      emoji: "◑" },
  one_year:           { label: "One Year",          description: "A full year. You stayed.",             emoji: "◈" },
  weekly_token:       { label: "Weekly Token",      description: "Earned your first weekly token.",      emoji: "⬟" },
  dream_released:     { label: "Dream Released",    description: "Released a dream with intention.",     emoji: "✧" },
  personal_best:      { label: "Personal Best",     description: "Beat your longest streak ever.",       emoji: "⚑" },
  fail_fast:          { label: "Fail Fast",         description: "Named a hard day and came back.",      emoji: "⟳" },
  clarity_seeker:     { label: "Clarity Seeker",    description: "Completed a full assessment.",         emoji: "⊙" },
  returner:           { label: "The Returner",      description: "Returned after 7+ days away.",         emoji: "↺" },
};
export function getBadges(dreamId: string): Badge[] {
  return load<Badge>(KEYS.badges).filter((b) => b.dream_id === dreamId);
}
export function hasBadge(dreamId: string, type: BadgeType): boolean {
  return getBadges(dreamId).some((b) => b.type === type);
}
export function awardBadge(dreamId: string, type: BadgeType): Badge | null {
  if (hasBadge(dreamId, type)) return null;
  const meta = BADGE_META[type];
  const badge: Badge = {
    id: crypto.randomUUID(), dream_id: dreamId, type,
    earned_at: new Date().toISOString(),
    label: meta.label, description: meta.description, emoji: meta.emoji,
  };
  const all = load<Badge>(KEYS.badges);
  all.push(badge);
  save(KEYS.badges, all);
  logEvent("milestone_awarded", dreamId, { type });
  return badge;
}
export function checkAndAwardStreakBadges(dreamId: string): Badge[] {
  const streak = getStreakWithGrace(dreamId);
  const awarded: Badge[] = [];
  const thresholds: [number, BadgeType][] = [
    [3,"three_day_streak"],[7,"seven_day_streak"],[14,"fourteen_day_streak"],[30,"thirty_day_streak"]
  ];
  for (const [n, type] of thresholds) {
    if (streak >= n) { const b = awardBadge(dreamId, type); if (b) awarded.push(b); }
  }
  return awarded;
}
export function checkAndAwardLongTermBadges(dreamId: string): Badge[] {
  const dream = getDream(dreamId);
  if (!dream) return [];
  const awarded: Badge[] = [];
  const days = (Date.now() - new Date(dream.created_at).getTime()) / 86400000;
  if (days >= 30)  { const b = awardBadge(dreamId, "one_month");  if (b) awarded.push(b); }
  if (days >= 180) { const b = awardBadge(dreamId, "six_months"); if (b) awarded.push(b); }
  if (days >= 365) { const b = awardBadge(dreamId, "one_year");   if (b) awarded.push(b); }
  return awarded;
}

// ── Teams ─────────────────────────────────────────────────────────────────────
export function getTeams(): import("./types").DreamTeam[] {
  return load<import("./types").DreamTeam>(KEYS.teams);
}
export function getTeam(id: string): import("./types").DreamTeam | null {
  return getTeams().find((t) => t.id === id) ?? null;
}
export function getTeamByCode(code: string): import("./types").DreamTeam | null {
  return getTeams().find((t) => t.code === code.toUpperCase()) ?? null;
}
export function saveTeam(team: import("./types").DreamTeam): void {
  const all = getTeams();
  const idx = all.findIndex((t) => t.id === team.id);
  if (idx >= 0) all[idx] = team; else all.push(team);
  save(KEYS.teams, all);
}
export function deleteTeam(id: string): void {
  save(KEYS.teams, getTeams().filter((t) => t.id !== id));
}
export function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
export function saveTeamSignal(signal: TeamSignal): void {
  const all = load<TeamSignal>(KEYS.team_signals);
  all.push(signal);
  save(KEYS.team_signals, all);
}

// ── Event Log ─────────────────────────────────────────────────────────────────
type EventEntry = { id: string; event_type: EventType; dream_id?: string; payload?: Record<string, unknown>; created_at: string };
export function logEvent(event_type: EventType, dream_id?: string, payload?: Record<string, unknown>): void {
  const all = load<EventEntry>(KEYS.events);
  all.push({ id: crypto.randomUUID(), event_type, dream_id, payload, created_at: new Date().toISOString() });
  save(KEYS.events, all);
}
export function getEventLog(): EventEntry[] {
  return load<EventEntry>(KEYS.events);
}

// ── Legacy ────────────────────────────────────────────────────────────────────
export function getCheckins(): CheckIn[] { return load<CheckIn>(KEYS.legacy_checkins); }
export function saveCheckin(c: CheckIn): void {
  const all = getCheckins(); all.push(c); save(KEYS.legacy_checkins, all);
}

// ── Released Dreams Vault ──────────────────────────────────────────────────────
export function getVaultEntries(): VaultEntry[] {
  return load<VaultEntry>(KEYS.vault);
}
export function getDreamVaultEntries(dreamId: string): VaultEntry[] {
  return getVaultEntries().filter((e) => e.dream_id === dreamId);
}
export function saveVaultEntry(entry: VaultEntry): void {
  const all = getVaultEntries();
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  save(KEYS.vault, all);
}
export function updateVaultEntry(id: string, patch: Partial<VaultEntry>): void {
  const all = getVaultEntries();
  const idx = all.findIndex((e) => e.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch };
    save(KEYS.vault, all);
  }
}
export function getPastDueVaultEntry(dreamId: string): VaultEntry | null {
  const now = new Date();
  return (
    getDreamVaultEntries(dreamId).find(
      (e) => !e.revisit_answer && !e.archived_permanently && new Date(e.next_review_date) < now
    ) ?? null
  );
}
export function getRecentReleaseCount(dreamId: string, withinDays = 90): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);
  return getDreamVaultEntries(dreamId).filter(
    (e) => new Date(e.released_at) > cutoff
  ).length;
}
// Re-export RevisitAnswer so callers can import it from storage if convenient
export type { RevisitAnswer };
