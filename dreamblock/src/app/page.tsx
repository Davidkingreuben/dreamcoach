"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ShareButton from "@/components/ShareButton";
import { getDreams } from "@/lib/storage";
import type { Dream } from "@/lib/types";

const COPY_OPTIONS = [
  {
    id: "honest",
    tagline: "That thing you keep telling yourself you'll eventually do.",
    headline: ["DREAM", "COACH"],
    body: "A dream, in this context, simply means a project you've been putting off — starting, finishing, or bringing into the world — whether that's writing a book, releasing music, launching a company, or building something meaningful.",
    sub: "A structured 3-minute assessment that identifies what's actually stopping you from realizing your dream — so you can either bring the idea into reality or finally let it go.",
  },
  {
    id: "direct",
    tagline: "That thing you keep telling yourself you'll eventually do.",
    headline: ["DREAM", "COACH"],
    body: "A dream, in this context, simply means a project you've been putting off — starting, finishing, or bringing into the world — whether that's writing a book, releasing music, launching a company, or building something meaningful.",
    sub: "A structured 3-minute assessment that identifies what's actually stopping you from realizing your dream — so you can either bring the idea into reality or finally let it go.",
  },
  {
    id: "gentle",
    tagline: "That thing you keep telling yourself you'll eventually do.",
    headline: ["DREAM", "COACH"],
    body: "A dream, in this context, simply means a project you've been putting off — starting, finishing, or bringing into the world — whether that's writing a book, releasing music, launching a company, or building something meaningful.",
    sub: "A structured 3-minute assessment that identifies what's actually stopping you from realizing your dream — so you can either bring the idea into reality or finally let it go.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [copyIdx] = useState(() => Math.floor(Math.random() * COPY_OPTIONS.length));
  const copy = COPY_OPTIONS[copyIdx];

  useEffect(() => {
    setDreams(getDreams());
  }, []);

  const activeDreams = dreams.filter((d) => d.status === "active");

  return (
    <main
      style={{
        background: "var(--db-bg)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top,0px) + 20px) 24px 16px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            color: "var(--db-muted)",
            textTransform: "uppercase" as const,
            fontWeight: 500,
          }}
        >
          DREAM COACH
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ShareButton />
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              fontSize: 13,
              color: "var(--db-sub)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 0",
              minHeight: 44,
            }}
          >
            My Dreams
          </button>
        </div>
      </div>

      {/* Active dreams strip */}
      {activeDreams.length > 0 && (
        <div
          className="animate-in"
          style={{ padding: "0 24px 8px", display: "flex", flexDirection: "column", gap: 8 }}
        >
          {activeDreams.slice(0, 3).map((dream) => (
            <button
              key={dream.id}
              onClick={() => router.push(`/coach/${dream.id}`)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                background: "var(--db-surface)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left" as const,
              }}
            >
              <div>
                <p style={{ fontSize: 13, color: "var(--db-text)", fontWeight: 500, margin: 0 }}>{dream.title}</p>
                <p style={{ fontSize: 11, color: "var(--db-muted)", margin: "2px 0 0" }}>{dream.archetype}</p>
              </div>
              <span style={{ fontSize: 18, color: "var(--db-muted)" }}>›</span>
            </button>
          ))}
        </div>
      )}

      {/* Hero */}
      <div
        className="animate-in"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 24px 24px",
        }}
      >
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.15em",
            color: "var(--db-muted)",
            textTransform: "uppercase" as const,
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          {copy.tagline}
        </p>
        <h1
          style={{
            fontSize: 52,
            fontWeight: 200,
            letterSpacing: "-0.03em",
            color: "var(--db-text)",
            lineHeight: 1,
            marginBottom: 2,
          }}
        >
          {copy.headline[0]}
        </h1>
        <h1
          style={{
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--db-text)",
            lineHeight: 1,
            marginBottom: 32,
          }}
        >
          {copy.headline[1]}
        </h1>

        <div style={{ width: 32, height: 1, background: "var(--db-border)", marginBottom: 28 }} />

        <p
          style={{
            fontSize: 17,
            color: "var(--db-sub)",
            fontWeight: 300,
            lineHeight: 1.7,
            marginBottom: 28,
            whiteSpace: "pre-line" as const,
          }}
        >
          {copy.body}
        </p>

        <div
          style={{
            background: "var(--db-surface)",
            borderRadius: 16,
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--db-sub)", lineHeight: 1.7, margin: 0 }}>
            {copy.sub}
          </p>
        </div>

      </div>

      {/* CTA */}
      <div
        style={{
          padding: "16px 24px",
          paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "var(--db-bg)",
        }}
      >
        <button
          onClick={() => router.push("/check")}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: 16,
            background: "var(--db-text)",
            color: "#050510",
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            minHeight: 56,
          }}
        >
          {dreams.length > 0 ? "Add a new dream →" : "Start a Dream Check →"}
        </button>
        {dreams.length > 0 && (
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 16,
              background: "transparent",
              color: "var(--db-sub)",
              fontSize: 14,
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              minHeight: 52,
            }}
          >
            View all my dreams
          </button>
        )}
        <p style={{ textAlign: "center" as const, fontSize: 11, color: "var(--db-muted)" }}>
          ~3 minutes · Private · No account required
        </p>
      </div>
    </main>
  );
}
