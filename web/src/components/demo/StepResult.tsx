"use client";

/**
 * Field step 3: the answer appears.
 * The manufacturer's name leads, because that is the name the buyer trusts.
 */
export default function StepResult({ progress }: { progress: number }) {
  const shown = progress > 0.16;
  const rowsIn = progress > 0.4;
  const chainIn = progress > 0.66;

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">In the field · 3</p>
        <h2 className="dstep-title">The answer, in seconds</h2>
        <p className="dstep-body">
          <mark className="dstep-mark">The maker&rsquo;s name comes first</mark>
          , not ours. That is the name the buyer already trusts, and the one a
          counterfeiter is pretending to be.
        </p>
        <p className="dstep-body">
          Model, batch and date are there to be compared against the invoice
          and the box in the buyer&rsquo;s hands.
        </p>
        <p className="dstep-body">
          When a tag does not check out, the screen says it could not verify —{" "}
          <mark className="dstep-mark">never that the part is fake</mark>. A
          damaged tag and a forged one look identical to software, and
          accusing an honest buyer is the worse mistake.
        </p>
      </div>

      <div
        className="rr-scene"
        data-shown={shown ? "1" : "0"}
        data-rows={rowsIn ? "1" : "0"}
        data-chain={chainIn ? "1" : "0"}
      >
        <div className="rr-phone">
          <div className="rr-screen">
            <p className="rr-eyebrow">Part verified for</p>
            <p className="rr-maker">Demo Auto Parts</p>

            <div className="rr-check">
              <span>OK</span>
            </div>
            <p className="rr-verdict">Authentic part</p>
            <p className="rr-chip">Chip verified</p>

            <div className="rr-rows">
              <div>
                <span>Part</span>
                <strong>Shock Absorber XR-40</strong>
              </div>
              <div>
                <span>Batch</span>
                <strong>2410-A</strong>
              </div>
              <div>
                <span>Made</span>
                <strong>18 Sep 2026</strong>
              </div>
            </div>

            <div className="rr-chain">
              <span>Public record confirmed on Solana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
