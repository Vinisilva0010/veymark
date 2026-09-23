"use client";

import { useEffect, useState } from "react";

type DemoPart = {
  chipUid: string;
  model: string;
  batch: string;
  manufacturerName: string;
};

type Tap = {
  piccData: string;
  cmac: string;
  counter: number;
  mode: "genuine" | "forged";
};

type Verdict = {
  result: "authentic" | "unverified" | "alert";
  chainStatus: "confirmed" | "unavailable" | "mismatch" | null;
  part: {
    model: string;
    batch: string;
    manufacturerName: string;
    mintSignature: string | null;
  } | null;
  alertReason?: string;
};

type Action = "genuine" | "replay" | "forged";

const STAMP: Record<Verdict["result"], string> = {
  authentic: "AUTHENTIC",
  unverified: "UNKNOWN",
  alert: "REJECTED",
};

export default function DemoBench() {
  const [parts, setParts] = useState<DemoPart[]>([]);
  const [selected, setSelected] = useState<DemoPart | null>(null);
  const [lastTap, setLastTap] = useState<Tap | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [payload, setPayload] = useState<Tap | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/demo/parts")
      .then((r) => r.json())
      .then((d) => {
        setParts(d.parts ?? []);
        if (d.parts?.length) setSelected(d.parts[0]);
      })
      .catch(() => setError("Could not load demo parts."));
  }, []);

  async function verify(tap: Tap) {
    const res = await fetch(
      `/api/verify?picc_data=${tap.piccData}&cmac=${tap.cmac}`
    );
    return (await res.json()) as Verdict;
  }

  async function run(action: Action) {
    if (!selected) return;
    setBusy(action);
    setError(null);
    setVerdict(null);

    try {
      // Replay deliberately reuses the exact payload from the previous tap.
      // Nothing new is generated: the same bytes that just passed are sent
      // again, and the counter check rejects them.
      let tap: Tap;
      if (action === "replay") {
        if (!lastTap) {
          setError("Tap the part first, then replay that tap.");
          return;
        }
        tap = lastTap;
      } else {
        const res = await fetch("/api/demo/tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chipUid: selected.chipUid,
            mode: action === "forged" ? "forged" : "genuine",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not generate a tap.");
          return;
        }
        tap = data.tap;
        if (action === "genuine") setLastTap(tap);
      }

      setPayload(tap);
      setVerdict(await verify(tap));
    } catch {
      setError("Something went wrong reaching the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="bench">
      <header className="bench-head">
        <p className="bench-kicker">Veymark test bench</p>
        <h1 className="bench-title">
          Tap a part.
          <br />
          Then try to fool it.
        </h1>
        <p className="bench-lede">
          No tag in your hand? Every tap below is built on the server with the
          same AES-128 scheme a real chip runs, then checked by the same public
          endpoint a real tap hits. Nothing here is mocked.
        </p>
      </header>

      <section className="bench-step">
        <h2 className="bench-step-title">Pick a part</h2>
        <div className="bench-parts">
          {parts.map((part) => (
            <button
              key={part.chipUid}
              type="button"
              onClick={() => {
                setSelected(part);
                setVerdict(null);
                setPayload(null);
                setLastTap(null);
              }}
              className={`bench-part ${
                selected?.chipUid === part.chipUid ? "is-on" : ""
              }`}
            >
              <span className="bench-part-model">{part.model}</span>
              <span className="bench-part-meta">
                {part.manufacturerName} / {part.batch}
              </span>
              <span className="bench-part-uid">{part.chipUid}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bench-step">
        <h2 className="bench-step-title">Run a tap</h2>
        <div className="bench-actions">
          <button
            type="button"
            onClick={() => run("genuine")}
            disabled={busy !== null || !selected}
            className="bench-btn is-primary"
          >
            <span className="bench-btn-n">1</span>
            <span>
              <strong>Tap the part</strong>
              <em>A fresh payload from the chip</em>
            </span>
          </button>

          <button
            type="button"
            onClick={() => run("replay")}
            disabled={busy !== null || !lastTap}
            className="bench-btn"
          >
            <span className="bench-btn-n">2</span>
            <span>
              <strong>Replay that tap</strong>
              <em>The exact same bytes, sent twice</em>
            </span>
          </button>

          <button
            type="button"
            onClick={() => run("forged")}
            disabled={busy !== null || !selected}
            className="bench-btn"
          >
            <span className="bench-btn-n">3</span>
            <span>
              <strong>Tap a forged tag</strong>
              <em>Right UID, attacker&rsquo;s own key</em>
            </span>
          </button>
        </div>
        {error && <p className="bench-error">{error}</p>}
      </section>

      {(busy || verdict) && (
        <section className="bench-step">
          <h2 className="bench-step-title">Result</h2>

          {busy ? (
            <p className="bench-working">Checking the payload...</p>
          ) : (
            verdict && (
              <div className="bench-slip">
                <div className={`bench-stamp is-${verdict.result}`}>
                  {STAMP[verdict.result]}
                </div>

                {verdict.result === "authentic" && verdict.part && (
                  <div className="bench-lines">
                    <p>
                      <span>Part</span>
                      <span>{verdict.part.model}</span>
                    </p>
                    <p>
                      <span>Made by</span>
                      <span>{verdict.part.manufacturerName}</span>
                    </p>
                    <p>
                      <span>Batch</span>
                      <span>{verdict.part.batch}</span>
                    </p>
                    <p>
                      <span>Public record</span>
                      <span>
                        {verdict.chainStatus === "confirmed"
                          ? "Confirmed on Solana"
                          : "Could not be read now"}
                      </span>
                    </p>
                  </div>
                )}

                {verdict.result === "alert" && (
                  <p className="bench-reason">{verdict.alertReason}</p>
                )}

                {verdict.result === "unverified" && (
                  <p className="bench-reason">
                    The signature does not match any key we issued. The tag is
                    not one of ours &mdash; which is not the same as calling the
                    product fake.
                  </p>
                )}

                {payload && (
                  <div className="bench-payload">
                    <p className="bench-payload-label">
                      The bytes that were checked
                    </p>
                    <code>picc_data={payload.piccData}</code>
                    <code>cmac={payload.cmac}</code>
                    <code>counter={payload.counter}</code>
                  </div>
                )}

                {verdict.result === "authentic" &&
                  verdict.part?.mintSignature && (
                    <a
                      className="bench-proof"
                      href={`https://explorer.solana.com/tx/${verdict.part.mintSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      See the mint transaction on Solana
                    </a>
                  )}
              </div>
            )
          )}
        </section>
      )}

      <footer className="bench-foot">
        <p>
          Physical tags are not in our hands yet. The chip is simulated; the
          cryptography, the replay check and the on-chain record are not.
        </p>
      </footer>
    </main>
  );
}
