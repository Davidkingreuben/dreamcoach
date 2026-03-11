# Dream Coach

A Next.js 14 PWA for structured psychological self-reflection on delayed dreams. No account, no backend — everything saved locally in the browser.

## Features

- **Dream Assessment** — 19-question deep-dive covering the dream, your resistance pattern, and reality check
- **SEEN / HELD / MOVED** — Psychological insight engine that names your archetype and gives a personalised first step
- **Daily Check-In** — 5-prompt check-in with mode selection (Do / Plan / Learn / Rest), tiny action tracking, and hard-day honesty
- **Dream Momentum Graph** — SVG-based momentum score over time, with resilience detection and layer filtering
- **Personal Best & Grace Days** — Streak tracking with a rolling 3-grace-day window so life doesn't break your streak
- **XP System** — Points earned for check-ins, actions, restarts, weekly tokens, and milestones
- **Contextual Quotes** — Selected based on current streak state (restart / milestone / struggling / consistent)
- **Badges** — 17 badges including Returner, Fail Fast, Clarity Seeker, Personal Best
- **Weekly Tokens** — Collect a weekly token after 3+ check-ins with a focus reflection
- **Dream Team** — Invite-code-based accountability teams (1–5 people), no leaderboards, private by default
- **Dream Release** — Intentional 3-reflection closure path for dreams you're setting down
- **PWA** — Installable on iOS and Android, works offline

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** (`strict: true`)
- **localStorage only** — zero backend, zero auth
- **No UI library** — all inline styles, dark theme via CSS variables
- **Zero runtime dependencies** beyond React + Next.js

## Getting Started

```bash
git clone <your-repo>
cd dreamblock
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── check/page.tsx          # 19-step dream assessment + insight screen
│   ├── checkin/page.tsx        # Legacy quick check-in
│   ├── coach/[id]/
│   │   ├── CoachClient.tsx     # Daily check-in, streak, PB, XP, milestones
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── DashboardClient.tsx # Dream cards with streak/PB/XP display
│   │   └── page.tsx
│   ├── momentum/[id]/
│   │   ├── MomentumClient.tsx  # SVG momentum graph with layer tabs
│   │   └── page.tsx
│   ├── release/[id]/page.tsx   # 3-step dream release reflection
│   ├── results/[id]/
│   │   ├── ResultsClient.tsx   # Full assessment results (3 tabs)
│   │   └── page.tsx
│   ├── team/
│   │   ├── TeamClient.tsx      # Dream Team create/join/signal
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Home / landing
├── components/
│   ├── PWARegister.tsx
│   └── ShareButton.tsx
└── lib/
    ├── logic/
    │   ├── archetypes.ts       # Resistance archetype detection
    │   ├── classification.ts   # Dream viability classification
    │   ├── insight.ts          # SEEN/HELD/MOVED engine
    │   └── microsteps.ts       # Archetype-calibrated first steps
    ├── storage.ts              # All localStorage read/write + business logic
    └── types.ts                # All TypeScript interfaces and types
```

## Build

```bash
npm run build   # TypeScript + ESLint check + production build
npm run lint    # ESLint only
```

## Deploy

Deploys as a standard Next.js app — Vercel, Netlify, or any Node host. No environment variables required.
