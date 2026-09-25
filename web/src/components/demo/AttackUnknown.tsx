"use client";

import AttackRunner from "./AttackRunner";

/**
 * Attack 3: a chip the factory never issued.
 *
 * The attacker buys real NTAG 424 chips — they are sold openly — and writes
 * them with keys of their own. The cryptography inside is genuine. What is
 * missing is the only thing that matters: the key was never created by a
 * manufacturer, so it exists nowhere in the system.
 */
export default function AttackUnknown({ progress }: { progress: number }) {
  const shown = progress > 0.14;

  async function run() {
    // A part the factory never provisioned: no key of ours was ever stored
    // for it, so nothing can validate the reading.
    const res = await fetch("/api/demo/tap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chipUid: "04DE0000000001", mode: "forged" }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return { piccData: data.tap.piccData, cmac: data.tap.cmac };
  }

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">Attack 3</p>
        <h2 className="dstep-title">Use a real chip the factory never issued</h2>
        <p className="dstep-body">
          These chips are sold openly. Anyone can buy a box of them and write
          their own keys — the cryptography inside is genuine.
        </p>
        <p className="dstep-body">
          It changes nothing.{" "}
          <mark className="dstep-mark">
            A key only counts if a manufacturer created it
          </mark>
          , on the line, for a part that exists.
        </p>
        <p className="dstep-body">
          And notice what the screen says: not recognised — never fake. A
          damaged tag looks identical to software, and{" "}
          <mark className="dstep-mark">
            calling an honest buyer a counterfeiter is the worse mistake
          </mark>
          .
        </p>
      </div>

      <div className="ak-scene" data-shown={shown ? "1" : "0"}>
        <div className="ak-visual">
          <div className="ak-card is-first">
            <span className="ak-card-label">Real chip</span>
            <span className="ak-card-state is-ok">Bought openly</span>
          </div>
          <div className="ak-arrow" aria-hidden="true" />
          <div className="ak-card is-copy">
            <span className="ak-card-label">In our records</span>
            <span className="ak-card-state is-bad">Never issued</span>
          </div>
        </div>

        <AttackRunner
          cta="Tap a chip we never issued"
          expected="unverified"
          run={run}
        />
      </div>
    </div>
  );
}
