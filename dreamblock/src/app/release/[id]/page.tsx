"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDream, updateDream, awardBadge, logEvent } from "@/lib/storage";

// ── Theme ──────────────────────────────────────────────────────────────────────

const T = {
  bg: "var(--db-bg)",
  surface: "var(--db-surface)",
  border: "var(--db-border)",
  text: "var(--db-text)",
  sub: "var(--db-sub)",
  muted: "var(--db-muted)",
};

// ── Step constants ─────────────────────────────────────────────────────────────

const STEP_ENTRY    = 0;
const STEP_TRUTH    = 1;
const STEP_HOLDING  = 2;
const STEP_INSIGHT  = 3;
const STEP_CHOICE   = 4;
const STEP_RITUAL   = 5;
const STEP_CONFIRM  = 6;

// ── Truth options ──────────────────────────────────────────────────────────────

const TRUTH_OPTIONS = [
  { v: "not_ready",      l: "I'm not ready right now, but I still want this." },
  { v: "fear_quality",   l: "I'm afraid it won't be good enough." },
  { v: "unsure_want",    l: "I'm not sure I actually want this anymore." },
  { v: "others_dream",   l: "Someone else wanted this for me." },
  { v: "safer_as_dream", l: "It feels safer as a dream than as a reality." },
  { v: "fear_success",   l: "I'm afraid of what happens if it succeeds." },
  { v: "costs_too_much", l: "It would cost too much of my current life." },
  { v: "already_decided",l: "I've already decided — I just needed permission." },
];

// ── Holding-on options ─────────────────────────────────────────────────────────

const HOLDING_OPTIONS = [
  { v: "identity",    l: "My sense of who I am includes this dream." },
  { v: "defeat",      l: "Setting it down feels like admitting defeat." },
  { v: "without",     l: "I'm afraid of who I'd be without this dream." },
  { v: "long_story",  l: "It's been part of my story for so long." },
  { v: "circumstances", l: "I keep hoping circumstances will change." },
  { v: "emptiness",   l: "I'm afraid of the emptiness it would leave." },
];

// ── Insight generator ──────────────────────────────────────────────────────────

const TRUTH_SEEN: Record<string, string> = {
  not_ready:
    "You haven't given up — you've recognized that timing matters. This dream is real for you. Right now just isn't the right now.",
  fear_quality:
    "The dream lives inside a standard you've set for yourself. The fear isn't that you'll fail — it's that what you create won't match the vision in your mind.",
  unsure_want:
    "Something has shifted. What once felt urgent may have been speaking to a version of you that has since changed. That's not betrayal — it's growth.",
  others_dream:
    "You may have been carrying something that was handed to you — a parent's hope, a partner's expectation, a version of success absorbed from somewhere else.",
  safer_as_dream:
    "The dream has been doing something useful: keeping possibility open. As long as it's unstarted, it can't disappoint. But it also can't become real.",
  fear_success:
    "You can see it working — and that scares you. Success would change things: your life, your identity, your relationships. The fear is real and intelligent.",
  costs_too_much:
    "You've done an honest cost-benefit calculation. This dream would require something you're not willing to trade right now. That's not failure — it's clarity about what you actually value.",
  already_decided:
    "You already knew. This process just made it formal. There's something honest about naming a decision you've already made inside yourself.",
};

const HOLDING_HELD: Record<string, string> = {
  identity:
    "The dream has become part of how you define yourself. Setting it down doesn't change who you are — but it may feel that way for a while, which is worth acknowledging.",
  defeat:
    "Choosing to set something down isn't defeat. Defeat is continuing without intention. What you're doing — examining what you're stepping away from, and why — is the opposite.",
  without:
    "The dream has been a compass pointing toward something. Without it, the direction may feel unclear. But what you're looking for might arrive through a different door.",
  long_story:
    "Longevity creates attachment. The longer a dream has been with you, the more it feels like a piece of your history — and releasing it can feel like loss.",
  circumstances:
    "Waiting for the right conditions is reasonable — until it becomes the permanent story. At some point, the waiting itself becomes a kind of decision.",
  emptiness:
    "Something worth sitting with: what would fill that space? The answer to that question might be pointing toward what actually wants to happen next.",
};

function generateInsight(
  truth: string,
  holding: string
): { seen: string; held: string; philosophy: string } {
  const seen =
    TRUTH_SEEN[truth] ||
    "You've been honest enough to pause. That takes more clarity than most people allow themselves.";
  const held =
    HOLDING_HELD[holding] ||
    "There's something worth honoring in the difficulty of letting go. It means the dream was real.";
  const philosophy =
    truth === "not_ready"
      ? "Timing is not the same as giving up."
      : truth === "others_dream"
      ? "You are allowed to put down what was never yours to carry."
      : holding === "defeat"
      ? "Discernment is not the same as quitting."
      : holding === "identity"
      ? "You are not your unfinished things."
      : "Clarity is lighter than carrying unfinished things.";
  return { seen, held, philosophy };
}

// ── Reflection prompts (ritual step) ──────────────────────────────────────────

const RITUAL_PROMPTS = [
  {
    prompt: "This dream taught me...",
    placeholder: "What did carrying this reveal about you?",
  },
  {
    prompt: "I no longer need to carry...",
    placeholder: "What belief, pressure, or expectation can you set down?",
  },
  {
    prompt: "The energy freed goes to...",
    placeholder: "Where does this attention flow now?",
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 18 : 6,
            height: 6,
            borderRadius: 3,
            background:
              i < current
                ? "rgba(210,220,248,0.7)"
                : i === current
                ? "rgba(210,220,248,0.9)"
                : "rgba(160,175,220,0.2)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontSize: 10,
        letterSpacing: "0.15em",
        textTransform: "uppercase" as const,
        color: T.muted,
        fontWeight: 500,
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  );
}

function ChipBtn({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        border: selected
          ? "1px solid rgba(255,255,255,0.4)"
          : "1px solid rgba(255,255,255,0.08)",
        background: selected
          ? "rgba(255,255,255,0.1)"
          : "rgba(255,255,255,0.02)",
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

function NextBtn({
  onClick,
  disabled = false,
  label = "Continue →",
  quiet = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  quiet?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "17px",
        borderRadius: 16,
        background: disabled
          ? "rgba(255,255,255,0.05)"
          : quiet
          ? "rgba(255,255,255,0.07)"
          : T.text,
        color: disabled
          ? T.muted
          : quiet
          ? T.sub
          : "#050510",
        fontSize: 15,
        fontWeight: quiet ? 400 : 600,
        border: quiet ? "1px solid rgba(255,255,255,0.1)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ReleasePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const dreamId = params.id;

  const [step, setStep] = useState(STEP_ENTRY);
  const [truth, setTruth] = useState("");
  const [holding, setHolding] = useState("");
  const [choice, setChoice] = useState<"rest" | "archive" | "shrink" | "">("");
  const [ritualAnswers, setRitualAnswers] = useState(["", "", ""]);
  const [ritualStep, setRitualStep] = useState(0);
  const [done, setDone] = useState(false);

  // Load dream title for personalisation (best-effort)
  const dream = getDream(dreamId);
  const dreamTitle = dream?.title ?? "this dream";

  // ── Insight (computed when truth + holding are set) ──
  const insight =
    truth && holding ? generateInsight(truth, holding) : null;

  // ── Confirm handler ──
  function handleConfirm() {
    const now = new Date().toISOString();
    if (choice === "rest") {
      updateDream(dreamId, { status: "paused", released_at: now });
      logEvent("dream_released", dreamId, { type: "rest" });
    } else if (choice === "archive") {
      updateDream(dreamId, {
        status: "released",
        released_at: now,
        release_reflection: {
          taught_me: ritualAnswers[0],
          no_longer_carry: ritualAnswers[1],
          energy_goes_to: ritualAnswers[2],
        },
      });
      awardBadge(dreamId, "dream_released");
      logEvent("dream_released", dreamId, { type: "archive" });
    }
    setDone(true);
  }

  // ── DONE screen (post-confirm) ──
  if (done) {
    const restDate = new Date();
    restDate.setDate(restDate.getDate() + 30);
    const returnLabel = restDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });

    return (
      <main
        style={{
          background: T.bg,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          maxWidth: 430,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 40,
            marginBottom: 28,
            opacity: 0.7,
          }}
        >
          {choice === "archive" ? "✧" : "◌"}
        </div>

        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
            color: T.muted,
            fontWeight: 500,
            marginBottom: 14,
          }}
        >
          {choice === "archive" ? "Dream Released" : "Dream Resting"}
        </p>

        <p
          style={{
            fontSize: 24,
            fontWeight: 300,
            color: T.text,
            lineHeight: 1.3,
            marginBottom: 14,
          }}
        >
          {choice === "archive"
            ? "Released."
            : "Set down for 30 days."}
        </p>

        <p
          style={{
            fontSize: 14,
            color: T.sub,
            lineHeight: 1.7,
            marginBottom: 10,
            maxWidth: 300,
          }}
        >
          {choice === "archive"
            ? `"${dreamTitle}" is complete — not because you finished it, but because you chose to let it go with intention.`
            : `"${dreamTitle}" is resting. You'll be reminded to revisit it around ${returnLabel}.`}
        </p>

        <p
          style={{
            fontSize: 13,
            color: T.muted,
            lineHeight: 1.6,
            marginBottom: 40,
            maxWidth: 280,
          }}
        >
          {choice === "archive"
            ? "The energy you were holding is now free."
            : "If clarity arrives before then, you can return any time."}
        </p>

        {choice === "rest" && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 32,
              maxWidth: 280,
              width: "100%",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: T.muted,
                textTransform: "uppercase" as const,
                letterSpacing: "0.12em",
                marginBottom: 8,
              }}
            >
              Notice, over the next 30 days
            </p>
            <p
              style={{
                fontSize: 13,
                color: T.sub,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Does this dream come back on its own?
              Do you feel relief, or regret?
              What fills the space it left?
            </p>
          </div>
        )}

        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "14px 32px",
            borderRadius: 12,
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            color: T.sub,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Return to Dashboard
        </button>
      </main>
    );
  }

  // ── STEP 0: Entry ──────────────────────────────────────────────────────────

  if (step === STEP_ENTRY) {
    return (
      <main
        style={{
          background: T.bg,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: "calc(env(safe-area-inset-top,0px) + 24px) 24px calc(env(safe-area-inset-bottom,0px) + 24px)",
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: T.muted,
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
            marginBottom: 40,
            alignSelf: "flex-start",
          }}
        >
          ← Back
        </button>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <SectionLabel>Dream Release</SectionLabel>

          <p
            style={{
              fontSize: 26,
              fontWeight: 300,
              color: T.text,
              lineHeight: 1.3,
              marginBottom: 20,
            }}
          >
            Before you walk away, understand why.
          </p>

          <p
            style={{
              fontSize: 14,
              color: T.sub,
              lineHeight: 1.75,
              marginBottom: 12,
            }}
          >
            You&apos;ve acknowledged that this dream doesn&apos;t fit right now.
            That&apos;s honest. Before you decide what to do with it, this short process
            will help you understand what it&apos;s been about — so you can either
            release it clearly, or return to it with fresh eyes.
          </p>

          <p
            style={{
              fontSize: 13,
              color: T.muted,
              lineHeight: 1.6,
              marginBottom: 0,
            }}
          >
            ~4 minutes · Private · Nothing is permanent yet
          </p>
        </div>

        <div style={{ paddingTop: 32 }}>
          <NextBtn onClick={() => setStep(STEP_TRUTH)} label="Explore this →" />
        </div>
      </main>
    );
  }

  // ── STEP 1: Truth ──────────────────────────────────────────────────────────

  if (step === STEP_TRUTH) {
    return (
      <main
        style={{
          background: T.bg,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={1} total={7} />
          <SectionLabel>The honesty</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>
            Which of these feels most true right now?
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            About why you&apos;re not pursuing &ldquo;{dreamTitle}&rdquo;.
          </p>
        </div>

        <div
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {TRUTH_OPTIONS.map((opt) => (
              <ChipBtn
                key={opt.v}
                label={opt.l}
                selected={truth === opt.v}
                onClick={() => setTruth(opt.v)}
              />
            ))}
          </div>

          <NextBtn
            onClick={() => setStep(STEP_HOLDING)}
            disabled={truth === ""}
          />
        </div>
      </main>
    );
  }

  // ── STEP 2: Holding on ─────────────────────────────────────────────────────

  if (step === STEP_HOLDING) {
    return (
      <main
        style={{
          background: T.bg,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={2} total={7} />
          <SectionLabel>The attachment</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>
            What might be making this hard to set down?
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            There&apos;s no wrong answer. Honesty is the point.
          </p>
        </div>

        <div
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {HOLDING_OPTIONS.map((opt) => (
              <ChipBtn
                key={opt.v}
                label={opt.l}
                selected={holding === opt.v}
                onClick={() => setHolding(opt.v)}
              />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn
              onClick={() => setStep(STEP_INSIGHT)}
              disabled={holding === ""}
            />
            <button
              onClick={() => setStep(STEP_TRUTH)}
              style={{
                background: "none",
                border: "none",
                color: T.muted,
                fontSize: 13,
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── STEP 3: Insight ────────────────────────────────────────────────────────

  if (step === STEP_INSIGHT && insight) {
    const SEEN_C = "#8B7ED8";
    const HELD_C = "#5B9BD5";

    return (
      <main
        style={{
          background: T.bg,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={3} total={7} />
          <SectionLabel>What we see</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>
            Here&apos;s a reflection.
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Read this before you decide what happens next.
          </p>
        </div>

        <div
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {/* SEEN card */}
            <div
              style={{
                background: "rgba(139,126,216,0.08)",
                border: `1px solid ${SEEN_C}28`,
                borderRadius: 16,
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: SEEN_C }}>◉</span>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase" as const,
                    color: SEEN_C,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Seen
                </p>
              </div>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, margin: 0 }}>
                {insight.seen}
              </p>
            </div>

            {/* HELD card */}
            <div
              style={{
                background: "rgba(91,155,213,0.08)",
                border: `1px solid ${HELD_C}28`,
                borderRadius: 16,
                padding: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: HELD_C }}>◌</span>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase" as const,
                    color: HELD_C,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Held
                </p>
              </div>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, margin: 0 }}>
                {insight.held}
              </p>
            </div>

            {/* Philosophy line */}
            <div
              style={{
                padding: "14px 0",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: T.muted,
                  lineHeight: 1.6,
                  margin: 0,
                  fontStyle: "italic",
                  textAlign: "center" as const,
                }}
              >
                &ldquo;{insight.philosophy}&rdquo;
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn
              onClick={() => setStep(STEP_CHOICE)}
              label="Decide what happens next →"
            />
            <button
              onClick={() => setStep(STEP_HOLDING)}
              style={{
                background: "none",
                border: "none",
                color: T.muted,
                fontSize: 13,
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── STEP 4: Choice ─────────────────────────────────────────────────────────

  if (step === STEP_CHOICE) {
    const CHOICE_OPTIONS = [
      {
        v: "rest" as const,
        label: "Rest for 30 days",
        sub: "Step back. Come back in a month to see if this still belongs to you.",
        icon: "◌",
      },
      {
        v: "archive" as const,
        label: "Archive with dignity",
        sub: "Release it intentionally. Not abandoned — concluded.",
        icon: "✧",
      },
      {
        v: "shrink" as const,
        label: "Shrink it to 5 minutes",
        sub: "Give it a smaller door. Just 5 minutes a day to begin.",
        icon: "◆",
      },
    ];

    return (
      <main
        style={{
          background: T.bg,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={4} total={7} />
          <SectionLabel>The decision</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>
            What do you want to do with this dream?
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            None of these are permanent. All of them are honest.
          </p>
        </div>

        <div
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {CHOICE_OPTIONS.map((opt) => (
              <button
                key={opt.v}
                onClick={() => setChoice(opt.v)}
                style={{
                  padding: "16px",
                  borderRadius: 14,
                  border:
                    choice === opt.v
                      ? "1px solid rgba(255,255,255,0.4)"
                      : "1px solid rgba(255,255,255,0.08)",
                  background:
                    choice === opt.v
                      ? "rgba(255,255,255,0.09)"
                      : "rgba(255,255,255,0.02)",
                  color: T.text,
                  cursor: "pointer",
                  textAlign: "left" as const,
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column" as const,
                  gap: 6,
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: T.muted }}>{opt.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: T.text }}>
                    {opt.label}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                  {opt.sub}
                </p>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn
              onClick={() => {
                if (choice === "archive") {
                  setStep(STEP_RITUAL);
                } else if (choice === "shrink") {
                  router.push(`/coach/${dreamId}`);
                } else {
                  handleConfirm();
                  setStep(STEP_CONFIRM);
                }
              }}
              disabled={choice === ""}
              label={
                choice === "shrink"
                  ? "Start with 5 minutes →"
                  : choice === "archive"
                  ? "Archive this dream →"
                  : choice === "rest"
                  ? "Set it down for 30 days →"
                  : "Continue →"
              }
            />
            <button
              onClick={() => setStep(STEP_INSIGHT)}
              style={{
                background: "none",
                border: "none",
                color: T.muted,
                fontSize: 13,
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── STEP 5: Ritual (archive only) ──────────────────────────────────────────

  if (step === STEP_RITUAL) {
    const prompt = RITUAL_PROMPTS[ritualStep];
    const canContinue = ritualAnswers[ritualStep].trim().length > 3;
    const isLastRitual = ritualStep === RITUAL_PROMPTS.length - 1;

    return (
      <main
        style={{
          background: T.bg,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          maxWidth: 430,
          margin: "0 auto",
        }}
      >
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={5} total={7} />
          <SectionLabel>{`Reflection ${ritualStep + 1} of ${RITUAL_PROMPTS.length}`}</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>
            {prompt.prompt}
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Write whatever comes. There&apos;s no right answer.
          </p>
        </div>

        <div
          className="hide-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}
        >
          <textarea
            value={ritualAnswers[ritualStep]}
            onChange={(e) => {
              const updated = [...ritualAnswers];
              updated[ritualStep] = e.target.value;
              setRitualAnswers(updated);
            }}
            placeholder={prompt.placeholder}
            rows={6}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 12,
              padding: "14px 16px",
              color: T.text,
              fontSize: 14,
              lineHeight: 1.65,
              resize: "none" as const,
              outline: "none",
              boxSizing: "border-box" as const,
              marginBottom: 20,
              fontFamily: "inherit",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn
              onClick={() => {
                if (isLastRitual) {
                  handleConfirm();
                  setStep(STEP_CONFIRM);
                } else {
                  setRitualStep(ritualStep + 1);
                }
              }}
              disabled={!canContinue}
              label={isLastRitual ? "Release this dream ✧" : "Continue →"}
            />
            <button
              onClick={() => {
                if (ritualStep > 0) setRitualStep(ritualStep - 1);
                else setStep(STEP_CHOICE);
              }}
              style={{
                background: "none",
                border: "none",
                color: T.muted,
                fontSize: 13,
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── STEP 6: Confirm (handled above via done state) ─────────────────────────
  // If we reach here and step is STEP_CONFIRM without done=true,
  // it means handleConfirm was called separately; show loading state briefly.
  return (
    <main
      style={{
        background: T.bg,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <p style={{ fontSize: 14, color: T.muted }}>Processing...</p>
    </main>
  );
}
