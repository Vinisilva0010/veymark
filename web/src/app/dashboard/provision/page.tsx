"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const CORAL = "#f73962";
const WINE = "#500414";

type Product = { id: string; model: string };

type Pending = {
  id: string;
  chip_uid: string;
  batch: string;
  model: string;
  mint_attempts: number;
  mint_last_error: string | null;
};

type Outcome =
  | {
      kind: "written";
      chipUid: string;
      keyHex: string;
      assetId: string | null;
      mintStatus: "pending" | "minted";
    }
  | { kind: "failed"; chipUid: string; message: string };

export default function ProvisionPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);

  // Product and batch are chosen once per shift, then every tag inherits them.
  // Re-entering them per unit would be the main source of operator error.
  const [productId, setProductId] = useState("");
  const [batch, setBatch] = useState("");
  const [shiftLocked, setShiftLocked] = useState(false);

  const [chipUid, setChipUid] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const uidInput = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const [productsRes, pendingRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/provision"),
    ]);

    if (productsRes.status === 401) {
      router.push("/dashboard/login");
      return;
    }

    setProducts((await productsRes.json()).products ?? []);
    setPending((await pendingRes.json()).pending ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleWrite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setOutcome(null);

    try {
      const response = await fetch("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, chipUid, batch }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setOutcome({
          kind: "failed",
          chipUid,
          message: data.error ?? "Could not register tag",
        });
        return;
      }

      setOutcome({
        kind: "written",
        chipUid: data.result.chipUid,
        keyHex: data.result.tagMasterKeyHex,
        assetId: data.result.assetId,
        mintStatus: data.result.mintStatus,
      });
      setCount((c) => c + 1);
      setChipUid("");
      await load();
    } catch {
      setOutcome({
        kind: "failed",
        chipUid,
        message: "Network error. The tag was not registered.",
      });
    } finally {
      setBusy(false);
      uidInput.current?.focus();
    }
  }

  async function handleRetry(partId: string) {
    setBusy(true);
    try {
      await fetch("/api/provision/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partId }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="vm-dash">
        <p className="vm-loading">Loading...</p>
      </main>
    );
  }

  return (
    <main className="vm-dash">
      <header className="vm-dash-head">
        <div>
          <span className="vm-dash-tag">Provisioning station</span>
          <h1 className="vm-dash-title">Write tags</h1>
          <p className="vm-dash-sub">{count} written this session</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="vm-ghost"
        >
          Back
        </button>
      </header>

      {!shiftLocked ? (
        <section className="vm-section">
          <h2 className="vm-h2">Start a run</h2>
          <p className="vm-hint">
            Pick the product and batch once. Every tag written after this
            inherits them.
          </p>

          <div className="vm-card vm-form">
            <label className="vm-field">
              <span className="vm-label">Product</span>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="vm-input"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.model}
                  </option>
                ))}
              </select>
            </label>

            <label className="vm-field">
              <span className="vm-label">Batch</span>
              <input
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="4521"
                className="vm-input"
              />
            </label>

            <button
              type="button"
              disabled={!productId || !batch.trim()}
              onClick={() => setShiftLocked(true)}
              className="vm-submit"
            >
              Start writing
            </button>
          </div>
        </section>
      ) : (
        <section className="vm-section">
          <div className="vm-runbar">
            <div>
              <span className="vm-runlabel">Current run</span>
              <p className="vm-runvalue">
                {products.find((p) => p.id === productId)?.model} · batch{" "}
                {batch}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShiftLocked(false);
                setOutcome(null);
              }}
              className="vm-ghost"
            >
              Change
            </button>
          </div>

          <form onSubmit={handleWrite} className="vm-card vm-form">
            <label className="vm-field">
              <span className="vm-label">Chip UID</span>
              <input
                ref={uidInput}
                value={chipUid}
                onChange={(e) => setChipUid(e.target.value)}
                placeholder="04AABBCCDDEE80"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                className="vm-input vm-uid"
              />
            </label>
            <button type="submit" disabled={busy} className="vm-submit">
              {busy ? "Writing..." : "Write tag"}
            </button>
          </form>

          {/* The result takes the whole screen on purpose. The operator is
              about to apply a physical label to a part: an ambiguous signal
              here puts an unrecognised tag into the world. */}
          {outcome?.kind === "written" && (
            <div className="vm-result is-ok" role="status">
              <span className="vm-result-icon">OK</span>
              <h3 className="vm-result-title">Tag registered</h3>
              <p className="vm-result-body">
                Apply the label to the part now.
              </p>
              <dl className="vm-result-data">
                <div>
                  <dt>Chip UID</dt>
                  <dd>{outcome.chipUid}</dd>
                </div>
                <div>
                  <dt>Passport</dt>
                  <dd>
                    {outcome.mintStatus === "minted"
                      ? "Minted on-chain"
                      : "Pending — part is already verifiable"}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {outcome?.kind === "failed" && (
            <div className="vm-result is-bad" role="alert">
              <span className="vm-result-icon">STOP</span>
              <h3 className="vm-result-title">Not registered</h3>
              <p className="vm-result-body">
                Do not apply this label. {outcome.message}
              </p>
            </div>
          )}
        </section>
      )}

      {pending.length > 0 && (
        <section className="vm-section">
          <h2 className="vm-h2">Passports pending</h2>
          <p className="vm-hint">
            These parts are registered and verifiable. Only the public record is
            missing.
          </p>
          <ul className="vm-list">
            {pending.map((item) => (
              <li key={item.id} className="vm-card vm-item">
                <div className="vm-item-main">
                  <h3 className="vm-item-model">{item.chip_uid}</h3>
                  <p className="vm-item-desc">
                    {item.model} · batch {item.batch} · {item.mint_attempts}{" "}
                    {item.mint_attempts === 1 ? "attempt" : "attempts"}
                  </p>
                  {item.mint_last_error && (
                    <p className="vm-item-desc">{item.mint_last_error}</p>
                  )}
                </div>
                <div className="vm-row vm-actions">
                  <button
                    type="button"
                    onClick={() => handleRetry(item.id)}
                    disabled={busy}
                    className="vm-ghost"
                  >
                    Retry mint
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

    </main>
  );
}
