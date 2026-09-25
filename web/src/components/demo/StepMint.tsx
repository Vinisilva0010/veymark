"use client";

const LOGO = "/images/logo.png";
// A real passport minted on devnet during development.
const REAL_SIGNATURE =
  "4sMtpP8hkicYvakQ9Bi1wYt9zBvdvqnmGFufgvRcTzF7MTUyDD7UQtdHXKMTG9ra9W1uE5ccnUhynnCBNnMjosz4";

/**
 * Step 5: the part gets its passport on Solana.
 * The passport is filled, stamped with the seal, then joins the chain.
 */
export default function StepMint({ progress }: { progress: number }) {
  const phase =
    progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.75 ? 2 : 3;

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">Step 5</p>
        <h2 className="dstep-title">The part gets its passport on Solana</h2>
        <p className="dstep-body">
          A public record is created for this part:{" "}
          <mark className="dstep-mark">who made it, which batch, and when</mark>
          . Anyone can check it in a block explorer, without asking us and
          without trusting our site.
        </p>
        <p className="dstep-body">
          Every single part gets its own record. On Solana that costs a
          fraction of a cent, which is what makes it possible for a $200 shock
          absorber and not only for luxury goods.
        </p>
        <p className="dstep-body">
          The moment it was created is written into the chain and{" "}
          <mark className="dstep-mark">cannot be rewritten later</mark>.
        </p>
      </div>

      <div className="mt-scene" data-phase={phase}>
        <div className="mt-passport">
          <p className="mt-passport-title">Part passport</p>
          <div className="mt-field">
            <span>Model</span>
            <strong>Shock Absorber XR-40</strong>
          </div>
          <div className="mt-field">
            <span>Batch</span>
            <strong>2410-A</strong>
          </div>
          <div className="mt-field">
            <span>Made by</span>
            <strong>Demo Auto Parts</strong>
          </div>
          <span className="mt-impact" aria-hidden="true" />
          <img src={LOGO} alt="" className="mt-stamp" />
        </div>

        <div className="mt-chain" aria-hidden="true">
          <span className="mt-block" />
          <span className="mt-block" />
          <span className="mt-block" />
          <span className="mt-block is-new" />
        </div>

        <div className="mt-sig">
          <p className="mt-sig-label">Confirmed on Solana devnet</p>
          <code>{REAL_SIGNATURE.slice(0, 30)}…</code>
          <button
            type="button"
            className="mt-sig-link"
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
            Open the real transaction
          </button>
        </div>
      </div>
    </div>
  );
}
