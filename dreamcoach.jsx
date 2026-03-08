import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// DATA MODELS
// ─────────────────────────────────────────────

const CATEGORIES = [
  "Music", "Podcast", "Art", "Business",
  "Athletic", "Writing", "Lifestyle", "Other"
];

const EMOTIONS = [
  { id: "fear", label: "Fear" },
  { id: "shame", label: "Shame" },
  { id: "overwhelm", label: "Overwhelm" },
  { id: "boredom", label: "Boredom" },
  { id: "excite_crash", label: "Excitement, then crash" },
  { id: "numbness", label: "Numbness" },
];

const FIRST_THOUGHTS = [
  { id: "not_enough", label: "I'm not good enough for this" },
  { id: "judgment", label: "People will judge me" },
  { id: "no_start", label: "I don't know where to start" },
  { id: "too_late", label: "It's too late" },
  { id: "wont_matter", label: "It won't matter anyway" },
];

const STUCK_POINTS = [
  { id: "starting", label: "Starting" },
  { id: "consistency", label: "Staying consistent" },
  { id: "finishing", label: "Finishing things" },
  { id: "publishing", label: "Putting it out there" },
  { id: "promoting", label: "Promoting / sharing it" },
  { id: "committing", label: "Committing at all" },
];

const PROTECTING = [
  { id: "comfort", label: "My comfort zone" },
  { id: "identity", label: "My sense of who I am" },
  { id: "relationships", label: "My relationships" },
  { id: "control", label: "A feeling of control" },
  { id: "certainty", label: "Certainty / predictability" },
];

// ─────────────────────────────────────────────
// ARCHETYPE ENGINE
// ─────────────────────────────────────────────

const ARCHETYPES = {
  "Fear of Visibility": {
    icon: "◉",
    tagline: "You can create. You can't be seen.",
    description: "Your work exists — but sharing it triggers something primal. Visibility feels like exposure, not expression.",
    color: "#8B7ED8",
    bg: "rgba(139,126,216,0.08)",
  },
  "Perfectionist Freeze": {
    icon: "◌",
    tagline: "Nothing is ever ready enough.",
    description: "You raise the bar every time you get close. Perfection isn't a standard — it's a delay mechanism.",
    color: "#5B9BD5",
    bg: "rgba(91,155,213,0.08)",
  },
  "Overwhelm Fog": {
    icon: "≋",
    tagline: "The scope swallows you before you begin.",
    description: "You see the whole mountain, not the next step. The gap between where you are and where you want to be feels uncrossable.",
    color: "#6B8FC5",
    bg: "rgba(107,143,197,0.08)",
  },
  "Identity Conflict": {
    icon: "⟁",
    tagline: "Who am I to do this?",
    description: "This dream doesn't fit the self-concept you currently inhabit. Pursuing it means becoming someone different — and that's terrifying.",
    color: "#9B7AAE",
    bg: "rgba(155,122,174,0.08)",
  },
  "Fear of Success": {
    icon: "◈",
    tagline: "What changes if this actually works?",
    description: "Failure is familiar. Success would reorganize your life, relationships, and identity in ways you haven't fully faced.",
    color: "#5EAA8B",
    bg: "rgba(94,170,139,0.08)",
  },
  "Shame Loop": {
    icon: "⊙",
    tagline: "Past attempts haunt this one.",
    description: "You've tried before and it didn't work. Now shame sits at the entrance. The past is preventing the present.",
    color: "#C47A5A",
    bg: "rgba(196,122,90,0.08)",
  },
  "Consistency Collapse": {
    icon: "⊿",
    tagline: "You start strong. You can't sustain.",
    description: "Initial energy is real — but something breaks at the 2-week mark. This is about systems, not willpower.",
    color: "#5AACBA",
    bg: "rgba(90,172,186,0.08)",
  },
  "Misalignment": {
    icon: "⊗",
    tagline: "This may not actually be your dream.",
    description: "Something about this draws you, but you're not sure it's really yours. It might be borrowed desire, or a symbol of something else entirely.",
    color: "#A08B5A",
    bg: "rgba(160,139,90,0.08)",
  },
};

const STUCK_PHASES = {
  starting: "First-Step Resistance",
  committing: "Preparation",
  consistency: "Momentum",
  finishing: "Pre-Publish Panic",
  publishing: "Pre-Publish Panic",
  promoting: "Pre-Publish Panic",
};

function determineArchetype(answers) {
  const { emotion, firstThought, stuckPoint, protecting, guaranteedHesitate } = answers;

  // Rule-based classification — order matters
  if (protecting === "identity") return "Identity Conflict";
  if (emotion === "shame") return "Shame Loop";
  if (emotion === "boredom" || emotion === "numbness") return "Misalignment";
  if (stuckPoint === "publishing" && emotion === "fear") return "Fear of Visibility";
  if (stuckPoint === "promoting") return "Fear of Visibility";
  if (firstThought === "not_enough" || stuckPoint === "finishing") return "Perfectionist Freeze";
  if (firstThought === "judgment") return "Fear of Visibility";
  if (emotion === "overwhelm" || firstThought === "no_start" || stuckPoint === "starting") return "Overwhelm Fog";
  if (guaranteedHesitate === "yes" && protecting === "comfort") return "Fear of Success";
  if (stuckPoint === "consistency") return "Consistency Collapse";
  if (firstThought === "too_late") return "Shame Loop";
  if (firstThought === "wont_matter") return "Misalignment";

  return "Perfectionist Freeze"; // default
}

// ─────────────────────────────────────────────
// CLASSIFICATION ENGINE
// ─────────────────────────────────────────────

const CLASSIFICATIONS = {
  "Viable & Aligned": {
    subtitle: "The path is clear. The block is internal.",
    action: "pursue",
    color: "#4A8C6E",
    bg: "rgba(74,140,110,0.10)",
    icon: "◆",
    description: "Your dream is real, it matters deeply, and the primary obstacle is psychological — not circumstantial. The work now is to move despite resistance, not to wait until it disappears.",
  },
  "Viable but Misaligned": {
    subtitle: "Right dream, wrong season.",
    action: "defer",
    color: "#7B8F6E",
    bg: "rgba(123,143,110,0.10)",
    icon: "◇",
    description: "This is real and achievable — but your current life doesn't have the structural conditions to support it. Deferring consciously is a form of respect for both the dream and your reality.",
  },
  "Symbolic / Transformable": {
    subtitle: "The dream points to something real. The form needs reshaping.",
    action: "reshape",
    color: "#7B6E8F",
    bg: "rgba(123,110,143,0.10)",
    icon: "○",
    description: "What you're chasing isn't the thing itself — it's what the thing represents: meaning, expression, identity, freedom. Those things are achievable. The specific version you're imagining may not be.",
  },
  "Unrealistic in Current Form": {
    subtitle: "Honesty is freedom. Releasing isn't failure.",
    action: "release",
    color: "#8F6E6E",
    bg: "rgba(143,110,110,0.10)",
    icon: "×",
    description: "The version of this dream you're holding cannot be reconciled with your actual life — physically, temporally, or structurally. Naming that clearly is not defeat. It's the beginning of redirecting your energy somewhere it can go.",
  },
};

function classifyDream(dream, resistanceAnswers, realityAnswers) {
  const archetype = determineArchetype(resistanceAnswers);
  const { physicalConstraint, timeRealistic, yearsWilling, withoutReward } = realityAnswers;

  // Hard gates — reality
  if (physicalConstraint === "impossible") return "Unrealistic in Current Form";
  if (physicalConstraint === "significant" && timeRealistic === "none" && yearsWilling === "no") return "Unrealistic in Current Form";
  if (timeRealistic === "none" && yearsWilling === "no") return "Unrealistic in Current Form";

  // Misalignment signals
  if (archetype === "Misalignment") return "Symbolic / Transformable";
  if (withoutReward === "no") return "Symbolic / Transformable";
  if (dream.importance <= 4 && dream.pain <= 4) return "Symbolic / Transformable";

  // Viable but wrong time
  if (timeRealistic === "none" && yearsWilling === "yes") return "Viable but Misaligned";
  if (timeRealistic === "little" && dream.importance < 7) return "Viable but Misaligned";

  // Viable and aligned
  return "Viable & Aligned";
}

// ─────────────────────────────────────────────
// MICRO-STEPS LIBRARY
// ─────────────────────────────────────────────

function getMicroSteps(archetype, dreamTitle, category) {
  const d = dreamTitle || "your project";
  const steps = {
    "Fear of Visibility": [
      `Write about ${d} in a private document — no audience, no stakes, no performance`,
      `Share one small piece of work with exactly one person you trust completely, with no expectation of feedback`,
      `Make something deliberately imperfect. Finish it. Don't show it yet — just prove to yourself you can complete`,
    ],
    "Perfectionist Freeze": [
      `Set a 25-minute timer. Work on ${d}. Stop when it rings, complete or not — the discipline is in stopping`,
      `Define "good enough to proceed" in a single sentence before you start your next session`,
      `Deliberately create a rough, unpolished version of one part. Call it your "ugly draft" and treat that as the goal`,
    ],
    "Overwhelm Fog": [
      `Write down only the very next physical action — not the project, not the phase, just the next 15 minutes`,
      `Spend 20 minutes listing everything you'd need to know or do, then circle only the first three`,
      `Find one person who has done something similar to ${d} and read or watch something about how they started`,
    ],
    "Identity Conflict": [
      `Write: "A person who does ${category} for real would..." and complete the sentence without filtering`,
      `Do one private act related to ${d} that no one will see, judge, or know about`,
      `Write about why this matters to you — not to prove it to anyone, just to understand it yourself`,
    ],
    "Fear of Success": [
      `Write the most realistic version of what your life looks like if ${d} works — including what changes and what gets harder`,
      `Identify one specific thing you'd have to give up or renegotiate if this succeeded. Sit with that honestly`,
      `Take the smallest possible forward action — something reversible, low-stakes, and private`,
    ],
    "Shame Loop": [
      `Write a short letter to yourself about the last time you tried this and stopped — without judgment, just honesty`,
      `Name the specific story you carry about why you failed before. Write it out. Then write what was actually true`,
      `Do one small thing today that reclaims forward motion — not a big step, just proof that you can move`,
    ],
    "Consistency Collapse": [
      `Commit to 15 minutes on ${d} at the same time for the next 7 days — nothing more, no exceptions`,
      `Identify the exact moment you usually quit. Write down what you'll do instead at that moment next time`,
      `Reduce friction: prepare everything you need the night before so starting costs you almost nothing`,
    ],
    "Misalignment": [
      `Write: "What I actually want from ${d} is..." and answer without using the dream itself as the answer`,
      `Separate what you want (status, feeling, identity, output) from the specific form you've attached it to`,
      `Explore one adjacent thing that gives you the same feeling — without the weight of this particular dream`,
    ],
  };
  return steps[archetype] || steps["Overwhelm Fog"];
}

// ─────────────────────────────────────────────
// DESIGN PRIMITIVES
// ─────────────────────────────────────────────

const C = {
  bg: "#080810",
  surface: "#0F0F1A",
  surface2: "#14141F",
  border: "rgba(255,255,255,0.07)",
  border2: "rgba(255,255,255,0.04)",
  text: "#E8E8F0",
  textSub: "#8888A0",
  textMuted: "#4A4A60",
  accent: "#FFFFFF",
};

const S = {
  screen: {
    background: C.bg,
    minHeight: "100vh",
    color: C.text,
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    display: "flex",
    flexDirection: "column",
    maxWidth: 430,
    margin: "0 auto",
    position: "relative",
    overflowX: "hidden",
  },
};

// UI COMPONENTS

const Label = ({ children, style = {} }) => (
  <p style={{
    fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
    color: C.textMuted, fontWeight: 500, ...style
  }}>{children}</p>
);

const OptionButton = ({ label, sublabel, selected, onClick }) => (
  <button onClick={onClick} style={{
    width: "100%", textAlign: "left", padding: "14px 16px",
    borderRadius: 14, border: `1px solid ${selected ? "rgba(255,255,255,0.5)" : C.border}`,
    background: selected ? "rgba(255,255,255,0.08)" : C.surface,
    color: selected ? C.text : C.textSub,
    fontSize: 14, cursor: "pointer", transition: "all 0.15s ease",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <span>{label}</span>
    {selected && <span style={{ color: C.textMuted, fontSize: 10 }}>✓</span>}
  </button>
);

const Chip = ({ label, selected, onClick }) => (
  <button onClick={onClick} style={{
    padding: "8px 16px", borderRadius: 100,
    border: `1px solid ${selected ? "rgba(255,255,255,0.6)" : C.border}`,
    background: selected ? "rgba(255,255,255,0.09)" : "transparent",
    color: selected ? C.text : C.textSub,
    fontSize: 13, cursor: "pointer", transition: "all 0.15s ease",
    whiteSpace: "nowrap",
  }}>{label}</button>
);

const PrimaryButton = ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: "100%", padding: "16px", borderRadius: 16,
    background: disabled ? "rgba(255,255,255,0.1)" : C.accent,
    color: disabled ? C.textMuted : "#050510",
    fontSize: 15, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", transition: "all 0.2s ease", letterSpacing: "-0.01em",
  }}>{children}</button>
);

const GhostButton = ({ children, onClick }) => (
  <button onClick={onClick} style={{
    width: "100%", padding: "14px", borderRadius: 16,
    background: "transparent", color: C.textSub,
    fontSize: 14, cursor: "pointer", border: `1px solid ${C.border}`,
    transition: "all 0.2s ease",
  }}>{children}</button>
);

const SliderInput = ({ label, value, onChange }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: 13, color: C.textSub }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 200, color: C.text }}>{value}</span>
    </div>
    <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
      <input type="range" min={1} max={10} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{
          width: "100%", height: 2, appearance: "none", WebkitAppearance: "none",
          background: `linear-gradient(to right, ${C.text} ${(value - 1) * 11.11}%, ${C.border} ${(value - 1) * 11.11}%)`,
          borderRadius: 2, cursor: "pointer", outline: "none",
        }}
      />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: 10, color: C.textMuted }}>1</span>
      <span style={{ fontSize: 10, color: C.textMuted }}>10</span>
    </div>
  </div>
);

const ProgressBar = ({ current, total }) => (
  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        height: 2, borderRadius: 2, flex: i === current ? 2 : 1,
        background: i === current ? C.text : i < current ? "rgba(255,255,255,0.3)" : C.border,
        transition: "all 0.3s ease",
      }} />
    ))}
  </div>
);

const Divider = ({ style = {} }) => (
  <div style={{ height: 1, background: C.border2, ...style }} />
);

const InfoCard = ({ label, value, sub }) => (
  <div style={{
    background: C.surface, borderRadius: 12, padding: "12px 14px",
    border: `1px solid ${C.border2}`,
  }}>
    {label && <p style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{label}</p>}
    <p style={{ fontSize: 14, color: C.text, fontWeight: 400 }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{sub}</p>}
  </div>
);

// ─────────────────────────────────────────────
// SCREEN 1: SPLASH
// ─────────────────────────────────────────────

function SplashScreen({ onStart }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{ ...S.screen, justifyContent: "space-between", padding: "60px 28px 44px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <div style={{ opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 16}px)`, transition: "all 0.6s ease" }}>
          <Label>Clarity over motivation</Label>
          <div style={{ marginTop: 14 }}>
            <h1 style={{ fontSize: 52, fontWeight: 200, letterSpacing: "-0.03em", color: C.text, lineHeight: 1, margin: 0 }}>
              DREAM
            </h1>
            <h1 style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em", color: C.text, lineHeight: 1, margin: 0 }}>
              COACH
            </h1>
          </div>
        </div>

        <div style={{ width: 32, height: 1, background: C.border }} />

        <div style={{ opacity: visible ? 1 : 0, transition: "all 0.6s ease 0.2s" }}>
          <p style={{ fontSize: 15, color: C.textSub, fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
            This isn't about hype or motivation.<br />
            It's about finally understanding<br />
            why you haven't started.
          </p>
        </div>

        <div style={{
          background: C.surface, borderRadius: 14, padding: "16px",
          border: `1px solid ${C.border2}`,
          opacity: visible ? 1 : 0, transition: "all 0.6s ease 0.4s"
        }}>
          <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6, margin: 0 }}>
            You'll be asked honest questions about your dream, your resistance, and reality. The output is a clear picture — not a pep talk.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: visible ? 1 : 0, transition: "all 0.6s ease 0.5s" }}>
        <PrimaryButton onClick={onStart}>Begin →</PrimaryButton>
        <p style={{ textAlign: "center", fontSize: 11, color: C.textMuted }}>~15 minutes · Private · No judgment</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 2: DREAM INTAKE
// ─────────────────────────────────────────────

function DreamIntakeScreen({ onNext }) {
  const [dream, setDream] = useState({
    title: "", category: "", years: "",
    importance: 5, pain: 5, fear: 5
  });

  const yearsOptions = ["< 1 yr", "1–3 yrs", "3–7 yrs", "7–15 yrs", "15+ yrs"];
  const canContinue = dream.title.trim().length > 2 && dream.category && dream.years;

  const daysMap = { "< 1 yr": 180, "1–3 yrs": 730, "3–7 yrs": 1825, "7–15 yrs": 4015, "15+ yrs": 6570 };
  const approxDays = dream.years ? daysMap[dream.years] : null;

  return (
    <div style={{ ...S.screen }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "52px 24px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <Label>Step 1 of 3</Label>
          <h2 style={{ fontSize: 26, fontWeight: 300, color: C.text, marginTop: 10, lineHeight: 1.3, letterSpacing: "-0.02em" }}>
            What have you been putting off?
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Title */}
          <div>
            <Label style={{ marginBottom: 8 }}>Name it. Be specific.</Label>
            <input value={dream.title}
              onChange={e => setDream({ ...dream, title: e.target.value })}
              placeholder="e.g. Release an album, Open a ceramics studio..."
              style={{
                width: "100%", background: C.surface, color: C.text,
                border: `1px solid ${C.border}`, borderRadius: 14,
                padding: "14px 16px", fontSize: 14, outline: "none",
                boxSizing: "border-box", fontFamily: "inherit",
                placeholder: C.textMuted,
              }}
            />
          </div>

          {/* Category */}
          <div>
            <Label style={{ marginBottom: 8 }}>Category</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map(c => (
                <Chip key={c} label={c} selected={dream.category === c}
                  onClick={() => setDream({ ...dream, category: c })} />
              ))}
            </div>
          </div>

          {/* Years */}
          <div>
            <Label style={{ marginBottom: 8 }}>How long have you wanted this?</Label>
            <div style={{ display: "flex", gap: 6 }}>
              {yearsOptions.map(y => (
                <button key={y} onClick={() => setDream({ ...dream, years: y })}
                  style={{
                    flex: 1, padding: "10px 4px", borderRadius: 12, fontSize: 11,
                    border: `1px solid ${dream.years === y ? "rgba(255,255,255,0.5)" : C.border}`,
                    background: dream.years === y ? "rgba(255,255,255,0.08)" : "transparent",
                    color: dream.years === y ? C.text : C.textSub,
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >{y}</button>
              ))}
            </div>
          </div>

          {/* Compassionate timeline */}
          {approxDays && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border2}`,
              borderRadius: 14, padding: "14px 16px", textAlign: "center",
            }}>
              <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>You've carried this for approximately</p>
              <p style={{ fontSize: 20, fontWeight: 200, color: C.text }}>
                {approxDays.toLocaleString()} days
              </p>
              <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                That's not laziness. That's something worth understanding.
              </p>
            </div>
          )}

          <Divider />

          {/* Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <SliderInput label="How much does this matter to you?" value={dream.importance}
              onChange={v => setDream({ ...dream, importance: v })} />
            <SliderInput label="How much does not doing it hurt?" value={dream.pain}
              onChange={v => setDream({ ...dream, pain: v })} />
            <SliderInput label="How afraid are you of actually doing it?" value={dream.fear}
              onChange={v => setDream({ ...dream, fear: v })} />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px 36px", borderTop: `1px solid ${C.border2}` }}>
        <PrimaryButton onClick={() => onNext(dream)} disabled={!canContinue}>
          Continue →
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 3: RESISTANCE INTERVIEW
// ─────────────────────────────────────────────

function ResistanceScreen({ dream, onNext }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [animating, setAnimating] = useState(false);

  const questions = [
    {
      key: "emotion",
      question: "What emotion comes up when you think about doing this?",
      note: "Your first honest answer. Not the aspirational one.",
      options: EMOTIONS,
    },
    {
      key: "firstThought",
      question: "What thought appears first?",
      note: "The thought that usually ends the energy.",
      options: FIRST_THOUGHTS,
    },
    {
      key: "stuckPoint",
      question: "Where do you get stuck most reliably?",
      note: "Not where you think you should be stuck — where you actually are.",
      options: STUCK_POINTS,
    },
    {
      key: "protecting",
      question: "What are you protecting by not doing this?",
      note: "Not starting keeps something safe. What is it?",
      options: PROTECTING,
    },
    {
      key: "guaranteedHesitate",
      question: "If success were completely guaranteed, would you still hesitate?",
      note: "This separates fear of failure from fear of the work — or success — itself.",
      options: [
        { id: "yes", label: "Yes — something else is stopping me" },
        { id: "no", label: "No — I'd start immediately" },
      ],
    },
  ];

  const q = questions[step];
  const selected = answers[q.key];

  const handleSelect = (val) => {
    const newAnswers = { ...answers, [q.key]: val };
    setAnswers(newAnswers);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        onNext(newAnswers);
      }
    }, 300);
  };

  return (
    <div style={{ ...S.screen, padding: "52px 24px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <Label style={{ marginBottom: 12 }}>Resistance Interview · {step + 1} of {questions.length}</Label>
        <ProgressBar current={step} total={questions.length} />
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between",
        opacity: animating ? 0 : 1, transform: `translateX(${animating ? -20 : 0}px)`,
        transition: "all 0.25s ease",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 300, color: C.text, lineHeight: 1.4, letterSpacing: "-0.01em", margin: 0 }}>
              {q.question}
            </h2>
            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 8, fontStyle: "italic" }}>{q.note}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map(opt => (
              <OptionButton key={opt.id} label={opt.label}
                selected={selected === opt.id}
                onClick={() => handleSelect(opt.id)} />
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.textMuted }}>
          Select to advance
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 4: REALITY CHECK
// ─────────────────────────────────────────────

function RealityScreen({ dream, onNext }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [animating, setAnimating] = useState(false);

  const questions = [
    {
      key: "physicalConstraint",
      question: "Are there physical or biological constraints relevant to this dream?",
      note: `Age, health, geography, access. For "${dream.title}" specifically.`,
      options: [
        { id: "none", label: "No real constraints" },
        { id: "minor", label: "Minor — manageable with effort" },
        { id: "significant", label: "Significant — would require major changes" },
        { id: "impossible", label: "Honestly, this may be genuinely impossible" },
      ],
    },
    {
      key: "timeRealistic",
      question: "Do you realistically have time in your current life?",
      note: "Not ideally — realistically. With your actual current obligations.",
      options: [
        { id: "yes", label: "Yes — I have real, usable time" },
        { id: "some", label: "Some — but it requires real sacrifice" },
        { id: "little", label: "Very little — I'd need to restructure significantly" },
        { id: "none", label: "No — genuinely not possible right now" },
      ],
    },
    {
      key: "sacrifice",
      question: "What would need to be given up to pursue this seriously?",
      note: "Be concrete. Vagueness protects the fantasy.",
      options: [
        { id: "sleep", label: "Sleep or rest" },
        { id: "social", label: "Social time or relationships" },
        { id: "income", label: "Income stability" },
        { id: "career", label: "Career advancement" },
        { id: "creative", label: "Other creative projects" },
        { id: "family", label: "Family time" },
      ],
    },
    {
      key: "yearsWilling",
      question: "This would realistically take years of sustained effort. Are you actually willing?",
      note: "Not 'can you' — are you willing. The distinction matters.",
      options: [
        { id: "yes", label: "Yes — I'm willing to commit to the timeline" },
        { id: "maybe", label: "I want to be, but I'm genuinely unsure" },
        { id: "probably_not", label: "Probably not — and that's honest" },
        { id: "no", label: "No — that's too much for what I want" },
      ],
    },
    {
      key: "trueWant",
      question: "What part of this dream do you actually want?",
      note: "The Fantasy vs Essence test.",
      options: [
        { id: "status", label: "The status or recognition" },
        { id: "identity", label: "The identity — being someone who does this" },
        { id: "process", label: "The daily process and work itself" },
        { id: "meaning", label: "The meaning or expression it gives me" },
        { id: "output", label: "The finished product or output" },
      ],
    },
    {
      key: "withoutReward",
      question: "If all external reward disappeared — no audience, no income, no recognition — would you still want it?",
      note: "This reveals whether the dream is truly yours.",
      options: [
        { id: "yes", label: "Yes, completely" },
        { id: "mostly", label: "Mostly yes" },
        { id: "not_really", label: "Honestly, not really" },
        { id: "no", label: "No — the external reward is the point" },
      ],
    },
  ];

  const q = questions[step];
  const selected = answers[q.key];

  const handleSelect = (val) => {
    const newAnswers = { ...answers, [q.key]: val };
    setAnswers(newAnswers);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        onNext(newAnswers);
      }
    }, 300);
  };

  return (
    <div style={{ ...S.screen, padding: "52px 24px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <Label style={{ marginBottom: 12 }}>Reality Check · {step + 1} of {questions.length}</Label>
        <ProgressBar current={step} total={questions.length} />
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between",
        opacity: animating ? 0 : 1, transform: `translateX(${animating ? -20 : 0}px)`,
        transition: "all 0.25s ease",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 300, color: C.text, lineHeight: 1.4, letterSpacing: "-0.01em", margin: 0 }}>
              {q.question}
            </h2>
            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 8, fontStyle: "italic" }}>{q.note}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map(opt => (
              <OptionButton key={opt.id} label={opt.label}
                selected={selected === opt.id}
                onClick={() => handleSelect(opt.id)} />
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.textMuted }}>
          Select to advance
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 5: PROCESSING
// ─────────────────────────────────────────────

function ProcessingScreen({ onDone }) {
  const [phase, setPhase] = useState(0);
  const phases = [
    "Analyzing resistance patterns...",
    "Testing reality against the dream...",
    "Mapping your stuck phase...",
    "Identifying your archetype...",
    "Preparing your honest assessment...",
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setPhase(p => {
        if (p >= phases.length - 1) { clearInterval(t); setTimeout(onDone, 600); return p; }
        return p + 1;
      });
    }, 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ ...S.screen, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{
          width: 40, height: 40, border: `1px solid ${C.border}`,
          borderTop: `1px solid ${C.textSub}`, borderRadius: "50%",
          margin: "0 auto 32px",
          animation: "spin 1s linear infinite",
        }} />
        <p style={{ fontSize: 14, color: C.textSub, fontWeight: 300 }}>{phases[phase]}</p>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 16 }}>
          {phases.map((_, i) => (
            <div key={i} style={{
              width: 20, height: 2, borderRadius: 2,
              background: i <= phase ? C.textSub : C.border,
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 6: RESULTS
// ─────────────────────────────────────────────

function ResultsScreen({ dream, resistanceAnswers, realityAnswers, onAction }) {
  const archetype = determineArchetype(resistanceAnswers);
  const archetypeInfo = ARCHETYPES[archetype];
  const phase = STUCK_PHASES[resistanceAnswers.stuckPoint] || "Dormancy";
  const classification = classifyDream(dream, resistanceAnswers, realityAnswers);
  const classInfo = CLASSIFICATIONS[classification];
  const microSteps = getMicroSteps(archetype, dream.title, dream.category);
  const [activeTab, setActiveTab] = useState("assessment");

  const trueWantLabel = {
    status: "Status and recognition",
    identity: "Identity — being someone who does this",
    process: "The daily process itself",
    meaning: "Meaning and expression",
    output: "The finished product",
  }[realityAnswers.trueWant] || "—";

  const withoutRewardLabel = {
    yes: "Yes, completely — it's intrinsically mine",
    mostly: "Mostly yes",
    not_really: "Honestly, not really",
    no: "No — the external reward is the point",
  }[realityAnswers.withoutReward] || "—";

  return (
    <div style={{ ...S.screen }}>
      {/* Header */}
      <div style={{ padding: "52px 24px 20px", borderBottom: `1px solid ${C.border2}` }}>
        <Label style={{ marginBottom: 6 }}>Your Assessment</Label>
        <p style={{ fontSize: 18, fontWeight: 300, color: C.text }}>{dream.title}</p>
        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
          {dream.category} · Carried for {dream.years}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${C.border2}`,
        padding: "0 24px",
      }}>
        {[["assessment", "Assessment"], ["steps", "Next Steps"], ["profile", "Profile"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: "14px 0", fontSize: 12, fontWeight: 500,
            color: activeTab === id ? C.text : C.textMuted,
            background: "transparent", border: "none", cursor: "pointer",
            borderBottom: `2px solid ${activeTab === id ? C.text : "transparent"}`,
            transition: "all 0.2s ease", letterSpacing: "0.02em",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

        {/* ── ASSESSMENT TAB ── */}
        {activeTab === "assessment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Classification */}
            <div style={{
              background: classInfo.bg, border: `1px solid ${classInfo.color}30`,
              borderRadius: 16, padding: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <span style={{ fontSize: 20, color: classInfo.color, lineHeight: 1.4 }}>{classInfo.icon}</span>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>{classification}</p>
                  <p style={{ fontSize: 13, color: classInfo.color, marginTop: 4 }}>{classInfo.subtitle}</p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.textSub, marginTop: 14, lineHeight: 1.65 }}>
                {classInfo.description}
              </p>
            </div>

            {/* Archetype */}
            <div>
              <Label style={{ marginBottom: 10 }}>Your Resistance Archetype</Label>
              <div style={{
                background: archetypeInfo.bg, border: `1px solid ${archetypeInfo.color}30`,
                borderRadius: 16, padding: "18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 18, color: archetypeInfo.color }}>{archetypeInfo.icon}</span>
                  <p style={{ fontSize: 16, fontWeight: 500, color: C.text, margin: 0 }}>{archetype}</p>
                </div>
                <p style={{ fontSize: 13, color: archetypeInfo.color, fontStyle: "italic", marginBottom: 8 }}>
                  "{archetypeInfo.tagline}"
                </p>
                <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.65, margin: 0 }}>
                  {archetypeInfo.description}
                </p>
              </div>
              <p style={{ fontSize: 12, color: C.textMuted, marginTop: 10 }}>
                Stuck phase: <span style={{ color: C.textSub }}>{phase}</span>
              </p>
            </div>

            {/* Signal scores */}
            <div>
              <Label style={{ marginBottom: 10 }}>Signal Scores</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Importance", value: dream.importance },
                  { label: "Pain of not doing", value: dream.pain },
                  { label: "Fear of doing", value: dream.fear },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: C.surface, borderRadius: 12, padding: "14px 10px",
                    textAlign: "center", border: `1px solid ${C.border2}`,
                  }}>
                    <p style={{ fontSize: 24, fontWeight: 200, color: C.text, margin: 0 }}>{value}</p>
                    <p style={{ fontSize: 10, color: C.textMuted, marginTop: 4, lineHeight: 1.3 }}>{label}</p>
                  </div>
                ))}
              </div>
              {dream.fear >= 7 && dream.pain >= 7 && (
                <div style={{
                  background: C.surface, borderRadius: 12, padding: "12px 14px",
                  marginTop: 8, border: `1px solid ${C.border2}`,
                }}>
                  <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6, margin: 0 }}>
                    High fear + high pain suggests the classic stuck pattern: you care deeply and you're scared. That's data, not character flaw.
                  </p>
                </div>
              )}
            </div>

            {/* Essence test */}
            <div>
              <Label style={{ marginBottom: 10 }}>Fantasy vs Essence</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <InfoCard label="What you actually want most" value={trueWantLabel} />
                <InfoCard label="Without external reward" value={withoutRewardLabel} />
              </div>
            </div>
          </div>
        )}

        {/* ── NEXT STEPS TAB ── */}
        {activeTab === "steps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {classInfo.action === "pursue" && (
              <>
                <div>
                  <Label style={{ marginBottom: 6 }}>Grounded First Steps</Label>
                  <p style={{ fontSize: 13, color: C.textMuted }}>
                    Calibrated to your {archetype} pattern. Each under 30 minutes.
                  </p>
                </div>
                {microSteps.map((step, i) => (
                  <div key={i} style={{
                    background: C.surface, borderRadius: 14, padding: "16px",
                    border: `1px solid ${C.border2}`,
                    display: "flex", gap: 14, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", paddingTop: 2, minWidth: 16 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, margin: 0 }}>{step}</p>
                  </div>
                ))}
                <div style={{ background: C.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border2}` }}>
                  <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
                    These steps are designed for someone with your specific archetype. They're not about output — they're about proving to your nervous system that movement is possible.
                  </p>
                </div>
              </>
            )}

            {classInfo.action === "defer" && (
              <>
                <div>
                  <Label style={{ marginBottom: 6 }}>Conscious Deferral</Label>
                  <p style={{ fontSize: 13, color: C.textMuted }}>Not avoidance — a deliberate choice with a date.</p>
                </div>
                <div style={{ background: C.surface, borderRadius: 16, padding: "18px", border: `1px solid ${C.border2}` }}>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>
                    The conditions aren't right. That's real. Deferring consciously — with a specific future review date — is a form of respect for both the dream and your current life.
                  </p>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, marginTop: 12, marginBottom: 0 }}>
                    It's different from abandonment: abandonment is unconscious. This is a decision.
                  </p>
                </div>
                <div>
                  <Label style={{ marginBottom: 10 }}>Set a Review Date</Label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["6 months", "1 year", "2 years"].map(d => (
                      <button key={d} style={{
                        flex: 1, padding: "12px 8px", borderRadius: 12, fontSize: 13,
                        background: C.surface, color: C.textSub, border: `1px solid ${C.border}`,
                        cursor: "pointer",
                      }}>{d}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {classInfo.action === "reshape" && (
              <>
                <div>
                  <Label style={{ marginBottom: 6 }}>Reshaping the Dream</Label>
                  <p style={{ fontSize: 13, color: C.textMuted }}>From fantasy form to essential truth.</p>
                </div>
                <div style={{ background: C.surface, borderRadius: 16, padding: "18px", border: `1px solid ${C.border2}` }}>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>
                    The version of this dream you're carrying may not be the version that's actually yours. What you want underneath it is real — the specific form may need to change.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <InfoCard label="What you're chasing" value={dream.title} />
                  <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                    <span style={{ fontSize: 16, color: C.textMuted }}>↓</span>
                  </div>
                  <InfoCard label="What you actually want" value={trueWantLabel}
                    sub="Find a smaller, sustainable form that gives you this." />
                </div>
                <div style={{ background: C.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border2}` }}>
                  <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
                    Example: "Famous musician" → "Consistent creative output with a small audience." The essence is the same. The stakes are real. The fantasy is gone.
                  </p>
                </div>
              </>
            )}

            {classInfo.action === "release" && (
              <>
                <div>
                  <Label style={{ marginBottom: 6 }}>Closure Reflection</Label>
                  <p style={{ fontSize: 13, color: C.textMuted }}>Releasing honestly is an act of self-knowledge.</p>
                </div>
                <div style={{ background: C.surface, borderRadius: 16, padding: "18px", border: `1px solid ${C.border2}` }}>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>
                    Carrying a dream that doesn't fit costs real energy — energy that could go somewhere it belongs. Releasing it isn't failure. It's clarity.
                  </p>
                </div>
                {[
                  { prompt: "This dream taught me...", hint: "What did wanting this reveal about who you are?" },
                  { prompt: "I no longer need to carry...", hint: "Name the weight you're setting down." },
                  { prompt: "The energy I free up can go to...", hint: "What becomes possible now?" },
                ].map(({ prompt, hint }) => (
                  <div key={prompt} style={{ background: C.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border2}` }}>
                    <p style={{ fontSize: 13, color: C.text, fontWeight: 400 }}>{prompt}</p>
                    <p style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{hint}</p>
                    <div style={{ marginTop: 10, height: 1, background: C.border2 }} />
                    <p style={{ fontSize: 12, color: C.textMuted, marginTop: 8, fontStyle: "italic" }}>Write this in a private journal.</p>
                  </div>
                ))}
              </>
            )}

          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <Label style={{ marginBottom: 6 }}>Resistance Profile</Label>
              <p style={{ fontSize: 13, color: C.textMuted }}>What your answers reveal about this pattern.</p>
            </div>

            <div style={{ background: C.surface, borderRadius: 16, padding: "18px", border: `1px solid ${C.border2}` }}>
              <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.7 }}>
                Your primary block is <span style={{ color: archetypeInfo.color, fontWeight: 500 }}>{archetype}</span>. You're currently in the <span style={{ color: C.text }}>{phase}</span> phase. This is a pattern — not a personality defect.
              </p>
            </div>

            <div>
              <Label style={{ marginBottom: 10 }}>What You Reported</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Primary emotion", value: EMOTIONS.find(e => e.id === resistanceAnswers.emotion)?.label },
                  { label: "First thought", value: FIRST_THOUGHTS.find(e => e.id === resistanceAnswers.firstThought)?.label },
                  { label: "Where you get stuck", value: STUCK_POINTS.find(e => e.id === resistanceAnswers.stuckPoint)?.label },
                  { label: "What you're protecting", value: PROTECTING.find(e => e.id === resistanceAnswers.protecting)?.label },
                  { label: "Would hesitate even if success guaranteed", value: resistanceAnswers.guaranteedHesitate === "yes" ? "Yes" : "No" },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "10px 0", borderBottom: `1px solid ${C.border2}`,
                  }}>
                    <span style={{ fontSize: 12, color: C.textMuted, flex: 1 }}>{label}</span>
                    <span style={{ fontSize: 13, color: C.text, flex: 1, textAlign: "right" }}>{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label style={{ marginBottom: 10 }}>Reality Signals</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Physical constraints", value: { none: "None", minor: "Minor", significant: "Significant", impossible: "May be impossible" }[realityAnswers.physicalConstraint] },
                  { label: "Time available", value: { yes: "Yes — real time exists", some: "Some, with sacrifice", little: "Very little", none: "Not currently possible" }[realityAnswers.timeRealistic] },
                  { label: "Willing to commit years", value: { yes: "Yes", maybe: "Uncertain", probably_not: "Probably not", no: "No" }[realityAnswers.yearsWilling] },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "10px 0", borderBottom: `1px solid ${C.border2}`,
                  }}>
                    <span style={{ fontSize: 12, color: C.textMuted, flex: 1 }}>{label}</span>
                    <span style={{ fontSize: 13, color: C.text, flex: 1, textAlign: "right" }}>{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: C.surface, borderRadius: 14, padding: "16px", border: `1px solid ${C.border2}` }}>
              <Label style={{ marginBottom: 8 }}>Pattern Summary</Label>
              <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.7, margin: 0 }}>
                Your main block is <strong style={{ color: C.text }}>{archetype}</strong>. Avoidance tends to spike at <strong style={{ color: C.text }}>{STUCK_POINTS.find(s => s.id === resistanceAnswers.stuckPoint)?.label?.toLowerCase() || "the start"}</strong>. The emotion underneath is most often <strong style={{ color: C.text }}>{EMOTIONS.find(e => e.id === resistanceAnswers.emotion)?.label?.toLowerCase() || "unnamed"}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: "16px 24px 36px", borderTop: `1px solid ${C.border2}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <GhostButton onClick={() => onAction("restart")}>Start Over with Another Dream</GhostButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────

export default function DreamCoach() {
  const [screen, setScreen] = useState("splash");
  const [dreamData, setDreamData] = useState(null);
  const [resistanceData, setResistanceData] = useState(null);
  const [realityData, setRealityData] = useState(null);

  const handleAction = (action) => {
    if (action === "restart") {
      setScreen("splash");
      setDreamData(null);
      setResistanceData(null);
      setRealityData(null);
    }
  };

  return (
    <div style={{ background: "#050510", minHeight: "100vh" }}>
      {screen === "splash" && (
        <SplashScreen onStart={() => setScreen("intake")} />
      )}
      {screen === "intake" && (
        <DreamIntakeScreen onNext={data => { setDreamData(data); setScreen("resistance"); }} />
      )}
      {screen === "resistance" && (
        <ResistanceScreen dream={dreamData} onNext={data => { setResistanceData(data); setScreen("reality"); }} />
      )}
      {screen === "reality" && (
        <RealityScreen dream={dreamData} onNext={data => { setRealityData(data); setScreen("processing"); }} />
      )}
      {screen === "processing" && (
        <ProcessingScreen onDone={() => setScreen("results")} />
      )}
      {screen === "results" && (
        <ResultsScreen
          dream={dreamData}
          resistanceAnswers={resistanceData}
          realityAnswers={realityData}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
