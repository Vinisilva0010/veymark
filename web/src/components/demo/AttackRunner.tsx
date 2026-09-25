"use client";

import { useState } from "react";

export type Verdict = {
  result: "authentic" | "unverified" | "alert";
  alertReason?: string;
};

const LABEL: Record<Verdict["result"], string> = {
  authentic: "Accepted",
  unverified: "Not recognised",
  alert: "Rejected",
};

/**
 * Shared control for the attack scenes: runs a real check and shows the
 * verdict the live system returned.
 *
 * `run` is supplied by each attack and must return the payload it wants
 * verified, so the attack itself stays in its own scene.
 */
export default function AttackRunner({
  cta,
  expected,
  run,
}: {
  cta: string;
  expected: Verdict["result"];
  run: () => Promise<{ piccData: string; cmac: string } | null>;
}) {
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setVerdict(null);

    try {
      const tap = await run();
      if (!tap) {
        setError("The server would not build that attempt.");
        return;
      }
      setPayload(tap.piccData);
      const res = await fetch(
        "/api/verify?picc_data=" + tap.piccData + "&cmac=" + tap.cmac
      );
      setVerdict(await res.json());
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const held = verdict !== null && verdict.result === expected;

  return (
    <div className="ak-runner">
      <button type="button" onClick={go} disabled={busy} className="ak-go">
        <span className="swap" data-show={busy ? "1" : "0"}>
          <span data-v="0">{cta}</span>
          <span data-v="1">Running it for real…</span>
        </span>
      </button>

      <div className={"ak-out" + (verdict || error ? " is-on" : "")}>
        {error && <p className="ak-error">{error}</p>}

        {verdict && (
          <>
            <p className={"ak-verdict is-" + verdict.result}>
              {LABEL[verdict.result]}
            </p>
            {verdict.alertReason && (
              <p className="ak-reason">{verdict.alertReason}</p>
            )}
            {payload && (
              <code className="ak-payload">{payload.slice(0, 32)}</code>
            )}
            {held && <p className="ak-held">The attack did not get through.</p>}
          </>
        )}
      </div>
    </div>
  );
}
