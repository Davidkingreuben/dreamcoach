import type { Dream, DailyCheckIn, ResistanceArchetype } from "../types";
import { ARCHETYPE_INFO } from "./archetypes";

// ── Daily Dashboard Data ──────────────────────────────────────────────────────

export interface DailyDashboardData {
  resistance_pattern: string;
  resistance_interpretation: string;
  what_they_want: string;
  needle_moved: string;
  biggest_obstacle: string;
  tomorrow_action: string;
  psychological_cheat: string;
  trajectory: string;
  generated_at: string;
}

// ── Interpreters ─────────────────────────────────────────────────────────────

function interpretTrueWant(dream: Dream): string {
  if (dream.true_want_other?.trim()) {
    const t = dream.true_want_other.trim().toLowerCase();
    if (t.includes("creat") || t.includes("express") || t.includes("art")) return "A form of expression that feels genuinely yours — something that exists because you made it.";
    if (t.includes("free") || t.includes("independ") || t.includes("autonomous")) return "Autonomy — the ability to direct your own time and work without the permission of others.";
    if (t.includes("connect") || t.includes("community") || t.includes("belong")) return "Connection through the work — to be part of something, or to create something that creates community.";
    if (t.includes("prove") || t.includes("show") || t.includes("validat")) return "Validation — the confirmation that this was worth the attempt and that you were capable.";
    return "Something specific and personal — the kind of want that doesn't have a neat label.";
  }

  const wantMap: Record<string, string> = {
    status: "Recognition — to be seen as someone who actually did this, not just someone who wanted to.",
    identity: "To become the person who does this, not just someone who talks about it.",
    process: "The daily experience of doing this work — the act itself is the point, not just the arrival.",
    meaning: "Genuine expression — to have made something that reflects who you actually are.",
    output: "The finished thing — the artifact, the product, the result that exists in the world beyond you.",
  };

  return wantMap[dream.true_want] || "Something this assessment doesn't have a clean category for — which is often the most honest kind of want.";
}

function interpretBiggestObstacle(hardReasons: string[], archetype: ResistanceArchetype): string {
  if (hardReasons.length === 0) {
    const archMap: Record<ResistanceArchetype, string> = {
      "Fear of Visibility": "The moment of exposure — finishing is easier than showing. The resistance concentrates at the threshold.",
      "Perfectionist Freeze": "The moving standard — the bar that rises each time you approach it, keeping completion perpetually out of reach.",
      "Overwhelm Fog": "The inability to isolate the next step from the whole picture — the scope collapses onto the starting point.",
      "Identity Conflict": "The renegotiation of self-concept — pursuing this requires becoming someone different, and that transition has real cost.",
      "Fear of Success": "The life that success would reorganise — not the failure, but the unknown territory on the other side of it working.",
      "Shame Loop": "Past evidence being used as present prediction — one data point being treated as a permanent verdict.",
      "Consistency Collapse": "The gap between the ideal system and the real one — no structure to sustain momentum when motivation is low.",
      "Misalignment": "The disconnect between the form of this dream and what it's actually meant to deliver emotionally.",
    };
    return archMap[archetype];
  }

  const freq: Record<string, number> = {};
  hardReasons.forEach((r) => { freq[r] = (freq[r] || 0) + 1; });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];

  const reasonMap: Record<string, string> = {
    fear: "Fear has been the most consistent obstacle this week — appearing across multiple sessions rather than just one.",
    perfectionism: "The perfectionism loop has been the dominant friction — slowing more days than anything else.",
    unclear: "Lack of clarity has been the primary block — the 'what next' question isn't fully resolved.",
    energy: "Capacity has been the main constraint — the energy available for this hasn't matched what the work requires.",
    time: "Time has been the most pressing obstacle — the reliable space for this hasn't existed this week.",
    distraction: "Distraction has been winning most days — attention hasn't been available when the window was.",
    other: "Something specific and recurring has been getting in the way this week.",
  };

  return reasonMap[top] || "The friction pattern isn't fully clear yet — more data will sharpen it.";
}

function generateTrajectory(dream: Dream, checkins: DailyCheckIn[]): string {
  const archetype = dream.archetype as ResistanceArchetype;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const recent = checkins.filter((c) => c.date >= thirtyDaysAgo);
  const moveDays = recent.filter((c) => c.did_something).length;
  const consistency = recent.length > 0 ? moveDays / recent.length : 0;

  const trajectoryMap: Record<ResistanceArchetype, { high: string; medium: string; low: string }> = {
    "Fear of Visibility": {
      high: "At this rate, the visibility resistance is being dismantled through repetition. Within a few months, exposure won't carry the same weight — because you'll have done it enough times that the fear has less surface area to attach to.",
      medium: "The pattern is shifting. The visibility fear is being interrupted rather than dissolved. Each act of sharing, however small, retrains the nervous system — exposure becomes something survivable rather than something to pre-emptively avoid.",
      low: "The priority right now isn't sharing more. It's finishing more privately — building the evidence that completion is possible, separately from the question of visibility.",
    },
    "Perfectionist Freeze": {
      high: "Momentum is building and the internal standard is becoming more calibrated. At this rate, in a few months you'll have a body of work that provides its own evidence — which is the only thing that actually moves the perfectionist bar.",
      medium: "Each time you finish something at 80% and move forward, you're eroding the perfectionist loop at its root. The 'good enough to proceed' muscle is getting real exercise.",
      low: "The most important move right now is one completed draft — imperfect, possibly unshared, just done. One completion creates the evidence that completion is possible. That evidence is the whole point.",
    },
    "Overwhelm Fog": {
      high: "The system is working. The fog lifts when things are broken down, and you're doing that consistently. At this rate, the project that felt uncrossable will have a clear path while most people are still deciding whether to start.",
      medium: "Each time you identify the next physical action and do it, you're training the default state toward clarity rather than scope paralysis. This compounds more than it appears to in the moment.",
      low: "The single priority is finding the next physical action and doing only that. Not the plan. Not the phase. Just: verb and object. 'Write first sentence.' 'Open the file.' 'Email X.' That's enough for now.",
    },
    "Identity Conflict": {
      high: "The new identity is forming through the actions, not the declarations. What you're doing regularly is beginning to reshape the internal narrative. Keep going — it always starts this way.",
      medium: "Each private act on this work shifts the self-concept slightly. It doesn't feel like identity change yet, but the pattern is accumulating. Identity shifts happen below the threshold of awareness first.",
      low: "The most powerful step is one private action that no one else sees. Do something related to this that isn't for an audience. The identity shift always begins in private before it becomes visible.",
    },
    "Fear of Success": {
      high: "The changes success would require are being approached gradually, which is exactly right. The life reorganisation that felt threatening is becoming familiar — decision by decision, not all at once.",
      medium: "The work and the renegotiation of what success means can happen in parallel. You don't need to resolve the second to make real progress on the first — they inform each other.",
      low: "The right entry point is the smallest reversible action: not a commitment, an experiment. What would two weeks of movement look like, with a built-in option to stop? Start there.",
    },
    "Shame Loop": {
      high: "New evidence is being created. Each check-in, each action, each return contradicts the old story. In a few months, there will be more forward data than backward data — and the narrative will have to update.",
      medium: "The loop is being interrupted by actual movement. Each forward action creates a data point that complicates the simple verdict the shame has been running.",
      low: "The first goal isn't progress on the dream. It's one small action that directly contradicts the shame narrative — something undeniable, even if tiny. That's the proof to start with.",
    },
    "Consistency Collapse": {
      high: "The return pattern is strong. At this pace, the habit is becoming structural rather than volitional — meaning it stops depending on motivation to sustain.",
      medium: "The most important metric right now isn't consistency. It's return rate — how quickly you come back after a miss. Each faster return is a system improvement.",
      low: "The only system that works is the one that makes the next session the path of least resistance. What would need to be true for tomorrow's session to require zero decision-making to initiate? Design for that.",
    },
    "Misalignment": {
      high: "Something is clarifying through the doing. At this rate, you'll either confirm that this form of the dream is genuinely right — proven by the pull you feel doing it — or identify what the real version looks like.",
      medium: "The doing is revealing what the wanting actually is. Keep going: the misalignment either corrects itself through engagement or becomes undeniable. Either outcome is more useful than staying still.",
      low: "The most valuable thing right now is one honest session on the question: 'What specifically am I chasing, and is this the only way to get it?' That clarity is worth more than forward progress on a form that might be wrong.",
    },
  };

  const t = trajectoryMap[archetype] || { high: "", medium: "", low: "" };
  if (consistency >= 0.6) return t.high;
  if (consistency >= 0.3) return t.medium;
  return t.low;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateDailyDashboard(
  dream: Dream,
  checkins: DailyCheckIn[],
): DailyDashboardData {
  const today = new Date().toISOString().slice(0, 10);
  const todayCheckin = checkins.find((c) => c.date === today) ?? null;
  const recentCheckins = checkins.slice(-7);
  const archetype = dream.archetype as ResistanceArchetype;
  const archInfo = ARCHETYPE_INFO[archetype];

  // 1. Resistance pattern
  const resistance_pattern = dream.archetype;
  const resistance_interpretation = archInfo
    ? archInfo.why
    : "A pattern worth understanding — understanding it is always the first move.";

  // 2. What they actually want
  const what_they_want = interpretTrueWant(dream);

  // 3. What moved today
  const needle_moved = todayCheckin?.did_something
    ? todayCheckin.tiny_action || "You moved today."
    : todayCheckin
    ? "You checked in honestly — naming a hard day is part of the work, not separate from it."
    : "No check-in yet. Today is still an open question.";

  // 4. Biggest obstacle this week
  const hardReasons = recentCheckins
    .map((c) => c.hard_reason)
    .filter((h) => h.length > 0) as string[];
  const biggest_obstacle = interpretBiggestObstacle(hardReasons, archetype);

  // 5. Tomorrow's smallest meaningful action
  const lastCheckin = checkins[checkins.length - 1];
  const tomorrow_action =
    lastCheckin?.step_statement?.trim() ||
    (Array.isArray(dream.micro_steps) && dream.micro_steps.length > 0
      ? dream.micro_steps[0]
      : "Return tomorrow and name one forward action — specific, small, and doable even on a hard day.");

  // 6. Psychological cheat (rotates daily so it changes without being random)
  const cheats = archInfo?.cheats ?? [];
  const cheatIndex = cheats.length > 0 ? new Date().getDate() % cheats.length : 0;
  const psychological_cheat =
    cheats[cheatIndex] || "Start smaller than feels meaningful. Then do it.";

  // 7. Long-term trajectory
  const trajectory = generateTrajectory(dream, checkins);

  return {
    resistance_pattern,
    resistance_interpretation,
    what_they_want,
    needle_moved,
    biggest_obstacle,
    tomorrow_action,
    psychological_cheat,
    trajectory,
    generated_at: new Date().toISOString(),
  };
}
