"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveDream } from "@/lib/storage";
import { generateInsight } from "@/lib/logic/insight";
import { determineArchetype, determineStuckPhase } from "@/lib/logic/archetypes";
import { classifyDream } from "@/lib/logic/classification";
import { getMicroSteps } from "@/lib/logic/microsteps";
import type {
  DreamIntake, ResistanceAnswers, RealityAnswers,
  Dream, InsightSummary, SacrificeType,
} from "@/lib/types";

// ── Theme ──────────────────────────────────────────────────────────────────────

const T = {
  bg: "var(--db-bg)",
  surface: "var(--db-surface)",
  border: "var(--db-border)",
  text: "var(--db-text)",
  sub: "var(--db-sub)",
  muted: "var(--db-muted)",
};

// ── Discriminated union for RealityQ ──────────────────────────────────────────

type SingleKey = "physical_constraint" | "time_realistic" | "true_want";
type MultiKey = "sacrifice";
type BoolKey = "responsibility_conflict" | "willing_to_commit" | "without_reward";
type TextKey = "realistic_years";

interface RealityQSingle {
  kind: "single";
  field: SingleKey;
  question: string;
  sub?: string;
  options: { v: string; l: string }[];
}
interface RealityQMulti {
  kind: "multi";
  field: MultiKey;
  question: string;
  sub?: string;
  options: { v: SacrificeType; l: string }[];
}
interface RealityQBool {
  kind: "bool";
  field: BoolKey;
  question: string;
  sub?: string;
  yesLabel?: string;
  noLabel?: string;
}
interface RealityQText {
  kind: "text";
  field: TextKey;
  question: string;
  sub?: string;
  placeholder?: string;
}
type RealityQ = RealityQSingle | RealityQMulti | RealityQBool | RealityQText;

// ── Step definitions ───────────────────────────────────────────────────────────

const CATEGORIES = [
  "Music", "Podcast", "Art", "Business",
  "Athletic", "Writing", "Lifestyle", "Other",
];

const YEARS_OPTIONS = [
  "< 1 year", "1–3 years", "3–7 years", "7–15 years", "15+ years",
];

const EMOTION_OPTIONS = [
  { v: "fear", l: "Fear" },
  { v: "shame", l: "Shame" },
  { v: "overwhelm", l: "Overwhelm" },
  { v: "boredom", l: "Boredom or numbness" },
  { v: "excite_crash", l: "Excitement, then crash" },
  { v: "numbness", l: "Numbness" },
  { v: "not_sure", l: "Not sure" },
  { v: "other", l: "Other" },
];

const THOUGHT_OPTIONS = [
  { v: "not_enough", l: "I'm not good enough" },
  { v: "judgment", l: "People will judge me" },
  { v: "no_start", l: "I don't know where to start" },
  { v: "too_late", l: "It's too late" },
  { v: "wont_matter", l: "It won't matter anyway" },
  { v: "not_sure", l: "Not sure" },
  { v: "other", l: "Other" },
];

const STUCK_OPTIONS = [
  { v: "starting", l: "Starting at all" },
  { v: "consistency", l: "Staying consistent" },
  { v: "finishing", l: "Finishing things" },
  { v: "publishing", l: "Putting it out there" },
  { v: "promoting", l: "Promoting / sharing it" },
  { v: "committing", l: "Committing at all" },
  { v: "not_sure", l: "Not sure" },
  { v: "other", l: "Other" },
];

const PROTECT_OPTIONS = [
  { v: "comfort", l: "My comfort zone" },
  { v: "identity", l: "My sense of who I am" },
  { v: "relationships", l: "My relationships" },
  { v: "control", l: "A feeling of control" },
  { v: "certainty", l: "Certainty / predictability" },
  { v: "not_sure", l: "Not sure" },
  { v: "other", l: "Other" },
];

const WANT_OPTIONS = [
  { v: "status", l: "Status / recognition" },
  { v: "identity", l: "To be someone who does this" },
  { v: "process", l: "The daily process itself" },
  { v: "meaning", l: "Meaning and expression" },
  { v: "output", l: "The finished product" },
  { v: "other", l: "Other" },
];

const REALITY_QUESTIONS: RealityQ[] = [
  {
    kind: "single",
    field: "physical_constraint",
    question: "Are there physical constraints on this dream?",
    sub: "Age, health, geography, or other hard limits.",
    options: [
      { v: "none", l: "None — nothing physically stops me" },
      { v: "minor", l: "Minor — manageable constraints" },
      { v: "significant", l: "Significant — real obstacles" },
      { v: "impossible", l: "May be physically impossible" },
    ],
  },
  {
    kind: "single",
    field: "time_realistic",
    question: "Do you have real time to work on this?",
    sub: "Honestly, given your current life.",
    options: [
      { v: "yes", l: "Yes — I can genuinely carve time" },
      { v: "some", l: "Some — with sacrifice" },
      { v: "little", l: "Very little right now" },
      { v: "none", l: "Not currently possible" },
    ],
  },
  {
    kind: "multi",
    field: "sacrifice",
    question: "What would pursuing this cost you?",
    sub: "Select all that apply.",
    options: [
      { v: "sleep", l: "Sleep" },
      { v: "social", l: "Social time" },
      { v: "income", l: "Income" },
      { v: "career", l: "Career focus" },
      { v: "creative", l: "Other creative work" },
      { v: "family", l: "Family time" },
    ],
  },
  {
    kind: "bool",
    field: "responsibility_conflict",
    question: "Does this conflict with your current responsibilities?",
    sub: "Family, work, finances.",
    yesLabel: "Yes, there's real conflict",
    noLabel: "No, it's compatible",
  },
  {
    kind: "text",
    field: "realistic_years",
    question: "How long would it realistically take?",
    sub: "Give an honest timeframe, not an optimistic one.",
    placeholder: "e.g. 2–3 years of consistent work",
  },
  {
    kind: "bool",
    field: "willing_to_commit",
    question: "Are you willing to commit that time?",
    sub: "Knowing what it would actually cost.",
    yesLabel: "Yes — I'm in",
    noLabel: "Honestly, no",
  },
  {
    kind: "single",
    field: "true_want",
    question: "What do you most want from this dream?",
    sub: "Be honest — there's no wrong answer.",
    options: WANT_OPTIONS,
  },
  {
    kind: "bool",
    field: "without_reward",
    question: "Would you still want this if no one ever knew?",
    sub: "No recognition, no status, no audience.",
    yesLabel: "Yes — I'd still want it",
    noLabel: "Honestly, no",
  },
];

// ── Step counts ────────────────────────────────────────────────────────────────
// Step 0      = combined intake page (title + category + years + sliders)
// Steps 1–5   = resistance questions
// Steps 6–13  = reality questions

const TOTAL_INTAKE = 1;
const TOTAL_RESISTANCE = 5;
const TOTAL_REALITY = REALITY_QUESTIONS.length; // 8
const TOTAL_STEPS = TOTAL_INTAKE + TOTAL_RESISTANCE + TOTAL_REALITY; // 14

// ── Day-count helper ───────────────────────────────────────────────────────────

function yearsToApproxDays(years: string): number {
  switch (years) {
    case "< 1 year":   return 182;
    case "1–3 years":  return 730;
    case "3–7 years":  return 1825;
    case "7–15 years": return 3650;
    case "15+ years":  return 5475;
    default:           return 0;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 3, width: "100%" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 2,
            borderRadius: 1,
            background: i < current
              ? "rgba(210, 220, 248, 0.9)"
              : "rgba(160, 175, 220, 0.28)",
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

function ChipBtn({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        border: selected ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
        background: selected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
        color: selected ? T.text : T.sub,
        fontSize: 14,
        cursor: "pointer",
        textAlign: "left" as const,
        lineHeight: 1.4,
        transition: "all 0.15s ease",
        width: "100%",
      }}
    >
      {label}
    </button>
  );
}

function PillBtn({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 18px",
        borderRadius: 22,
        border: selected ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
        background: selected ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.03)",
        color: selected ? T.text : T.sub,
        fontSize: 14,
        cursor: "pointer",
        lineHeight: 1.4,
        transition: "all 0.15s ease",
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  );
}

function NextBtn({
  onClick, disabled = false, label = "Continue →",
}: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "18px",
        borderRadius: 16,
        background: disabled ? "rgba(255,255,255,0.08)" : T.text,
        color: disabled ? T.muted : "#050510",
        fontSize: 16,
        fontWeight: 600,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}

function SliderRow({
  label, value, onChange, min = 1, max = 10, mb = 24,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; mb?: number }) {
  return (
    <div style={{ marginBottom: mb }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 15, color: T.text }}>{label}</span>
        <span style={{ fontSize: 24, fontWeight: 300, color: T.text, lineHeight: 1 }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "rgba(255,255,255,0.7)" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: T.muted }}>{min} — low</span>
        <span style={{ fontSize: 11, color: T.muted }}>{max} — high</span>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 16 }}>
      {children}
    </p>
  );
}

function QHeader({ label, question, sub }: { label: string; question: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: sub ? 8 : 0 }}>{question}</p>
      {sub && <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

// ── Insight card colors ────────────────────────────────────────────────────────

const SEEN_COLOR = "#8B7ED8";
const HELD_COLOR = "#5B9BD5";
const MOVED_COLOR = "#4A8C6E";

// ── Main component ─────────────────────────────────────────────────────────────

export default function CheckPage() {
  const router = useRouter();

  // ── Form state ──
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<DreamIntake>({
    title: "",
    category: "",
    category_other: "",
    years_delayed: "",
    importance: 5,
    pain: 5,
    fear: 5,
  });
  const [resistance, setResistance] = useState<ResistanceAnswers>({
    emotion: "",
    emotion_other: "",
    first_thought: "",
    first_thought_other: "",
    stuck_point: "",
    stuck_point_other: "",
    protecting: "",
    protecting_other: "",
    guaranteed_hesitate: "",
  });
  const [reality, setReality] = useState<RealityAnswers>({
    physical_constraint: "",
    time_realistic: "",
    sacrifice: [],
    responsibility_conflict: null,
    realistic_years: "",
    willing_to_commit: null,
    true_want: "",
    true_want_other: "",
    without_reward: null,
  });

  // ── Insight state ──
  const [showInsight, setShowInsight] = useState(false);
  const [savedDreamId, setSavedDreamId] = useState<string>("");
  const [insight, setInsight] = useState<InsightSummary | null>(null);
  const [expandedCard, setExpandedCard] = useState<"seen" | "held" | "moved" | null>(null);

  // ── Name It microinteraction ──
  const [nameItPhase, setNameItPhase] = useState<null | "thinking" | "confirmed">(null);
  const nameItTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmedTitleRef = useRef("");   // the title value when feedback was last shown
  const titleValueRef = useRef("");        // always-current input value (avoids stale closure)

  // ── Save and generate insight ──
  function saveAndFinish() {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const archetype = determineArchetype(resistance);
    const stuck_phase = determineStuckPhase(
      resistance.stuck_point as Parameters<typeof determineStuckPhase>[0]
    );
    const classification = classifyDream(intake, resistance, reality);
    const micro_steps = getMicroSteps(archetype, intake.title, intake.category);

    const dreamToSave: Dream = {
      id,
      title: intake.title,
      category: intake.category || "Other",
      category_other: intake.category_other,
      years_delayed: intake.years_delayed,
      importance: intake.importance,
      pain: intake.pain,
      fear: intake.fear,
      emotion: resistance.emotion,
      emotion_other: resistance.emotion_other,
      first_thought: resistance.first_thought,
      first_thought_other: resistance.first_thought_other,
      stuck_point: resistance.stuck_point,
      stuck_point_other: resistance.stuck_point_other,
      protecting: resistance.protecting,
      protecting_other: resistance.protecting_other,
      guaranteed_hesitate: resistance.guaranteed_hesitate,
      physical_constraint: reality.physical_constraint,
      time_realistic: reality.time_realistic,
      sacrifice: reality.sacrifice,
      responsibility_conflict: reality.responsibility_conflict ?? false,
      realistic_years: reality.realistic_years,
      willing_to_commit: reality.willing_to_commit ?? false,
      true_want: reality.true_want,
      true_want_other: reality.true_want_other,
      without_reward: reality.without_reward ?? false,
      archetype,
      stuck_phase,
      classification,
      micro_steps,
      status: "active",
      created_at: now,
      updated_at: now,
    };

    const generatedInsight = generateInsight(dreamToSave);
    dreamToSave.insight_summary = generatedInsight;

    saveDream(dreamToSave);
    setSavedDreamId(id);
    setInsight(generatedInsight);
    setShowInsight(true);
  }

  // ── Navigation helpers ──
  function next() {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else saveAndFinish();
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  // Trigger the "thinking → confirmed" micro-sequence after Name It is completed.
  // Accepts the current raw input value to avoid stale-closure issues.
  function triggerNameItFeedback(currentValue: string) {
    const title = currentValue.trim();
    if (!title || title === confirmedTitleRef.current) return;
    if (nameItTimerRef.current) clearTimeout(nameItTimerRef.current);
    setNameItPhase("thinking");
    nameItTimerRef.current = setTimeout(() => {
      setNameItPhase("confirmed");
      confirmedTitleRef.current = title;
    }, 750);
  }

  // ── Can we proceed from current step? ──
  function canProceed(): boolean {
    // Step 0: combined intake page — need title, category, and years_delayed
    if (step === 0) {
      return (
        intake.title.trim().length > 0 &&
        intake.category !== "" &&
        intake.years_delayed !== ""
      );
    }

    // Resistance steps (1–5)
    if (step === 1) return resistance.emotion !== "";
    if (step === 2) return resistance.first_thought !== "";
    if (step === 3) return resistance.stuck_point !== "";
    if (step === 4) return resistance.protecting !== "";
    if (step === 5) return resistance.guaranteed_hesitate !== "";

    // Reality steps (6–13)
    const rIdx = step - TOTAL_INTAKE - TOTAL_RESISTANCE;
    const q = REALITY_QUESTIONS[rIdx];
    if (!q) return true;
    if (q.kind === "single") return reality[q.field] !== "";
    if (q.kind === "multi") return true;
    if (q.kind === "bool") return reality[q.field] !== null;
    if (q.kind === "text") return reality[q.field].toString().trim().length > 0;
    return true;
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  // ── Phase label ──
  let phaseLabel = "About the Dream";
  if (step >= TOTAL_INTAKE && step < TOTAL_INTAKE + TOTAL_RESISTANCE) phaseLabel = "The Resistance";
  if (step >= TOTAL_INTAKE + TOTAL_RESISTANCE) phaseLabel = "The Reality";

  // ── INSIGHT SCREEN ──────────────────────────────────────────────────────────

  if (showInsight && insight) {
    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 8 }}>
            Dream Coach · Insight
          </p>
          <p style={{ fontSize: 22, fontWeight: 300, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>
            Here&apos;s what we see.
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Three honest things, before the first step.
          </p>
        </div>

        {/* Cards */}
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* SEEN */}
            <div
              style={{ background: `rgba(139,126,216,0.08)`, border: `1px solid ${SEEN_COLOR}30`, borderRadius: 16, padding: "18px", cursor: "pointer" }}
              onClick={() => setExpandedCard(expandedCard === "seen" ? null : "seen")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, color: SEEN_COLOR }}>◉</span>
                  <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: SEEN_COLOR, fontWeight: 600, margin: 0 }}>Seen</p>
                </div>
                <span style={{ fontSize: 12, color: T.muted }}>{expandedCard === "seen" ? "↑" : "↓"}</span>
              </div>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.65, margin: 0, display: expandedCard === "seen" ? "block" : "-webkit-box", WebkitLineClamp: expandedCard === "seen" ? undefined : 3, WebkitBoxOrient: expandedCard === "seen" ? undefined : "vertical" as const, overflow: expandedCard === "seen" ? "visible" : "hidden" } as React.CSSProperties}>
                {insight.seen}
              </p>
            </div>

            {/* HELD */}
            <div
              style={{ background: `rgba(91,155,213,0.08)`, border: `1px solid ${HELD_COLOR}30`, borderRadius: 16, padding: "18px", cursor: "pointer" }}
              onClick={() => setExpandedCard(expandedCard === "held" ? null : "held")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, color: HELD_COLOR }}>◌</span>
                  <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: HELD_COLOR, fontWeight: 600, margin: 0 }}>Held</p>
                </div>
                <span style={{ fontSize: 12, color: T.muted }}>{expandedCard === "held" ? "↑" : "↓"}</span>
              </div>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.65, margin: 0, display: expandedCard === "held" ? "block" : "-webkit-box", WebkitLineClamp: expandedCard === "held" ? undefined : 3, WebkitBoxOrient: expandedCard === "held" ? undefined : "vertical" as const, overflow: expandedCard === "held" ? "visible" : "hidden" } as React.CSSProperties}>
                {insight.held}
              </p>
            </div>

            {/* MOVED */}
            <div style={{ background: `rgba(74,140,110,0.08)`, border: `1px solid ${MOVED_COLOR}30`, borderRadius: 16, padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: MOVED_COLOR }}>◆</span>
                <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: MOVED_COLOR, fontWeight: 600, margin: 0 }}>Moved</p>
              </div>
              <p style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>One action. Under 10 minutes.</p>
              <div style={{ background: "rgba(74,140,110,0.12)", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.65, margin: 0 }}>{insight.moved}</p>
              </div>
              <p style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Or, the doorway:</p>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>{insight.moved_doorway}</p>
              </div>
            </div>

            {/* Philosophy line */}
            <div style={{ padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0, fontStyle: "italic", textAlign: "center" as const }}>
                &ldquo;{insight.philosophy_line}&rdquo;
              </p>
            </div>

            {/* CTA */}
            <div style={{ paddingTop: 8, paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 8px)", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => router.push(`/coach/${savedDreamId}`)}
                style={{ width: "100%", padding: "18px", borderRadius: 16, background: T.text, color: "#050510", fontSize: 16, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                Begin your coaching journey →
              </button>
              <button
                onClick={() => router.push(`/results/${savedDreamId}`)}
                style={{ width: "100%", padding: "14px", borderRadius: 16, background: "transparent", color: T.muted, fontSize: 13, border: "none", cursor: "pointer" }}
              >
                View full assessment
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── ASSESSMENT SCREEN ────────────────────────────────────────────────────────

  return (
    <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 16px) 24px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500 }}>
            {phaseLabel}
          </p>
          <p style={{ fontSize: 11, color: T.muted }}>{step + 1} / {TOTAL_STEPS}</p>
        </div>
        {/* Progress — segmented dashes, below the label */}
        <ProgressBar current={step + 1} total={TOTAL_STEPS} />
      </div>

      {/* Step content */}
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

        {/* ── STEP 0: Combined intake page ── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

            {/* Title + input */}
            <div>
              <p style={{ fontSize: 26, fontWeight: 300, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>
                What have you been putting off?
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 22 }}>
                Be specific. Vagueness protects the fantasy.
              </p>
              <SectionLabel>Name it</SectionLabel>
              <input
                type="text"
                value={intake.title}
                onChange={(e) => {
                  titleValueRef.current = e.target.value;
                  setIntake({ ...intake, title: e.target.value });
                  // Reset feedback if user edits after confirming
                  if (nameItPhase !== null) setNameItPhase(null);
                }}
                onBlur={(e) => triggerNameItFeedback(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") triggerNameItFeedback(e.currentTarget.value); }}
                placeholder="e.g. Write a book, launch a business, start the film, release your music..."
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: T.text,
                  fontSize: 14,
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box" as const,
                }}
              />

              {/* ── Name It microinteraction ── */}
              {nameItPhase === "thinking" && (
                <div style={{ display: "flex", gap: 5, marginTop: 12, paddingLeft: 2, alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: T.muted,
                        animation: `db-dot-pulse 1.2s ease-in-out ${i * 0.22}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
              {nameItPhase === "confirmed" && (
                <p style={{
                  fontSize: 12,
                  color: T.muted,
                  lineHeight: 1.5,
                  marginTop: 12,
                  animation: "db-confirm-in 0.35s ease forwards",
                }}>
                  Good. Now let&apos;s look at why it hasn&apos;t happened.
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <SectionLabel>Category</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {CATEGORIES.map((cat) => (
                  <PillBtn
                    key={cat}
                    label={cat}
                    selected={intake.category === cat}
                    onClick={() => {
                      setIntake({ ...intake, category: cat as typeof intake.category, category_other: "" });
                      triggerNameItFeedback(titleValueRef.current);
                    }}
                  />
                ))}
              </div>
              {intake.category === "Other" && (
                <input
                  type="text"
                  value={intake.category_other || ""}
                  onChange={(e) => setIntake({ ...intake, category_other: e.target.value })}
                  placeholder="Describe it..."
                  style={{ marginTop: 8, width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                />
              )}
            </div>

            {/* Years delayed */}
            <div>
              <SectionLabel>How long have you wanted this?</SectionLabel>
              {/* Row 1: first 4 equal-width */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 6 }}>
                {YEARS_OPTIONS.slice(0, 4).map((y) => (
                  <button
                    key={y}
                    onClick={() => setIntake({ ...intake, years_delayed: y as typeof intake.years_delayed })}
                    style={{
                      padding: "9px 4px",
                      borderRadius: 10,
                      border: intake.years_delayed === y ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
                      background: intake.years_delayed === y ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                      color: intake.years_delayed === y ? T.text : T.sub,
                      fontSize: 12,
                      cursor: "pointer",
                      lineHeight: 1.4,
                      transition: "all 0.15s ease",
                      textAlign: "center" as const,
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
              {/* Row 2: 15+ years full-width */}
              <button
                onClick={() => setIntake({ ...intake, years_delayed: "15+ years" as typeof intake.years_delayed })}
                style={{
                  width: "100%",
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: intake.years_delayed === "15+ years" ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
                  background: intake.years_delayed === "15+ years" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                  color: intake.years_delayed === "15+ years" ? T.text : T.sub,
                  fontSize: 12,
                  cursor: "pointer",
                  lineHeight: 1.4,
                  transition: "all 0.15s ease",
                  textAlign: "center" as const,
                }}
              >
                15+ years
              </button>

              {/* Day-count card */}
              {intake.years_delayed !== "" && (
                <div style={{
                  marginTop: 18,
                  padding: "18px 20px",
                  borderRadius: 12,
                  background: "rgba(8, 8, 20, 0.7)",
                  border: "1px solid rgba(150, 165, 210, 0.12)",
                  textAlign: "center" as const,
                }}>
                  <p style={{ fontSize: 11, color: T.muted, marginBottom: 8, letterSpacing: "0.02em" }}>
                    You&apos;ve carried this for approximately
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 300, color: T.text, lineHeight: 1.1, marginBottom: 8 }}>
                    {yearsToApproxDays(intake.years_delayed).toLocaleString()} days
                  </p>
                  <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, margin: 0 }}>
                    That&apos;s not laziness. That&apos;s something worth understanding.
                  </p>
                </div>
              )}
            </div>

            {/* Signal sliders */}
            <div>
              <SliderRow
                label="How much does this matter to you?"
                value={intake.importance}
                onChange={(v) => setIntake({ ...intake, importance: v })}
                mb={40}
              />
              <SliderRow
                label="How much does not doing it hurt?"
                value={intake.pain}
                onChange={(v) => setIntake({ ...intake, pain: v })}
                mb={40}
              />
              <SliderRow
                label="How afraid are you of actually doing it?"
                value={intake.fear}
                onChange={(v) => setIntake({ ...intake, fear: v })}
                mb={4}
              />
            </div>

          </div>
        )}

        {/* ── STEP 1: Emotion ── */}
        {step === 1 && (
          <div>
            <QHeader
              label="The resistance"
              question="When you think about this dream, what comes up emotionally?"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {EMOTION_OPTIONS.map((o) => (
                <ChipBtn
                  key={o.v}
                  label={o.l}
                  selected={resistance.emotion === o.v}
                  onClick={() => setResistance({ ...resistance, emotion: o.v as typeof resistance.emotion, emotion_other: "" })}
                />
              ))}
            </div>
            {resistance.emotion === "other" && (
              <input
                value={resistance.emotion_other || ""}
                onChange={(e) => setResistance({ ...resistance, emotion_other: e.target.value })}
                placeholder="Describe the feeling..."
                style={{ marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
              />
            )}
          </div>
        )}

        {/* ── STEP 2: First thought ── */}
        {step === 2 && (
          <div>
            <QHeader
              label="The resistance"
              question="When you imagine starting, what's the first thought that stops you?"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {THOUGHT_OPTIONS.map((o) => (
                <ChipBtn
                  key={o.v}
                  label={o.l}
                  selected={resistance.first_thought === o.v}
                  onClick={() => setResistance({ ...resistance, first_thought: o.v as typeof resistance.first_thought, first_thought_other: "" })}
                />
              ))}
            </div>
            {resistance.first_thought === "other" && (
              <input
                value={resistance.first_thought_other || ""}
                onChange={(e) => setResistance({ ...resistance, first_thought_other: e.target.value })}
                placeholder="Describe it..."
                style={{ marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
              />
            )}
          </div>
        )}

        {/* ── STEP 3: Stuck point ── */}
        {step === 3 && (
          <div>
            <QHeader
              label="The resistance"
              question="Where do you most get stuck?"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STUCK_OPTIONS.map((o) => (
                <ChipBtn
                  key={o.v}
                  label={o.l}
                  selected={resistance.stuck_point === o.v}
                  onClick={() => setResistance({ ...resistance, stuck_point: o.v as typeof resistance.stuck_point, stuck_point_other: "" })}
                />
              ))}
            </div>
            {resistance.stuck_point === "other" && (
              <input
                value={resistance.stuck_point_other || ""}
                onChange={(e) => setResistance({ ...resistance, stuck_point_other: e.target.value })}
                placeholder="Describe it..."
                style={{ marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
              />
            )}
          </div>
        )}

        {/* ── STEP 4: Protecting ── */}
        {step === 4 && (
          <div>
            <QHeader
              label="The resistance"
              question="What do you think the resistance is protecting?"
              sub="This isn't a trick question — protection is real."
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PROTECT_OPTIONS.map((o) => (
                <ChipBtn
                  key={o.v}
                  label={o.l}
                  selected={resistance.protecting === o.v}
                  onClick={() => setResistance({ ...resistance, protecting: o.v as typeof resistance.protecting, protecting_other: "" })}
                />
              ))}
            </div>
            {resistance.protecting === "other" && (
              <input
                value={resistance.protecting_other || ""}
                onChange={(e) => setResistance({ ...resistance, protecting_other: e.target.value })}
                placeholder="Describe it..."
                style={{ marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
              />
            )}
          </div>
        )}

        {/* ── STEP 5: Guaranteed hesitate ── */}
        {step === 5 && (
          <div>
            <QHeader
              label="The resistance"
              question="If success were guaranteed, would you still hesitate?"
              sub="Be honest. There's no wrong answer here."
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ChipBtn
                label="Yes — I'd still hesitate"
                selected={resistance.guaranteed_hesitate === "yes"}
                onClick={() => setResistance({ ...resistance, guaranteed_hesitate: "yes" })}
              />
              <ChipBtn
                label="No — I'd start immediately"
                selected={resistance.guaranteed_hesitate === "no"}
                onClick={() => setResistance({ ...resistance, guaranteed_hesitate: "no" })}
              />
            </div>
          </div>
        )}

        {/* ── REALITY STEPS (6–13) ── */}
        {step >= TOTAL_INTAKE + TOTAL_RESISTANCE && (() => {
          const rIdx = step - TOTAL_INTAKE - TOTAL_RESISTANCE;
          const q = REALITY_QUESTIONS[rIdx];
          if (!q) return null;

          if (q.kind === "single") {
            return (
              <div>
                <QHeader label="The reality" question={q.question} sub={q.sub} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {q.options.map((o) => (
                    <ChipBtn
                      key={o.v}
                      label={o.l}
                      selected={reality[q.field] === o.v}
                      onClick={() => setReality({ ...reality, [q.field]: o.v })}
                    />
                  ))}
                </div>
                {q.field === "true_want" && reality.true_want === "other" && (
                  <input
                    value={reality.true_want_other || ""}
                    onChange={(e) => setReality({ ...reality, true_want_other: e.target.value })}
                    placeholder="Describe what you want..."
                    style={{ marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                  />
                )}
              </div>
            );
          }

          if (q.kind === "multi") {
            const currentSacrifice = reality.sacrifice as SacrificeType[];
            return (
              <div>
                <QHeader label="The reality" question={q.question} sub={q.sub} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {q.options.map((o) => {
                    const selected = currentSacrifice.includes(o.v);
                    return (
                      <ChipBtn
                        key={o.v}
                        label={o.l}
                        selected={selected}
                        onClick={() => {
                          const next = selected
                            ? currentSacrifice.filter((x) => x !== o.v)
                            : [...currentSacrifice, o.v];
                          setReality({ ...reality, sacrifice: next });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          }

          if (q.kind === "bool") {
            return (
              <div>
                <QHeader label="The reality" question={q.question} sub={q.sub} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <ChipBtn
                    label={q.yesLabel || "Yes"}
                    selected={reality[q.field] === true}
                    onClick={() => setReality({ ...reality, [q.field]: true })}
                  />
                  <ChipBtn
                    label={q.noLabel || "No"}
                    selected={reality[q.field] === false}
                    onClick={() => setReality({ ...reality, [q.field]: false })}
                  />
                </div>
              </div>
            );
          }

          if (q.kind === "text") {
            const fieldVal = reality[q.field] as string;
            return (
              <div>
                <QHeader label="The reality" question={q.question} sub={q.sub} />
                <input
                  value={fieldVal}
                  onChange={(e) => setReality({ ...reality, [q.field]: e.target.value })}
                  placeholder={q.placeholder || ""}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 15, outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            );
          }

          return null;
        })()}

      </div>

      {/* Footer nav */}
      <div style={{ padding: "16px 24px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 20px)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: 10, background: T.bg }}>
        <NextBtn
          onClick={next}
          disabled={!canProceed()}
          label={isLastStep ? "See your insight →" : step === 0 ? "Let's go deeper →" : "Continue →"}
        />
        {step > 0 && (
          <button
            onClick={back}
            style={{ width: "100%", padding: "12px", borderRadius: 16, background: "transparent", color: T.muted, fontSize: 13, border: "none", cursor: "pointer" }}
          >
            ← Back
          </button>
        )}
      </div>
    </main>
  );
}
