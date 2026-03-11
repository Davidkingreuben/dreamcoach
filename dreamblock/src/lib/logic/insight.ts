import type { Dream, InsightSummary, DailyMode, ResistanceArchetype } from "../types";

// ── Philosophy lines ──────────────────────────────────────────────────────────

const PHILOSOPHY: string[] = [
  "The reward for a good deed is the opportunity to do another good deed.",
  "Fail fast. Failure is fuel.",
  "One step at a time.",
  "Walk to the end of the road. Look left, right, or straight. If it's a dead end, turn around — then plan your next step.",
  "Faith is taking the next step before you can see the whole map.",
];

function pickPhilosophy(seed: string): string {
  // Deterministic pick based on dream ID to keep it consistent
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PHILOSOPHY[Math.abs(hash) % PHILOSOPHY.length];
}

// ── SEEN: psychological insight ───────────────────────────────────────────────

const SEEN_BY_ARCHETYPE: Record<ResistanceArchetype, string> = {
  "Fear of Visibility":
    "You've been building this in your mind. What scares you isn't failing — it's being seen in the act of trying. Visibility feels like exposure, not expression. So you protect yourself by not starting. The work stays safe in the imagined version, where no one can judge it — and neither can you.",
  "Perfectionist Freeze":
    "The standard keeps moving. Every time you get close, the bar rises. That's not ambition — it's a delay mechanism wearing ambition's clothes. Perfectionism isn't about quality; it's about never having to find out. The bar can't be met because the bar isn't real.",
  "Overwhelm Fog":
    "You're trying to solve a three-year problem in a single mental session. The whole mountain is visible from the bottom, and it's paralyzing. The scope isn't the problem — trying to hold all of it at once is. You don't need the full map. You need the next ten meters.",
  "Identity Conflict":
    "Part of you doesn't believe you're the kind of person who actually does this. You're waiting to become someone else before you start — but the identity comes after the action, not before. No one wakes up as a musician. They wake up and practice.",
  "Fear of Success":
    "Even with success guaranteed, you'd still hesitate. That's not fear of failing — that's fear of what would change if this worked. Who you'd have to become. What you'd have to give up. What people would expect. Failing is safe because it changes nothing.",
  "Shame Loop":
    "Something happened before — a past attempt, early criticism, a comparison that stuck — and it became evidence. You've been treating one painful moment as a permanent verdict. It isn't. One data point is not a pattern. One chapter is not the book.",
  "Consistency Collapse":
    "You can start. That's not your problem. The problem is the system around starting — or the absence of one. Motivation gets you to the door. It doesn't keep you walking. You've been treating consistency as a character trait when it's actually a design problem.",
  "Misalignment":
    "Part of what you want isn't the dream itself — it's what the dream would say about you. That's not a flaw; most desires have this layer. But when the identity payoff is the main driver, the daily work feels hollow. Worth asking: what do you actually want to be doing on a Tuesday afternoon?",
};

function getOtherPrefix(dream: Dream): string {
  if (dream.emotion_other?.trim())
    return `You described feeling "${dream.emotion_other.trim()}" when thinking about this dream — that specificity matters.`;
  if (dream.first_thought_other?.trim())
    return `You described "${dream.first_thought_other.trim()}" as the thought that stops you — that's worth holding onto.`;
  if (dream.protecting_other?.trim())
    return `You described the resistance as protecting "${dream.protecting_other.trim()}" — that honesty is the starting point.`;
  if (dream.stuck_point_other?.trim())
    return `You named "${dream.stuck_point_other.trim()}" as where you get stuck most — and that's exactly what this is designed to address.`;
  return "";
}

function getSeen(dream: Dream): string {
  const archetype = dream.archetype as ResistanceArchetype;
  const base = SEEN_BY_ARCHETYPE[archetype] || "You've been carrying this longer than you needed to. The resistance makes sense given everything it's protecting you from. Understanding what it's protecting is the first real step.";
  const prefix = getOtherPrefix(dream);
  return prefix ? `${prefix} ${base}` : base;
}

// ── HELD: normalization + emotional holding ───────────────────────────────────

function getHeld(dream: Dream): string {
  const years = dream.years_delayed || "a while";
  const delayedStr = years === "< 1 year" ? "less than a year" : years;
  const hesitate = dream.guaranteed_hesitate === "yes";
  const notTimeLeft = dream.willing_to_commit === false;
  const timeIssue = dream.time_realistic === "none" || dream.time_realistic === "little";

  if (hesitate) {
    return `You've carried this for ${delayedStr}. That is not laziness — that is the weight of something that genuinely matters to you. And the fact that you'd still hesitate even if success were guaranteed? That honesty matters. It means the work itself, not just the outcome, is part of what you're working through. Most people never even get this honest about what's actually in the way.`;
  }
  if (notTimeLeft) {
    return `You've carried this for ${delayedStr}, and you've been honest: the timeline feels too long to commit to right now. That's not giving up. That's clarity. Deferring consciously — knowing why — is completely different from avoiding unconsciously. You're here, which means you haven't let go of it either.`;
  }
  if (timeIssue) {
    return `You've carried this for ${delayedStr} and you're living a full life with real obligations. The time issue is real. The dream is also real. You don't have to choose one to honor the other right now — you just have to be honest about which one you're choosing, one day at a time.`;
  }
  return `You've carried this for ${delayedStr}. That's not failure. That's the weight of something that still matters enough to be here. The fact that you're doing this assessment means some part of you hasn't let go — and that part deserves a fair hearing. Today isn't a verdict. It's just information.`;
}

// ── MOVED: one action under 10 minutes ───────────────────────────────────────

const MOVED_BY_STUCK: Record<string, { action: string; doorway: string; mode: DailyMode }> = {
  starting: {
    action:
      "Open a blank document (or notebook page). Write the title of your dream at the top. Nothing else. Close it. That's the session. 3 minutes maximum.",
    doorway:
      "Physically touch the object most associated with your dream (instrument, notebook, sketchbook, running shoes). Just touch it. That's it.",
    mode: "do",
  },
  consistency: {
    action:
      "Identify the one specific time slot this week — not every day, just one — when you will do 10 minutes on this. Write it down as an appointment. Don't plan the work yet. Just schedule it.",
    doorway:
      "Set a recurring alarm on your phone labeled with your dream title. Just the alarm. Don't decide what to do with it yet.",
    mode: "plan",
  },
  finishing: {
    action:
      "Open whatever you last worked on. Read it, look at it, listen to it — don't edit. Just observe where you actually are. Set a timer for 10 minutes. When it goes off, stop.",
    doorway:
      "List the three things that would need to happen for this to be 'done.' Just the list. No action required.",
    mode: "do",
  },
  publishing: {
    action:
      "Send your work to one trusted person and ask only: 'Does this make sense?' That's the whole brief. One person. One question.",
    doorway:
      "Write the title or subject line of the post/upload/send you're avoiding. Just the title. Nowhere to post it yet.",
    mode: "ask",
  },
  promoting: {
    action:
      "Find one person who has done something adjacent to your dream and read about how they started sharing. Just research — no action on your own work yet.",
    doorway:
      "Write one sentence about what you made and why it exists. Just the sentence. For your eyes only.",
    mode: "learn",
  },
  committing: {
    action:
      "Write this down: 'If I do this for 30 days and it goes nowhere, I will have learned ____.' Fill in the blank. That's the commitment framing — not 'will it succeed' but 'what will I learn.'",
    doorway:
      "Write the answer to: 'What would trying look like if I wasn't trying to succeed — just trying to find out?' One sentence.",
    mode: "plan",
  },
};

function getMoved(dream: Dream): { action: string; doorway: string; mode: DailyMode } {
  const stuck = dream.stuck_point;
  const archetype = dream.archetype;

  // Archetype-specific overrides for certain combos
  if (archetype === "Fear of Visibility" && stuck === "publishing") {
    return {
      action: "Write an honest caption for your work as if you were talking to one friend who already gets it — not the public. Don't post it. Just write it. 5 minutes.",
      doorway: "Name the specific fear underneath not posting. Write it in one sentence. Private. No action required.",
      mode: "do",
    };
  }
  if (archetype === "Perfectionist Freeze" && stuck === "finishing") {
    return {
      action: "Set a timer for 10 minutes. Work on your piece with the intention of making it 5% worse on purpose. Ship the imperfect version of one small part.",
      doorway: "Write down three things that are already good about it. Three. Not what's missing — what's there.",
      mode: "do",
    };
  }
  if (archetype === "Overwhelm Fog" && stuck === "starting") {
    return {
      action: "Write the single smallest action that would count as 'touching' this dream today. The embarrassingly small one. Now do just that one thing.",
      doorway: "Open a note and type: 'The next physical action on my dream is:' Fill in the blank with a verb + object. ('Write opening line.' 'Send email to X.' 'Tune the guitar.')",
      mode: "do",
    };
  }

  return MOVED_BY_STUCK[stuck] || {
    action: "Take 10 minutes and do the first thing that comes to mind when you think about this dream. Not the right thing — just something. Fail fast.",
    doorway: "Write the name of the dream on a piece of paper. Put it somewhere you'll see it tomorrow morning.",
    mode: "do",
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateInsight(dream: Dream): InsightSummary {
  const seen = getSeen(dream);
  const held = getHeld(dream);
  const { action: moved, doorway: moved_doorway, mode: moved_mode } = getMoved(dream);
  const philosophy_line = pickPhilosophy(dream.id);

  return { seen, held, moved, moved_doorway, moved_mode, philosophy_line };
}

// ── Weekly pattern generator ──────────────────────────────────────────────────

export function generateWeeklyPattern(
  checkinCount: number,
  didDays: number,
  hardReasons: string[]
): string {
  if (checkinCount === 0) return "No check-ins this week. No penalty. Come back today. Restarting is the skill.";
  if (didDays === 0) return `You checked in ${checkinCount} time${checkinCount !== 1 ? "s" : ""} this week and were honest every time. That honesty is data, not failure.`;
  
  const rate = didDays / 7;
  const topReason = hardReasons.length > 0
    ? hardReasons.sort((a, b) =>
        hardReasons.filter((x) => x === b).length - hardReasons.filter((x) => x === a).length
      )[0]
    : null;

  const reasonPhrases: Record<string, string> = {
    fear: "Fear was the main friction this week.",
    perfectionism: "Perfectionism was blocking you more than anything.",
    unclear: "Lack of clarity was the biggest obstacle.",
    energy: "Energy was the limiting factor this week.",
    time: "Time was tight this week.",
    distraction: "Distraction was the main friction.",
    other: "Something specific kept getting in the way.",
  };

  const reasonPhrase = topReason ? reasonPhrases[topReason] || "" : "";

  if (rate >= 0.7) return `Strong week — you showed up ${didDays} out of 7 days. ${reasonPhrase} The compounding is working.`;
  if (rate >= 0.4) return `Solid week — ${didDays} days of forward motion. ${reasonPhrase} Consistency isn't perfection. This counts.`;
  return `${didDays} day${didDays !== 1 ? "s" : ""} of movement this week. ${reasonPhrase} Coming back every week matters more than any single week's number.`;
}
