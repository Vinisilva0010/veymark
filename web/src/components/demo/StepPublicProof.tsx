"use client";

import { useState } from "react";

const REAL_SIGNATURE =
  "4sMtpP8hkicYvakQ9Bi1wYt9zBvdvqnmGFufgvRcTzF7MTUyDD7UQtdHXKMTG9ra9W1uE5ccnUhynnCBNnMjosz4";

type Outcome = {
  result: "authentic" | "unverified" | "alert";
  chainStatus: string | null;
  part: { model: string; batch: string; manufacturerName: string } | null;
};

/**
 * Field step 4: the proof nobody has to take on trust.
 *
 * The chain record can be read without our site being involved at all. The
 * button here runs a real tap against production — the one place in this
 * story where the reader can check for themselves rather than being shown.
 */
export default function StepPublicProof({ progress }: { progress: number }) {
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shown = progress > 0.2;

  async function runRealCheck() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setOutcome(null);
    try {
      const tapRes = await fetch("/api/demo/tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chipUid: "04DE0000000001" }),
      });
      const tapData = await tapRes.json();
      if (!tapRes.ok) {
        setError("The server would not build that tap.");
        return;
      }
      const res = await fetch(
        "/api/verify?picc_data=" +
          tapData.tap.piccData +
          "&cmac=" +
          tapData.tap.cmac
      );
      setOutcome(await res.json());
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">In the field · 4</p>
        <h2 className="dstep-title">Proof you do not have to take on trust</h2>
        <p className="dstep-body">
          The record lives on Solana, not on our servers. Anyone can read it in
          a block explorer{" "}
          <mark className="dstep-mark">
            without our site being involved at all
          </mark>
          .
        </p>
        <p className="dstep-body">
          That matters because every other link in this chain asks you to trust
          somebody. This one does not.
        </p>
        <p className="dstep-body">
          Run a real check below. It builds a tap with the same cryptography a
          chip uses and sends it through the live endpoint.
        </p>
      </div>

      <div className="pp-scene" data-shown={shown ? "1" : "0"}>
        {/* Nothing else on this page asks to be touched, so this call needs
            to be unmistakable or it gets scrolled past. */}
        <div className="pp-cue">
          <span className="pp-cue-dot" aria-hidden="true" />
          <p>Your turn — check a real part yourself</p>
        </div>

        <button
          type="button"
          onClick={runRealCheck}
          disabled={busy}
          className="pp-run"
        >
          <span className="swap" data-show={busy ? "1" : "0"}>
            <span data-v="0">Click to verify a real part</span>
            <span data-v="1">Verifying against the live system…</span>
          </span>
        </button>

        <p className="pp-note">
          This runs against production: a real tap, real cryptography, and the
          same endpoint a physical tag would reach.
        </p>

        <div className={"pp-out" + (outcome || error ? " is-on" : "")}>
          {error && <p className="pp-error">{error}</p>}
          {outcome && (
            <>
              <p className={"pp-verdict is-" + outcome.result}>
                {outcome.result === "authentic" && "Authentic"}
                {outcome.result === "alert" && "Rejected"}
                {outcome.result === "unverified" && "Not recognised"}
              </p>
              {outcome.part && (
                <p className="pp-detail">
                  {outcome.part.model} · batch {outcome.part.batch} ·{" "}
                  {outcome.part.manufacturerName}
                </p>
              )}
              <p className="pp-detail">
                Chain status: {outcome.chainStatus ?? "not read"}
              </p>
            </>
          )}
        </div>

        <div className="pp-tx">
          <p className="pp-tx-label">A passport minted on devnet</p>
          <code>{REAL_SIGNATURE.slice(0, 32)}…</code>
          <button
            type="button"
            className="pp-tx-link"
            onClick={() =>
              window.open(
                "https://explorer.solana.com/tx/" +
                  REAL_SIGNATURE +
                  "?cluster=devnet",
                "_blank",
                "noopener"
              )
            }
          >
            Open it on Solana Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
