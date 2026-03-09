"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getDream, updateDream, awardBadge, logEvent,
  saveVaultEntry, updateVaultEntry,
  getPastDueVaultEntry, getRecentReleaseCount,
} from "@/lib/storage";
import type { VaultEntry, RevisitAnswer } from "@/lib/types";

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

const STEP_REVISIT = -1;
const STEP_ENTRY   =  0;
const STEP_TRUTH   =  1;
const STEP_HOLDING =  2;
const STEP_INSIGHT =  3;
const STEP_CHOICE  =  4;
const STEP_RITUAL  =  5;

// ── Question options ───────────────────────────────────────────────────────────

const TRUTH_OPTIONS = [
  { v: "not_ready",       l: "I'm not ready right now, but I still want this." },
  { v: "fear_quality",    l: "I'm afraid it won't be good enough." },
  { v: "unsure_want",     l: "I'm not sure I actually want this anymore." },
  { v: "others_dream",    l: "Someone else wanted this for me." },
  { v: "safer_as_dream",  l: "It feels safer as a dream than as a reality." },
  { v: "fear_success",    l: "I'm afraid of what happens if it succeeds." },
  { v: "costs_too_much",  l: "It would cost too much of my current life." },
  { v: "already_decided", l: "I've already decided — I just needed permission." },
];

const HOLDING_OPTIONS = [
  { v: "identity",      l: "My sense of who I am includes this dream." },
  { v: "defeat",        l: "Setting it down feels like admitting defeat." },
  { v: "without",       l: "I'm afraid of who I'd be without this dream." },
  { v: "long_story",    l: "It's been part of my story for so long." },
  { v: "circumstances", l: "I keep hoping circumstances will change." },
  { v: "emptiness",     l: "I'm afraid of the emptiness it would leave." },
];

const REVISIT_OPTIONS: { v: RevisitAnswer; l: string }[] = [
  { v: "lighter",       l: "I feel lighter without it." },
  { v: "miss_it",       l: "I miss it." },
  { v: "still_unsure",  l: "I still don't know." },
  { v: "five_minutes",  l: "I want to work on it — 5 minutes a day." },
  { v: "release_fully", l: "I want to release it fully, for good." },
];

const RITUAL_PROMPTS = [
  { prompt: "This dream taught me...",       placeholder: "What did carrying this reveal about you?" },
  { prompt: "I no longer need to carry...",  placeholder: "What belief, pressure, or expectation can you set down?" },
  { prompt: "The energy freed goes to...",   placeholder: "Where does this attention flow now?" },
];

// ── Insight copy ───────────────────────────────────────────────────────────────

const TRUTH_SEEN: Record<string, string> = {
  not_ready:      "You haven't given up — you've recognized that timing matters. This dream is real for you. Right now just isn't the right now.",
  fear_quality:   "The dream lives inside a standard you've set for yourself. The fear isn't that you'll fail — it's that what you create won't match the vision in your mind.",
  unsure_want:    "Something has shifted. What once felt urgent may have been speaking to a version of you that has since changed. That's not betrayal — it's growth.",
  others_dream:   "You may have been carrying something that was handed to you — a parent's hope, a partner's expectation, a version of success absorbed from somewhere else.",
  safer_as_dream: "The dream has been doing something useful: keeping possibility open. As long as it's unstarted, it can't disappoint. But it also can't become real.",
  fear_success:   "You can see it working — and that scares you. Success would change things: your life, your identity, your relationships. The fear is real and intelligent.",
  costs_too_much: "You've done an honest cost-benefit calculation. This dream would require something you're not willing to trade right now. That's not failure — it's clarity about what you actually value.",
  already_decided:"You already knew. This process just made it formal. There's something honest about naming a decision you've already made inside yourself.",
};

const HOLDING_HELD: Record<string, string> = {
  identity:      "The dream has become part of how you define yourself. Setting it down doesn't change who you are — but it may feel that way for a while, which is worth acknowledging.",
  defeat:        "Choosing to set something down isn't defeat. Defeat is continuing without intention. What you're doing — examining what you're stepping away from, and why — is the opposite.",
  without:       "The dream has been a compass pointing toward something. Without it, the direction may feel unclear. But what you're looking for might arrive through a different door.",
  long_story:    "Longevity creates attachment. The longer a dream has been with you, the more it feels like a piece of your history — and releasing it can feel like loss.",
  circumstances: "Waiting for the right conditions is reasonable — until it becomes the permanent story. At some point, the waiting itself becomes a kind of decision.",
  emptiness:     "Something worth sitting with: what would fill that space? The answer to that question might be pointing toward what actually wants to happen next.",
};

function buildInsight(truth: string, holding: string) {
  return {
    seen: TRUTH_SEEN[truth] ?? "You've been honest enough to pause. That takes more clarity than most people allow themselves.",
    held: HOLDING_HELD[holding] ?? "There's something worth honoring in the difficulty of letting go. It means the dream was real.",
    philosophy:
      truth === "not_ready"    ? "Timing is not the same as giving up."                      :
      truth === "others_dream" ? "You are allowed to put down what was never yours to carry." :
      holding === "defeat"     ? "Discernment is not the same as quitting."                   :
      holding === "identity"   ? "You are not your unfinished things."                        :
                                 "Clarity is lighter than carrying unfinished things.",
  };
}

// ── Summary generation ─────────────────────────────────────────────────────────

const TRUTH_CLAUSE: Record<string, string> = {
  not_ready:      "you recognized you're not ready to give it real time right now",
  fear_quality:   "you've been holding yourself to a standard that made starting feel impossible",
  unsure_want:    "you're no longer certain this is what you truly want",
  others_dream:   "this dream may have belonged to someone else's vision of you",
  safer_as_dream: "the dream felt safer as a possibility than as something you'd actually attempt",
  fear_success:   "you could see it working — and that scared you",
  costs_too_much: "the cost doesn't align with where your life is right now",
  already_decided:"you'd already made this decision inside yourself; you just needed to name it",
};

const HOLDING_CLAUSE: Record<string, string> = {
  identity:      "it's been woven into your sense of who you are",
  defeat:        "letting it go felt like admitting defeat",
  without:       "you weren't sure who you'd be without it",
  long_story:    "it has been with you long enough to feel like part of your history",
  circumstances: "you've been hoping circumstances would eventually make space for it",
  emptiness:     "you were afraid of the space it would leave",
};

function generateReleaseSummary(
  truth: string, holding: string,
  taught: string, noLongerCarry: string, energyGoes: string,
): string {
  const l1 = `You recognized ${TRUTH_CLAUSE[truth] ?? "this dream no longer fits where you are now"}.`;
  const l2 = `Part of what made it hard to release was that ${HOLDING_CLAUSE[holding] ?? "it has been with you for a long time"}.`;

  let l3: string;
  const t = taught.trim();
  const n = noLongerCarry.trim();
  const e = energyGoes.trim();
  if (t.length > 8) {
    const sentence = t.endsWith(".") || t.endsWith("!") || t.endsWith("?") ? t : `${t}.`;
    l3 = `Through this process, you named something real: "${sentence}" That clarity belongs to you, regardless of whether the dream moves forward.`;
  } else if (n.length > 8) {
    l3 = `You also noted that you no longer need to carry ${n.toLowerCase()}. That is its own kind of completion.`;
  } else if (e.length > 8) {
    l3 = `The attention this dream held can now flow toward ${e.toLowerCase()}. That redirection is not loss — it's intention.`;
  } else {
    l3 = "Releasing this isn't giving up — it's choosing honesty over obligation.";
  }

  return `${l1} ${l2} ${l3}`;
}

// ── Meaning extraction ─────────────────────────────────────────────────────────

const TRUTH_MEANINGS: Record<string, string[]> = {
  not_ready:      ["Future possibility", "Patience with yourself"],
  fear_quality:   ["Excellence and craft", "Creative standards"],
  unsure_want:    ["Authentic desire", "Self-knowledge"],
  others_dream:   ["Belonging", "External approval"],
  safer_as_dream: ["Safety in possibility", "Protection from disappointment"],
  fear_success:   ["Impact and change", "Identity through achievement"],
  costs_too_much: ["Life alignment", "Clarity of values"],
  already_decided:["Honest clarity", "Permission to decide"],
};

const HOLDING_MEANINGS: Record<string, string[]> = {
  identity:      ["Personal identity", "Who you are becoming"],
  defeat:        ["Resilience", "Self-worth"],
  without:       ["Sense of direction", "Self-definition"],
  long_story:    ["Continuity", "Life narrative"],
  circumstances: ["Hope and timing", "Belief in change"],
  emptiness:     ["Fullness and purpose", "What comes next"],
};

function extractMeanings(truth: string, holding: string): string[] {
  const t = TRUTH_MEANINGS[truth] ?? [];
  const h = HOLDING_MEANINGS[holding] ?? [];
  return [...new Set([...t, ...h])].slice(0, 4);
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? 18 : 6, height: 6, borderRadius: 3, background: i < current ? "rgba(210,220,248,0.7)" : i === current ? "rgba(210,220,248,0.9)" : "rgba(160,175,220,0.2)", transition: "all 0.3s ease" }} />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 10 }}>
      {children}
    </p>
  );
}

function ChipBtn({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "12px 16px", borderRadius: 12, border: selected ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)", background: selected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)", color: selected ? T.text : T.sub, fontSize: 14, cursor: "pointer", textAlign: "left" as const, lineHeight: 1.4, transition: "all 0.15s ease", width: "100%" }}>
      {label}
    </button>
  );
}

function NextBtn({ onClick, disabled = false, label = "Continue →", quiet = false }: { onClick: () => void; disabled?: boolean; label?: string; quiet?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "17px", borderRadius: 16, background: disabled ? "rgba(255,255,255,0.05)" : quiet ? "rgba(255,255,255,0.07)" : T.text, color: disabled ? T.muted : quiet ? T.sub : "#050510", fontSize: 15, fontWeight: quiet ? 400 : 600, border: quiet ? "1px solid rgba(255,255,255,0.1)" : "none", cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s ease" }}>
      {label}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ReleasePage({ params }: { params: { id: string } }) {
  const router  = useRouter();
  const dreamId = params.id;

  // Core flow
  const [step, setStep]               = useState(STEP_ENTRY);
  const [truth, setTruth]             = useState("");
  const [holding, setHolding]         = useState("");
  const [choice, setChoice]           = useState<"rest" | "archive" | "shrink" | "">("");
  const [ritualAnswers, setRitualAnswers] = useState(["", "", ""]);
  const [ritualStep, setRitualStep]   = useState(0);
  const [done, setDone]               = useState(false);

  // Three Release Rule
  const [showThreeRelease, setShowThreeRelease]       = useState(false);
  const [threeReleaseChoice, setThreeReleaseChoice]   = useState<"archive_perm" | "rest" | "five_min" | "">("");

  // Revisit
  const [revisitEntry, setRevisitEntry]   = useState<VaultEntry | null>(null);
  const [revisitAnswer, setRevisitAnswer] = useState<RevisitAnswer | "">("");
  const [revisitDone, setRevisitDone]     = useState(false);
  const [revisitOutcome, setRevisitOutcome] = useState<RevisitAnswer | "">("");

  // Vault entry created this session
  const [currentVaultEntry, setCurrentVaultEntry] = useState<VaultEntry | null>(null);

  // Dream metadata
  const dream      = getDream(dreamId);
  const dreamTitle = dream?.title ?? "this dream";

  // Check for past-due revisit on mount (client-only)
  useEffect(() => {
    const pastDue = getPastDueVaultEntry(dreamId);
    if (pastDue) {
      setRevisitEntry(pastDue);
      setStep(STEP_REVISIT);
    }
  }, [dreamId]);

  // Derived insight
  const insight = truth && holding ? buildInsight(truth, holding) : null;

  // ── Vault save helper ──────────────────────────────────────────────────────
  function buildAndSaveVaultEntry(opts: { permanent?: boolean; noReviewDate?: boolean }): VaultEntry {
    const now     = new Date().toISOString();
    const summary = generateReleaseSummary(truth, holding, ritualAnswers[0], ritualAnswers[1], ritualAnswers[2]);
    const entry: VaultEntry = {
      id: crypto.randomUUID(),
      dream_id: dreamId,
      dream_title: dreamTitle,
      released_at: now,
      truth_reason: truth,
      holding_reason: holding,
      reflection: { taught_me: ritualAnswers[0], no_longer_carry: ritualAnswers[1], energy_goes_to: ritualAnswers[2] },
      summary,
      meanings: extractMeanings(truth, holding),
      next_review_date: opts.permanent || opts.noReviewDate ? "" : addDays(30),
      archived_permanently: opts.permanent,
    };
    saveVaultEntry(entry);
    return entry;
  }

  // ── Confirm handler ────────────────────────────────────────────────────────
  function handleConfirm(overrideChoice?: "archive_perm") {
    const now = new Date().toISOString();
    const isPermanent = overrideChoice === "archive_perm";

    if (choice === "rest" && !isPermanent) {
      updateDream(dreamId, { status: "paused", released_at: now });
      logEvent("dream_released", dreamId, { type: "rest" });
    } else {
      const newStatus = isPermanent ? "archived" : "released";
      updateDream(dreamId, {
        status: newStatus,
        released_at: now,
        release_reflection: { taught_me: ritualAnswers[0], no_longer_carry: ritualAnswers[1], energy_goes_to: ritualAnswers[2] },
      });
      awardBadge(dreamId, "dream_released");
      logEvent("dream_released", dreamId, { type: isPermanent ? "archive_permanent" : "archive" });
    }

    const entry = buildAndSaveVaultEntry({ permanent: isPermanent });
    setCurrentVaultEntry(entry);
    setDone(true);
  }

  // ── Revisit confirm ────────────────────────────────────────────────────────
  function handleRevisitConfirm() {
    if (!revisitEntry || !revisitAnswer) return;
    const now = new Date().toISOString();

    if (revisitAnswer === "lighter") {
      updateVaultEntry(revisitEntry.id, { revisit_answer: "lighter", revisited_at: now });
    } else if (revisitAnswer === "miss_it") {
      updateVaultEntry(revisitEntry.id, { revisit_answer: "miss_it", revisited_at: now });
      updateDream(dreamId, { status: "active" });
    } else if (revisitAnswer === "still_unsure") {
      updateVaultEntry(revisitEntry.id, { revisit_answer: "still_unsure", revisited_at: now, next_review_date: addDays(30) });
    } else if (revisitAnswer === "five_minutes") {
      updateVaultEntry(revisitEntry.id, { revisit_answer: "five_minutes", revisited_at: now });
      updateDream(dreamId, { status: "active" });
    } else if (revisitAnswer === "release_fully") {
      updateVaultEntry(revisitEntry.id, { revisit_answer: "release_fully", revisited_at: now });
      updateDream(dreamId, { status: "released", released_at: now });
      awardBadge(dreamId, "dream_released");
      logEvent("dream_released", dreamId, { type: "revisit_release_fully" });
    }

    setRevisitOutcome(revisitAnswer);
    setRevisitDone(true);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── REVISIT DONE SCREEN ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (revisitDone && revisitOutcome) {
    const goCoach  = revisitOutcome === "miss_it" || revisitOutcome === "five_minutes";
    const released = revisitOutcome === "release_fully";
    const extended = revisitOutcome === "still_unsure";
    const headline = released ? "Released." : goCoach ? "Welcome back." : extended ? "Noted." : "Acknowledged.";
    const body =
      released  ? `"${dreamTitle}" has been released — with intention, not abandonment.`               :
      goCoach   ? `"${dreamTitle}" is active again. 5 minutes a day is enough to begin.`               :
      extended  ? `You'll be invited to revisit "${dreamTitle}" again in 30 days.`                     :
                  `You feel lighter without "${dreamTitle}". That's information worth trusting.`;

    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", maxWidth: 430, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 32, marginBottom: 24, opacity: 0.6 }}>{released ? "✧" : "◌"}</p>
        <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 14 }}>30-Day Revisit</p>
        <p style={{ fontSize: 24, fontWeight: 300, color: T.text, lineHeight: 1.3, marginBottom: 14 }}>{headline}</p>
        <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, marginBottom: 40, maxWidth: 300 }}>{body}</p>
        <button onClick={() => router.push(goCoach ? `/coach/${dreamId}` : "/dashboard")} style={{ padding: "14px 32px", borderRadius: 12, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: T.sub, fontSize: 14, cursor: "pointer" }}>
          {goCoach ? "Begin your journey →" : "Return to Dashboard"}
        </button>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── DONE SCREEN (vault confirmation) ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (done && currentVaultEntry) {
    const isPermanent  = threeReleaseChoice === "archive_perm";
    const isArchived   = choice === "archive" || isPermanent;
    const reviewDate   = currentVaultEntry.next_review_date ? fmtDate(currentVaultEntry.next_review_date) : null;
    const statusLabel  = isPermanent ? "Archived Permanently" : isArchived ? "Dream Released" : "Dream Resting";

    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "calc(env(safe-area-inset-top,0px) + 32px) 24px calc(env(safe-area-inset-bottom,0px) + 32px)" }}>

          {/* ─ Section 1: Acknowledgment ─ */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 16 }}>
              {statusLabel}
            </p>
            <p style={{ fontSize: 28, fontWeight: 300, color: T.text, lineHeight: 1.2, marginBottom: 10 }}>
              You chose honesty.
            </p>
            <p style={{ fontSize: 13, color: T.muted, fontStyle: "italic", lineHeight: 1.5 }}>
              &ldquo;{dreamTitle}&rdquo;
            </p>
          </div>

          {/* ─ Section 2: Reflection summary ─ */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 20px", marginBottom: 16 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 14 }}>
              What this was about
            </p>
            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.85, margin: 0 }}>
              {currentVaultEntry.summary}
            </p>
          </div>

          {/* ─ Section 3: Meaning extraction ─ */}
          {currentVaultEntry.meanings.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 20px", marginBottom: 24 }}>
              <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 14 }}>
                This dream once carried
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {currentVaultEntry.meanings.map((m) => (
                  <div key={m} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <span style={{ fontSize: 9, color: T.muted, flexShrink: 0 }}>◆</span>
                    <span style={{ fontSize: 14, color: T.sub, lineHeight: 1.4 }}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─ Section 4: Vault confirmation ─ */}
          <div style={{ padding: "20px 0 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 12 }}>
              Released Dreams Vault
            </p>
            <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.65, marginBottom: reviewDate ? 10 : 0 }}>
              This dream has been placed in your Released Dreams Vault.
            </p>
            {reviewDate && !isPermanent && (
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>
                You&apos;ll be invited to revisit it around{" "}
                <span style={{ color: T.sub }}>{reviewDate}</span>.{" "}
                You might feel different. That&apos;s allowed.
              </p>
            )}
            {isPermanent && (
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>
                Archived permanently. It will be here if you ever choose to return to it on your own terms.
              </p>
            )}
          </div>

          {/* ─ CTA ─ */}
          <NextBtn onClick={() => router.push("/dashboard")} label="Return to your active dreams →" />

        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── STEP -1: REVISIT SCREEN ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === STEP_REVISIT && revisitEntry) {
    const releaseDate = fmtDate(revisitEntry.released_at);
    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 24px) 24px 16px" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 10 }}>30-Day Revisit</p>
          <p style={{ fontSize: 22, fontWeight: 300, color: T.text, lineHeight: 1.3, marginBottom: 8 }}>
            Now that you&apos;ve had space, what feels true?
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            You set &ldquo;{dreamTitle}&rdquo; down on {releaseDate}. Thirty days have passed.
          </p>
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {REVISIT_OPTIONS.map((opt) => (
              <ChipBtn key={opt.v} label={opt.l} selected={revisitAnswer === opt.v} onClick={() => setRevisitAnswer(opt.v)} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn onClick={handleRevisitConfirm} disabled={revisitAnswer === ""} label="Record my answer →" />
            <button onClick={() => { setRevisitEntry(null); setStep(STEP_ENTRY); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: "8px 0", width: "100%", textAlign: "center" as const }}>
              Skip for now — start a new release
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── THREE RELEASE RULE ────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (showThreeRelease) {
    const THREE_OPTIONS = [
      { v: "archive_perm" as const, label: "Archive it permanently",     sub: "It will be preserved, but won't prompt you to revisit it." },
      { v: "rest"         as const, label: "Keep it resting",             sub: "Set it down for another 30 days, then check in again." },
      { v: "five_min"     as const, label: "Try a 5-minute experiment",   sub: "Give it one small door — 5 minutes a day — and see what happens." },
    ];

    const handleThreeRelease = () => {
      if (threeReleaseChoice === "archive_perm") {
        handleConfirm("archive_perm");
      } else if (threeReleaseChoice === "five_min") {
        router.push(`/coach/${dreamId}`);
      } else {
        // rest: save vault + update dream
        const now = new Date().toISOString();
        updateDream(dreamId, { status: "paused", released_at: now });
        logEvent("dream_released", dreamId, { type: "rest_three_release" });
        const entry = buildAndSaveVaultEntry({});
        setCurrentVaultEntry(entry);
        setShowThreeRelease(false);
        setDone(true);
      }
    }

    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 24px) 24px 16px" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: T.muted, fontWeight: 500, marginBottom: 14 }}>
            Something to notice
          </p>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 12 }}>
            You&apos;ve released this dream three times.
          </p>
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.75 }}>
            Sometimes a dream keeps returning because it represents something important — not because
            the life it asks for is truly yours right now.
            Would you like to archive it permanently until your current dreams are complete?
          </p>
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {THREE_OPTIONS.map((opt) => (
              <button key={opt.v} onClick={() => setThreeReleaseChoice(opt.v)} style={{ padding: "16px", borderRadius: 14, border: threeReleaseChoice === opt.v ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)", background: threeReleaseChoice === opt.v ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.02)", color: T.text, cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s ease", display: "flex", flexDirection: "column" as const, gap: 5, width: "100%" }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{opt.label}</span>
                <span style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{opt.sub}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn
              onClick={handleThreeRelease}
              disabled={threeReleaseChoice === ""}
              label={
                threeReleaseChoice === "archive_perm" ? "Archive permanently →"   :
                threeReleaseChoice === "five_min"     ? "Start with 5 minutes →"  :
                threeReleaseChoice === "rest"          ? "Keep it resting →"       :
                                                        "Continue →"
              }
            />
            <button onClick={() => { setShowThreeRelease(false); setStep(STEP_CHOICE); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
              ← Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── STEP 0: ENTRY ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === STEP_ENTRY) {
    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top,0px) + 24px) 24px calc(env(safe-area-inset-bottom,0px) + 24px)", maxWidth: 430, margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 40, alignSelf: "flex-start" }}>← Back</button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <SectionLabel>Dream Release</SectionLabel>
          <p style={{ fontSize: 26, fontWeight: 300, color: T.text, lineHeight: 1.3, marginBottom: 20 }}>Before you walk away, understand why.</p>
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.75, marginBottom: 12 }}>
            You&apos;ve acknowledged that this dream doesn&apos;t fit right now.
            Before you decide what to do with it, this short process will help you understand
            what it&apos;s been about — so you can either release it clearly, or return to it with fresh eyes.
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>~4 minutes · Private · Nothing is permanent yet</p>
        </div>
        <div style={{ paddingTop: 32 }}>
          <NextBtn onClick={() => setStep(STEP_TRUTH)} label="Explore this →" />
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── STEP 1: TRUTH ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === STEP_TRUTH) {
    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={1} total={7} />
          <SectionLabel>The honesty</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>Which of these feels most true right now?</p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>About why you&apos;re not pursuing &ldquo;{dreamTitle}&rdquo;.</p>
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {TRUTH_OPTIONS.map((opt) => (
              <ChipBtn key={opt.v} label={opt.l} selected={truth === opt.v} onClick={() => setTruth(opt.v)} />
            ))}
          </div>
          <NextBtn onClick={() => setStep(STEP_HOLDING)} disabled={truth === ""} />
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── STEP 2: HOLDING ON ────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === STEP_HOLDING) {
    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={2} total={7} />
          <SectionLabel>The attachment</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>What might be making this hard to set down?</p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>There&apos;s no wrong answer. Honesty is the point.</p>
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {HOLDING_OPTIONS.map((opt) => (
              <ChipBtn key={opt.v} label={opt.l} selected={holding === opt.v} onClick={() => setHolding(opt.v)} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn onClick={() => setStep(STEP_INSIGHT)} disabled={holding === ""} />
            <button onClick={() => setStep(STEP_TRUTH)} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>← Back</button>
          </div>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── STEP 3: INSIGHT ───────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === STEP_INSIGHT && insight) {
    const SC = "#8B7ED8", HC = "#5B9BD5";
    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={3} total={7} />
          <SectionLabel>What we see</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>Here&apos;s a reflection.</p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>Read this before you decide what happens next.</p>
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "rgba(139,126,216,0.08)", border: `1px solid ${SC}28`, borderRadius: 16, padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: SC }}>◉</span>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: SC, fontWeight: 600, margin: 0 }}>Seen</p>
              </div>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, margin: 0 }}>{insight.seen}</p>
            </div>
            <div style={{ background: "rgba(91,155,213,0.08)", border: `1px solid ${HC}28`, borderRadius: 16, padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: HC }}>◌</span>
                <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: HC, fontWeight: 600, margin: 0 }}>Held</p>
              </div>
              <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, margin: 0 }}>{insight.held}</p>
            </div>
            <div style={{ padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0, fontStyle: "italic", textAlign: "center" as const }}>&ldquo;{insight.philosophy}&rdquo;</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn onClick={() => setStep(STEP_CHOICE)} label="Decide what happens next →" />
            <button onClick={() => setStep(STEP_HOLDING)} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>← Back</button>
          </div>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── STEP 4: CHOICE ────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === STEP_CHOICE) {
    const CHOICE_OPTIONS = [
      { v: "rest"    as const, label: "Rest for 30 days",       sub: "Step back. Come back in a month to see if this still belongs to you.", icon: "◌" },
      { v: "archive" as const, label: "Archive with dignity",   sub: "Release it intentionally. Not abandoned — concluded.",                  icon: "✧" },
      { v: "shrink"  as const, label: "Shrink it to 5 minutes", sub: "Give it a smaller door. Just 5 minutes a day to begin.",               icon: "◆" },
    ];
    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={4} total={7} />
          <SectionLabel>The decision</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>What do you want to do with this dream?</p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>None of these are permanent. All of them are honest.</p>
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {CHOICE_OPTIONS.map((opt) => (
              <button key={opt.v} onClick={() => setChoice(opt.v)} style={{ padding: "16px", borderRadius: 14, border: choice === opt.v ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)", background: choice === opt.v ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.02)", color: T.text, cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s ease", display: "flex", flexDirection: "column" as const, gap: 6, width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: T.muted }}>{opt.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: T.text }}>{opt.label}</span>
                </div>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>{opt.sub}</p>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn
              onClick={() => {
                if (choice === "archive") {
                  const recentCount = getRecentReleaseCount(dreamId, 90);
                  if (recentCount >= 2) setShowThreeRelease(true);
                  else setStep(STEP_RITUAL);
                } else if (choice === "shrink") {
                  router.push(`/coach/${dreamId}`);
                } else {
                  handleConfirm();
                }
              }}
              disabled={choice === ""}
              label={choice === "shrink" ? "Start with 5 minutes →" : choice === "archive" ? "Archive this dream →" : choice === "rest" ? "Set it down for 30 days →" : "Continue →"}
            />
            <button onClick={() => setStep(STEP_INSIGHT)} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>← Back</button>
          </div>
        </div>
      </main>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── STEP 5: RITUAL ────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  if (step === STEP_RITUAL) {
    const prompt       = RITUAL_PROMPTS[ritualStep];
    const canContinue  = ritualAnswers[ritualStep].trim().length > 3;
    const isLastRitual = ritualStep === RITUAL_PROMPTS.length - 1;
    return (
      <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px" }}>
          <ProgressDots current={5} total={7} />
          <SectionLabel>{`Reflection ${ritualStep + 1} of ${RITUAL_PROMPTS.length}`}</SectionLabel>
          <p style={{ fontSize: 20, fontWeight: 300, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>{prompt.prompt}</p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>Write whatever comes. There&apos;s no right answer.</p>
        </div>
        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
          <textarea
            value={ritualAnswers[ritualStep]}
            onChange={(e) => { const u = [...ritualAnswers]; u[ritualStep] = e.target.value; setRitualAnswers(u); }}
            placeholder={prompt.placeholder}
            rows={6}
            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "14px 16px", color: T.text, fontSize: 14, lineHeight: 1.65, resize: "none" as const, outline: "none", boxSizing: "border-box" as const, marginBottom: 20, fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextBtn
              onClick={() => { if (isLastRitual) handleConfirm(); else setRitualStep(ritualStep + 1); }}
              disabled={!canContinue}
              label={isLastRitual ? "Release this dream ✧" : "Continue →"}
            />
            <button onClick={() => { if (ritualStep > 0) setRitualStep(ritualStep - 1); else setStep(STEP_CHOICE); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>← Back</button>
          </div>
        </div>
      </main>
    );
  }

  // Fallback
  return (
    <main style={{ background: T.bg, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", maxWidth: 430, margin: "0 auto" }}>
      <p style={{ fontSize: 14, color: T.muted }}>Loading...</p>
    </main>
  );
}
