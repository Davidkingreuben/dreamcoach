# DREAMCOACH — Full System Specification
*Version 1.0 · MVP + Architecture*

---

## 1. Philosophy & Design Principles

DREAMCOACH operates on one core belief: **people don't fail to act only because of laziness.** They get stuck due to psychological resistance, identity conflicts, and real-world constraints — and they need a tool that respects all three simultaneously.

**What this app is NOT:**
- Not a habit tracker
- Not a motivational push notification machine
- Not an AI chatbot giving generic advice
- Not a "you can do anything" hype engine

**What it IS:**
- A structured self-diagnostic tool
- A reality-testing layer
- A compassionate truth-teller
- A way to consciously process, pursue, reshape, or release a dream

---

## 2. Data Models

### 2.1 Dream Model

```typescript
interface Dream {
  id: string;                    // UUID
  userId: string;
  title: string;                 // Free text
  category: DreamCategory;
  yearsWanted: YearsRange;       // "< 1 yr" | "1–3 yrs" | etc.
  importanceScore: number;       // 1–10
  painScore: number;             // 1–10 (pain of NOT doing)
  fearScore: number;             // 1–10 (fear of doing)
  createdAt: Date;
  updatedAt: Date;
  status: DreamStatus;
  classification?: DreamClassification;
}

type DreamCategory = "Music" | "Podcast" | "Art" | "Business"
                   | "Athletic" | "Writing" | "Lifestyle" | "Other";

type YearsRange = "< 1 yr" | "1–3 yrs" | "3–7 yrs" | "7–15 yrs" | "15+ yrs";

type DreamStatus = "active" | "deferred" | "reshaped" | "released";
```

### 2.2 Resistance Profile Model

```typescript
interface ResistanceProfile {
  id: string;
  dreamId: string;
  userId: string;

  // Raw interview answers
  primaryEmotion: Emotion;
  firstThought: FirstThought;
  stuckPoint: StuckPoint;
  protecting: ProtectedThing;
  guaranteedHesitate: "yes" | "no";

  // Computed
  archetype: ResistanceArchetype;
  stuckPhase: StuckPhase;

  createdAt: Date;
}

type Emotion = "fear" | "shame" | "overwhelm" | "boredom"
             | "excite_crash" | "numbness";

type FirstThought = "not_enough" | "judgment" | "no_start"
                  | "too_late" | "wont_matter";

type StuckPoint = "starting" | "consistency" | "finishing"
                | "publishing" | "promoting" | "committing";

type ProtectedThing = "comfort" | "identity" | "relationships"
                    | "control" | "certainty";

type ResistanceArchetype =
  | "Fear of Visibility"
  | "Perfectionist Freeze"
  | "Overwhelm Fog"
  | "Identity Conflict"
  | "Fear of Success"
  | "Shame Loop"
  | "Consistency Collapse"
  | "Misalignment";

type StuckPhase =
  | "Spark"
  | "Preparation"
  | "First-Step Resistance"
  | "Momentum"
  | "Pre-Publish Panic"
  | "Dormancy"
  | "Return";
```

### 2.3 Reality Assessment Model

```typescript
interface RealityAssessment {
  id: string;
  dreamId: string;
  userId: string;

  physicalConstraint: "none" | "minor" | "significant" | "impossible";
  timeRealistic: "yes" | "some" | "little" | "none";
  primarySacrifice: SacrificeType;
  yearsWilling: "yes" | "maybe" | "probably_not" | "no";
  trueWant: "status" | "identity" | "process" | "meaning" | "output";
  withoutReward: "yes" | "mostly" | "not_really" | "no";

  createdAt: Date;
}

type SacrificeType = "sleep" | "social" | "income" | "career"
                   | "creative" | "family";
```

### 2.4 Dream Assessment (Output) Model

```typescript
interface DreamAssessment {
  id: string;
  dreamId: string;
  userId: string;

  resistanceProfileId: string;
  realityAssessmentId: string;

  classification: DreamClassification;
  archetype: ResistanceArchetype;
  stuckPhase: StuckPhase;
  microSteps: string[];          // 3 personalized action items

  generatedAt: Date;
}

type DreamClassification =
  | "Viable & Aligned"
  | "Viable but Misaligned"
  | "Symbolic / Transformable"
  | "Unrealistic in Current Form";
```

### 2.5 Check-In Model

```typescript
interface CheckIn {
  id: string;
  dreamId: string;
  userId: string;

  avoidedToday: string;          // Free text
  resistanceShownUp: string;     // Free text
  strongestEmotion: Emotion;
  tinyStepPossible: string;      // Free text

  completedAt: Date;
}
```

### 2.6 User Resistance Profile (Aggregate)

```typescript
interface UserResistanceProfile {
  userId: string;

  mostCommonArchetype: ResistanceArchetype;
  mostCommonStuckPoint: StuckPoint;
  mostCommonEmotion: Emotion;

  dreamsAnalyzed: number;
  dreamsAbandoned: number;         // Status became "dormant" without decision
  dreamsConsciouslyReleased: number;
  dreamsPursued: number;

  archetypeFrequency: Record<ResistanceArchetype, number>;
  stuckPhaseFrequency: Record<StuckPhase, number>;

  lastUpdated: Date;
}
```

---

## 3. Classification Engine (Rule-Based Logic)

The classification is deterministic and transparent. Order of precedence matters.

```typescript
function classifyDream(
  dream: Dream,
  resistance: ResistanceProfile,
  reality: RealityAssessment
): DreamClassification {

  // ── Hard gates: Reality overrides everything ──
  if (reality.physicalConstraint === "impossible")
    return "Unrealistic in Current Form";

  if (reality.physicalConstraint === "significant"
   && reality.timeRealistic === "none"
   && reality.yearsWilling === "no")
    return "Unrealistic in Current Form";

  if (reality.timeRealistic === "none" && reality.yearsWilling === "no")
    return "Unrealistic in Current Form";

  // ── Misalignment signals ──
  if (resistance.archetype === "Misalignment")
    return "Symbolic / Transformable";

  if (reality.withoutReward === "no")
    return "Symbolic / Transformable";

  if (dream.importanceScore <= 4 && dream.painScore <= 4)
    return "Symbolic / Transformable";

  // ── Wrong season / conditions ──
  if (reality.timeRealistic === "none" && reality.yearsWilling === "yes")
    return "Viable but Misaligned";

  if (reality.timeRealistic === "little" && dream.importanceScore < 7)
    return "Viable but Misaligned";

  // ── Default: viable, internal block ──
  return "Viable & Aligned";
}
```

---

## 4. Archetype Classification Logic

```typescript
function determineArchetype(answers: ResistanceAnswers): ResistanceArchetype {
  const { emotion, firstThought, stuckPoint, protecting, guaranteedHesitate } = answers;

  // Priority-ordered rules
  if (protecting === "identity")                              return "Identity Conflict";
  if (emotion === "shame")                                   return "Shame Loop";
  if (emotion === "boredom" || emotion === "numbness")       return "Misalignment";
  if (stuckPoint === "publishing" && emotion === "fear")     return "Fear of Visibility";
  if (stuckPoint === "promoting")                            return "Fear of Visibility";
  if (firstThought === "not_enough" || stuckPoint === "finishing") return "Perfectionist Freeze";
  if (firstThought === "judgment")                           return "Fear of Visibility";
  if (emotion === "overwhelm" || firstThought === "no_start"
   || stuckPoint === "starting")                             return "Overwhelm Fog";
  if (guaranteedHesitate === "yes" && protecting === "comfort") return "Fear of Success";
  if (stuckPoint === "consistency")                          return "Consistency Collapse";
  if (firstThought === "too_late")                           return "Shame Loop";
  if (firstThought === "wont_matter")                        return "Misalignment";

  return "Perfectionist Freeze"; // safe default
}
```

---

## 5. Archetype Reference

| Archetype | Core Pattern | Color |
|---|---|---|
| Fear of Visibility | Creates but can't share | `#8B7ED8` |
| Perfectionist Freeze | Raises bar to avoid finishing | `#5B9BD5` |
| Overwhelm Fog | Sees mountain, not next step | `#6B8FC5` |
| Identity Conflict | Dream doesn't fit self-concept | `#9B7AAE` |
| Fear of Success | Scared of what success reorganizes | `#5EAA8B` |
| Shame Loop | Past attempts block the present | `#C47A5A` |
| Consistency Collapse | Starts strong, can't sustain | `#5AACBA` |
| Misalignment | May not actually be their dream | `#A08B5A` |

---

## 6. Stuck Phase Reference

| Phase | Trigger | Description |
|---|---|---|
| Spark | Initial idea | Idea exists, no action yet |
| Preparation | Research / planning | Perpetual prep without starting |
| First-Step Resistance | Can't begin | Starting is the wall |
| Momentum | Consistency breaks | Started but can't sustain |
| Pre-Publish Panic | Near completion | Finishing / sharing triggers crisis |
| Dormancy | Abandoned | Not consciously released, just stopped |
| Return | Coming back | Re-engaging after a gap |

---

## 7. User Flow (Full)

```
Launch App
    │
    ▼
[Splash Screen]
    │
    ▼
[Dream Intake]
    Title → Category → Years Carried → Importance/Pain/Fear sliders
    │
    ▼
[Resistance Interview] (5 questions, auto-advance on selection)
    Emotion → First Thought → Stuck Point → Protecting → Guaranteed Hesitate
    │
    ▼
[Reality Check] (6 questions, auto-advance on selection)
    Physical Constraints → Time Available → Sacrifice → Years Willing
    → True Want → Without Reward
    │
    ▼
[Processing Screen] (~3.5 seconds)
    │
    ▼
[Results Screen] — 3 tabs
    ├── Assessment: Classification + Archetype + Scores + Essence Test
    ├── Next Steps: Tailored actions per classification type
    └── Profile: Full resistance breakdown + pattern summary
    │
    ▼
[Archive / Check-In] (future)
    │
    ▼
[Recurring Check-Ins] (future)
```

---

## 8. MVP Scope

### ✅ Include in MVP

- Full 6-screen flow (Splash → Intake → Resistance → Reality → Processing → Results)
- All 8 archetypes with rule-based classification
- All 4 dream classification states with tailored outputs
- 3 personalized micro-steps per archetype
- 3-tab results screen (Assessment / Next Steps / Profile)
- Fantasy vs Essence test output
- Compassionate days-carried display

### ❌ Defer Post-MVP

- User accounts / authentication
- Persistent storage (Firebase/Supabase)
- Check-in reminders (push notifications)
- Multi-dream tracking
- Aggregate resistance profile over time
- Admin-editable question bank
- AI-enhanced step generation
- Onboarding tutorial
- Deferred dream calendar / archive

---

## 9. Tech Stack Recommendation

### iOS-First Production

```
Frontend:    SwiftUI (iOS 16+)
Backend:     Supabase (auth + Postgres + realtime)
Logic:       Rule-based engine in Swift (no AI dependency for MVP)
Storage:     Core Data (local) + Supabase sync
Notif:       UNUserNotificationCenter (check-in reminders)
Analytics:   Mixpanel or PostHog
```

### Cross-Platform (React Native)

```
Frontend:    React Native + Expo
Styling:     NativeWind (Tailwind for RN)
Backend:     Supabase
State:       Zustand
Storage:     AsyncStorage + Supabase
```

### Web Prototype (This File)

```
Framework:   React (JSX)
Styling:     Inline CSS (iOS-accurate)
Logic:       Pure JavaScript rule engine
Storage:     React state (session only)
```

---

## 10. Micro-Steps Library (Archetype-Calibrated)

Each set is designed for the specific psychological pattern:

**Fear of Visibility**
1. Write privately — no audience, no stakes
2. Share with exactly one trusted person
3. Make something deliberately imperfect

**Perfectionist Freeze**
1. 25-min timer, stop when it rings
2. Define "good enough to proceed" before starting
3. Create the ugly draft intentionally

**Overwhelm Fog**
1. Write only the next physical action
2. Spend 20 min listing everything, circle only first three
3. Find one person who started similar; read about their beginning

**Identity Conflict**
1. Write "A person who does [category] for real would..."
2. Do one private act related to the dream
3. Write why it matters — not to prove it, to understand it

**Fear of Success**
1. Write realistic life if this works — including what gets harder
2. Identify one thing you'd have to give up; sit with it
3. Take smallest reversible forward action

**Shame Loop**
1. Write about the last time you stopped — without judgment
2. Name the specific shame story; write what was actually true
3. One small thing to reclaim forward motion

**Consistency Collapse**
1. 15 min at same time for 7 days — nothing more
2. Identify exact quitting moment; plan what you'll do instead
3. Reduce friction: everything ready the night before

**Misalignment**
1. Write "What I actually want from this is..." (not the dream)
2. Separate desire from specific form
3. Explore one adjacent thing giving the same feeling

---

## 11. Design Tokens

```javascript
Colors: {
  background:   "#080810",
  surface:      "#0F0F1A",
  surface2:     "#14141F",
  border:       "rgba(255,255,255,0.07)",
  border2:      "rgba(255,255,255,0.04)",
  text:         "#E8E8F0",
  textSub:      "#8888A0",
  textMuted:    "#4A4A60",
  accent:       "#FFFFFF",
}

Typography: {
  title:        52px, weight 200 (DREAM) / 700 (COACH)
  heading:      20–26px, weight 300
  body:         14px, weight 400
  label:        10px, weight 500, tracked 0.15em
  caption:      11–12px
}

Radii: {
  card:         16px
  button:       16px
  chip:         100px (pill)
  input:        14px
}

Motion: {
  standard:     150ms ease
  transition:   250ms ease
  fade:         600ms ease (screen transitions)
}
```

---

## 12. Screen Inventory

| Screen | Purpose | Key Components |
|---|---|---|
| Splash | First impression + intent-setting | Logo, copy, single CTA |
| Dream Intake | Capture dream + signals | Text input, chips, sliders |
| Resistance Interview | 5-question psychological layer | Option buttons, auto-advance |
| Reality Check | 6-question feasibility layer | Option buttons, auto-advance |
| Processing | Expectation management | Spinner, phase labels |
| Results / Assessment | Classification + archetype | Cards, color-coded |
| Results / Next Steps | Action plan per classification | Step cards, reflection prompts |
| Results / Profile | Full breakdown + pattern summary | Data rows, pattern card |

---

*DREAMCOACH MVP · Built for psychological clarity, not motivational hype.*
