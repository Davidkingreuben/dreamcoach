import type { ResistanceArchetype, ResistanceAnswers, StuckPhase, StuckPoint } from "../types";

export const ARCHETYPE_INFO: Record<ResistanceArchetype, {
  icon: string;
  tagline: string;
  description: string;
  color: string;
  bg: string;
}> = {
  "Fear of Visibility": {
    icon: "◉",
    tagline: "You can create. You can't be seen.",
    description: "Your work exists — but sharing it triggers something primal. Visibility feels like exposure, not expression.",
    color: "#8B7ED8",
    bg: "rgba(139,126,216,0.10)",
  },
  "Perfectionist Freeze": {
    icon: "◌",
    tagline: "Nothing is ever ready enough.",
    description: "You raise the bar every time you get close. Perfection isn't a standard — it's a delay mechanism.",
    color: "#5B9BD5",
    bg: "rgba(91,155,213,0.10)",
  },
  "Overwhelm Fog": {
    icon: "≋",
    tagline: "The scope swallows you before you begin.",
    description: "You see the whole mountain, not the next step. The gap between where you are and where you want to be feels uncrossable.",
    color: "#6B8FC5",
    bg: "rgba(107,143,197,0.10)",
  },
  "Identity Conflict": {
    icon: "⟁",
    tagline: "Who am I to do this?",
    description: "This dream doesn't fit the self-concept you currently inhabit. Pursuing it means becoming someone different — and that's terrifying.",
    color: "#9B7AAE",
    bg: "rgba(155,122,174,0.10)",
  },
  "Fear of Success": {
    icon: "◈",
    tagline: "What changes if this actually works?",
    description: "Failure is familiar. Success would reorganize your life, relationships, and identity in ways you haven't fully faced.",
    color: "#5EAA8B",
    bg: "rgba(94,170,139,0.10)",
  },
  "Shame Loop": {
    icon: "⊙",
    tagline: "Past attempts haunt this one.",
    description: "You've tried before and it didn't work. Now shame sits at the entrance. The past is preventing the present.",
    color: "#C47A5A",
    bg: "rgba(196,122,90,0.10)",
  },
  "Consistency Collapse": {
    icon: "⊿",
    tagline: "You start strong. You can't sustain.",
    description: "Initial energy is real — but something breaks at the 2-week mark. This is about systems, not willpower.",
    color: "#5AACBA",
    bg: "rgba(90,172,186,0.10)",
  },
  "Misalignment": {
    icon: "⊗",
    tagline: "This may not actually be your dream.",
    description: "Something about this draws you, but you're not sure it's really yours. It might be borrowed desire, or a symbol of something else entirely.",
    color: "#A08B5A",
    bg: "rgba(160,139,90,0.10)",
  },
};

export const STUCK_PHASE_MAP: Record<string, StuckPhase> = {
  starting: "First-Step Resistance",
  committing: "Preparation",
  consistency: "Momentum",
  finishing: "Pre-Publish Panic",
  publishing: "Pre-Publish Panic",
  promoting: "Pre-Publish Panic",
};

// ── Free-text "Other" keyword helpers ────────────────────────────────────────

function hasKeyword(text: string | undefined, keywords: string[]): boolean {
  if (!text || !text.trim()) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function resolveOtherSignal(answers: ResistanceAnswers): ResistanceArchetype | null {
  const {
    emotion, emotion_other,
    first_thought, first_thought_other,
    stuck_point, stuck_point_other,
    protecting, protecting_other,
  } = answers;

  const isOther = (val: string) => val === "other" || val.split(",").includes("other");

  if (isOther(emotion) && emotion_other) {
    if (hasKeyword(emotion_other, ["fear", "anxious", "anxiety", "panic", "terrified", "scared", "afraid"])) return "Fear of Visibility";
    if (hasKeyword(emotion_other, ["shame", "embarrass", "humiliat", "judged", "rejection"])) return "Shame Loop";
    if (hasKeyword(emotion_other, ["overwhelm", "burnout", "too much", "exhaust", "drown"])) return "Overwhelm Fog";
    if (hasKeyword(emotion_other, ["bored", "numb", "hollow", "empty", "detach", "flat"])) return "Misalignment";
  }

  if (isOther(first_thought) && first_thought_other) {
    if (hasKeyword(first_thought_other, ["money", "financial", "afford", "cost", "resource", "fund"])) return "Overwhelm Fog";
    if (hasKeyword(first_thought_other, ["not good enough", "not ready", "not skilled", "not qualified", "impostor"])) return "Perfectionist Freeze";
    if (hasKeyword(first_thought_other, ["judge", "embarrass", "seen", "expos", "public", "ridicule", "laugh"])) return "Fear of Visibility";
    if (hasKeyword(first_thought_other, ["too late", "missed", "behind", "past it", "age"])) return "Shame Loop";
    if (hasKeyword(first_thought_other, ["point", "matter", "who cares", "worth it", "meaningless"])) return "Misalignment";
  }

  if (isOther(stuck_point) && stuck_point_other) {
    if (hasKeyword(stuck_point_other, ["start", "begin", "initiat", "first step"])) return "Overwhelm Fog";
    if (hasKeyword(stuck_point_other, ["finish", "complet", "done", "final", "end"])) return "Perfectionist Freeze";
    if (hasKeyword(stuck_point_other, ["share", "publish", "post", "release", "show", "put out"])) return "Fear of Visibility";
    if (hasKeyword(stuck_point_other, ["consist", "habit", "sustain", "keep going", "stick with", "maintain"])) return "Consistency Collapse";
  }

  if (isOther(protecting) && protecting_other) {
    if (hasKeyword(protecting_other, ["identity", "who i am", "sense of self", "image", "ego"])) return "Identity Conflict";
    if (hasKeyword(protecting_other, ["comfort", "safe", "familiar", "routine", "stability"])) return "Fear of Success";
    if (hasKeyword(protecting_other, ["relationship", "family", "friend", "partner", "marriage"])) return "Fear of Success";
    if (hasKeyword(protecting_other, ["money", "income", "financial", "afford", "job", "career"])) return "Overwhelm Fog";
  }

  return null;
}

export function determineArchetype(answers: ResistanceAnswers): ResistanceArchetype {
  const { emotion, first_thought, stuck_point, protecting, guaranteed_hesitate } = answers;

  if (protecting === "identity") return "Identity Conflict";
  if (emotion === "shame") return "Shame Loop";
  if (emotion === "boredom" || emotion === "numbness") return "Misalignment";
  if ((stuck_point === "publishing" || stuck_point === "promoting") && (emotion === "fear" || first_thought === "judgment")) return "Fear of Visibility";
  if (first_thought === "not_enough" || stuck_point === "finishing") return "Perfectionist Freeze";
  if (first_thought === "judgment") return "Fear of Visibility";
  if (emotion === "overwhelm" || first_thought === "no_start" || stuck_point === "starting") return "Overwhelm Fog";
  if (guaranteed_hesitate === "yes" && protecting === "comfort") return "Fear of Success";
  if (stuck_point === "consistency") return "Consistency Collapse";
  if (first_thought === "too_late") return "Shame Loop";
  if (first_thought === "wont_matter") return "Misalignment";

  // Keyword fallback: only fires when base button logic finds no match
  const otherSignal = resolveOtherSignal(answers);
  if (otherSignal) return otherSignal;

  return "Perfectionist Freeze";
}

export function determineStuckPhase(stuckPoint: StuckPoint | ""): StuckPhase {
  return STUCK_PHASE_MAP[stuckPoint] || "Dormancy";
}
