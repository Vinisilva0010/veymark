"use client";

import { useRef } from "react";
import AttackRunner from "./AttackRunner";

/**
 * Attack 1: capture a valid reading and use it again.
 *
 * The captured payload is kept and replayed verbatim. Its signature is
 * perfect — it was produced by the genuine key — and it still fails, because
 * the counter inside it has already been used.
 */
export default function AttackReplay({ progress }: { progress: number }) {
  const captured = useRef<{ piccData: string; cmac: string } | null>(null);
  const shown = progress > 0.14;

  async function run() {
    // First press captures a genuine reading; later presses send that exact
    // one again. Nothing is regenerated.
    if (!captured.current) {
      const res = await fetch("/api/demo/tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chipUid: "04DE0000000002" }),
      });
      const data = await res.json();
      if (!res.ok) return null;
      captured.current = { piccData: data.tap.piccData, cmac: data.tap.cmac };

      // Spend it once, so the replay below is genuinely a second use.
      await fetch(
        "/api/verify?picc_data=" +
          captured.current.piccData +
          "&cmac=" +
          captured.current.cmac
      );
    }
    return captured.current;
  }

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">Attack 1</p>
        <h2 className="dstep-title">Copy a reading and use it again</h2>
        <p className="dstep-body">
          Someone watches a genuine part being checked and keeps the exact
          data it produced. Then they send it again, for a different part.
        </p>
        <p className="dstep-body">
          <mark className="dstep-mark">
            The signature on it is perfect
          </mark>{" "}
          — it came from the real key. Nothing about it is forged.
        </p>
        <p className="dstep-body">
          It still fails. Each reading carries a counter that only moves
          forward, so{" "}
          <mark className="dstep-mark">a reading is worth one use</mark>.
        </p>
      </div>

      <div className="ak-scene" data-shown={shown ? "1" : "0"}>
        <div className="ak-visual">
          <div className="ak-card is-first">
            <span className="ak-card-label">Reading 1</span>
            <span className="ak-card-state is-ok">Accepted</span>
          </div>
          <div className="ak-arrow" aria-hidden="true" />
          <div className="ak-card is-copy">
            <span className="ak-card-label">Same reading, again</span>
            <span className="ak-card-state is-bad">Rejected</span>
          </div>
        </div>

        <AttackRunner
          cta="Replay a captured reading"
          expected="alert"
          run={run}
        />
      </div>
    </div>
  );
}
