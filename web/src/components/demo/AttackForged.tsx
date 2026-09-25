"use client";

import AttackRunner from "./AttackRunner";

/**
 * Attack 2: a forged tag.
 *
 * The attacker knows the tag number — it can be read off the part with any
 * phone — but not the key inside the chip. So they build a reading with a key
 * of their own, and the signature does not match anything we issued.
 */
export default function AttackForged({ progress }: { progress: number }) {
  const shown = progress > 0.14;

  async function run() {
    const res = await fetch("/api/demo/tap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chipUid: "04DE0000000003", mode: "forged" }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return { piccData: data.tap.piccData, cmac: data.tap.cmac };
  }

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">Attack 2</p>
        <h2 className="dstep-title">Build a fake tag with the right number</h2>
        <p className="dstep-body">
          The tag number is not a secret. Anyone can read it off a genuine part
          with any phone, then put that same number on a tag of their own.
        </p>
        <p className="dstep-body">
          What they cannot copy is the key inside the chip.{" "}
          <mark className="dstep-mark">
            It never leaves the chip and never appears on any screen
          </mark>
          , so they have to sign with a key they made up.
        </p>
        <p className="dstep-body">
          The reading arrives with the right number and a signature that
          matches nothing we ever issued.
        </p>
      </div>

      <div className="ak-scene" data-shown={shown ? "1" : "0"}>
        <div className="ak-visual">
          <div className="ak-card is-first">
            <span className="ak-card-label">Number</span>
            <span className="ak-card-state is-ok">Copied</span>
          </div>
          <div className="ak-arrow" aria-hidden="true" />
          <div className="ak-card is-copy">
            <span className="ak-card-label">Key</span>
            <span className="ak-card-state is-bad">Made up</span>
          </div>
        </div>

        <AttackRunner
          cta="Tap a forged tag"
          expected="unverified"
          run={run}
        />
      </div>
    </div>
  );
}
