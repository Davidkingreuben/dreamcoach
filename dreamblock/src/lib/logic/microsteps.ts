import type { ResistanceArchetype } from "../types";

export interface MicroStepContext {
  category_other?: string;
  protecting_other?: string;
  true_want_other?: string;
}

export function getMicroSteps(
  archetype: ResistanceArchetype,
  dreamTitle: string,
  category: string,
  otherContext?: MicroStepContext,
): string[] {
  const d = dreamTitle || "your project";
  // Use the specific category description when the user typed one
  const cat = (category === "Other" && otherContext?.category_other?.trim())
    ? otherContext.category_other.trim()
    : category;

  const steps: Record<ResistanceArchetype, string[]> = {
    "Fear of Visibility": [
      `Write about ${d} in a private document — no audience, no stakes, no performance`,
      `Share one small piece of work with exactly one person you trust completely, with no expectation of feedback`,
      `Make something deliberately imperfect. Finish it. Don't show it yet — just prove you can complete`,
      `Write down the specific fear: what exactly do you imagine happening when people see this?`,
    ],
    "Perfectionist Freeze": [
      `Set a 25-minute timer. Work on ${d}. Stop when it rings, complete or not`,
      `Define "good enough to proceed" in one sentence before your next session`,
      `Create a rough, unpolished version of one part. Call it your ugly draft — that's the goal`,
      `List every standard you're trying to meet. Circle the ones that actually matter to the work`,
    ],
    "Overwhelm Fog": [
      `Write only the very next physical action — not the project, not the phase, just 15 minutes of work`,
      `Spend 20 minutes listing everything you think you'd need to do, then circle only the first three`,
      `Find one person who has started something similar and read or watch how they began`,
      `Break ${d} into exactly three phases. What is phase one, at its smallest?`,
    ],
    "Identity Conflict": [
      `Write: "A person who does ${cat} for real would..." and complete the sentence without filtering`,
      `Do one private act related to ${d} that no one will see, judge, or know about`,
      `Write about why this matters to you — not to prove it to anyone, just to understand it yourself`,
      `Explore who you'd have to stop being (or pretending to be) if you pursued this`,
    ],
    "Fear of Success": [
      `Write the most realistic version of your life if ${d} works — including what changes and what gets harder`,
      `Identify one specific thing you'd have to give up or renegotiate if this succeeded. Sit with it`,
      `Take the smallest possible forward action — reversible, low-stakes, and private`,
      `Write: "If this succeeds, the thing I'm most afraid of is..." Be specific`,
    ],
    "Shame Loop": [
      `Write a short letter to yourself about the last time you tried this and stopped — without judgment`,
      `Name the specific story you carry about why you failed before. Write what was actually true`,
      `Do one small thing that reclaims forward motion — not a big step, just proof you can move`,
      `Separate what happened from what it means about you. Write both columns honestly`,
    ],
    "Consistency Collapse": [
      `Commit to 15 minutes on ${d} at the same time for the next 7 days — nothing more`,
      `Identify the exact moment you usually quit. Write down what you'll do instead at that moment`,
      `Reduce friction: prepare everything you need the night before so starting costs you nothing`,
      `Define what "showing up" means on a hard day — the minimum viable version`,
    ],
    "Misalignment": [
      `Write: "What I actually want from ${d} is..." and answer without using the dream itself`,
      `Separate what you want (status, feeling, identity, output) from the specific form you've attached to it`,
      `Explore one adjacent thing that gives you the same feeling — without the weight of this dream`,
      `Write honestly: if no one ever knew you pursued this, would you still want to?`,
    ],
  };

  const base = [...(steps[archetype] || steps["Overwhelm Fog"])];

  // Personalise with free-text "Other" context when available
  if (otherContext?.category_other?.trim() && category === "Other") {
    base.unshift(`You mentioned "${otherContext.category_other.trim()}" — spend 10 minutes exploring what that means to you in practice before anything else`);
  }
  if (otherContext?.protecting_other?.trim()) {
    base.push(`You described protecting "${otherContext.protecting_other.trim()}" — keep that in mind as you work through these steps, and move gently past it`);
  }
  if (otherContext?.true_want_other?.trim()) {
    base.push(`You mentioned wanting "${otherContext.true_want_other.trim()}" — hold that honest answer close as your real measure of progress`);
  }

  return base;
}
