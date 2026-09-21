"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type ChainStatus = "confirmed" | "unavailable" | "mismatch";

type VerificationResponse = {
  result: "authentic" | "unverified" | "alert";
  chainStatus: ChainStatus | null;
  part: {
    model: string;
    description: string | null;
    batch: string;
    provisionedAt: string;
    manufacturerName: string;
    manufacturerVerified: boolean;
    assetId: string | null;
  } | null;
  firstVerification: boolean;
  verificationCount: number;
  alertReason?: string;
};

function explorerUrl(assetId: string) {
  // XRAY is used instead of Solscan: Solscan does not index compressed NFTs
  // on devnet, so the link would open an empty page — the opposite of what a
  // proof link is for.
  return `https://xray.helius.xyz/token/${assetId}?network=devnet`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function VerifyContent() {
  const params = useSearchParams();
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  const piccData = params.get("picc_data");
  const cmac = params.get("cmac");

  useEffect(() => {
    if (!piccData || !cmac) {
      setLoading(false);
      setFailed(true);
      return;
    }

    fetch(`/api/verify?picc_data=${piccData}&cmac=${cmac}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [piccData, cmac]);

  if (loading) {
    return (
      <div className="vm-v-card">
        <div className="vm-v-spin" />
        <p className="vm-v-loading">Checking the chip...</p>
      </div>
    );
  }

  if (failed || !data) {
    return (
      <div className="vm-v-card">
        <div className="vm-v-badge is-warn">!</div>
        <h1 className="vm-v-title">Could not verify</h1>
        <p className="vm-v-body">
          This link is missing the data a tag provides. Hold your phone near the
          part again.
        </p>
      </div>
    );
  }

  if (data.result === "unverified") {
    return (
      <div className="vm-v-card">
        <div className="vm-v-badge is-warn">!</div>
        <h1 className="vm-v-title">Could not verify</h1>
        <p className="vm-v-body">
          This tag matches no record. It may be a damaged tag or a product that
          was never registered.{" "}
          <strong>This does not confirm the product is fake.</strong>
        </p>
        <div className="vm-v-note">
          Confirm through the manufacturer&apos;s official channel — the one
          channel a counterfeiter does not control.
        </div>
        <p className="vm-v-foot">Sealed by Veymark</p>
      </div>
    );
  }

  if (data.result === "alert") {
    return (
      <div className="vm-v-card">
        <div className="vm-v-badge is-alert">!</div>
        <h1 className="vm-v-title">Unusual verification</h1>
        <p className="vm-v-body">{data.alertReason}</p>
        {data.part && (
          <dl className="vm-v-data">
            <div>
              <dt>Part</dt>
              <dd>{data.part.model}</dd>
            </div>
            <div>
              <dt>Batch</dt>
              <dd>{data.part.batch}</dd>
            </div>
          </dl>
        )}
        <div className="vm-v-note">
          The cryptography passed, so a genuine part exists. Contact the
          manufacturer to find out which one you are holding.
        </div>
        <p className="vm-v-foot">Sealed by Veymark</p>
      </div>
    );
  }

  const part = data.part!;

  return (
    <div className="vm-v-card">
      <span className="vm-v-eyebrow">Part verified for</span>
      <p className="vm-v-maker">{part.manufacturerName}</p>

      <div className="vm-v-badge is-ok">✓</div>
      <h1 className="vm-v-title">Authentic part</h1>

      <span className="vm-v-chip">NXP silicon verified</span>

      {data.firstVerification ? (
        <p className="vm-v-first">First verification of this code</p>
      ) : (
        <p className="vm-v-first">
          Verified {data.verificationCount} times
        </p>
      )}

      <dl className="vm-v-data">
        <div>
          <dt>Part</dt>
          <dd>{part.model}</dd>
        </div>
        <div>
          <dt>Batch</dt>
          <dd>{part.batch}</dd>
        </div>
        <div>
          <dt>Made</dt>
          <dd>{formatDate(part.provisionedAt)}</dd>
        </div>
      </dl>

      {/* The chain status is shown, never hidden. If the public record cannot
          be read, the screen says so — hiding it would undermine the one proof
          that does not depend on trusting us. */}
      <div
        className={`vm-v-chain ${
          data.chainStatus === "confirmed" ? "is-ok" : "is-pending"
        }`}
      >
        {data.chainStatus === "confirmed" ? (
          <>
            <span>Public record confirmed on Solana</span>
            {part.assetId && (
              
              <a  href={explorerUrl(part.assetId)}
                target="_blank"
                rel="noopener noreferrer"
                className="vm-v-link"
              >
                View the proof &rarr;
              </a>
            )}
          </>
        ) : (
          <>
            <span>Public record could not be read right now</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="vm-v-retry"
            >
              Try again
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExplainOpen((v) => !v)}
        className="vm-v-explain-btn"
      >
        How do we know it&apos;s authentic? {explainOpen ? "▲" : "▼"}
      </button>

      {explainOpen && (
        <div className="vm-v-explain">
          <p>
            The chip in this part holds a secret it never reveals. Every time
            you tap it, it proves it knows that secret without ever showing it —
            like proving you know a password without saying it out loud.
          </p>
          <p>
            A copied code fails, because the chip produces a different answer
            every single time. And the record above lives on a public network
            that nobody, including us, can rewrite after the fact.
          </p>
        </div>
      )}

      <p className="vm-v-foot">Sealed by Veymark</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="vm-v">
      <Suspense
        fallback={
          <div className="vm-v-card">
            <div className="vm-v-spin" />
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </main>
  );
}
