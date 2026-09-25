"use client";

/**
 * Field step 2: the phone is held to the tag.
 * No app, no account, no wallet — the browser opens on its own.
 */
export default function StepTap({ progress }: { progress: number }) {
  const phase = progress < 0.28 ? 0 : progress < 0.62 ? 1 : 2;

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">In the field · 2</p>
        <h2 className="dstep-title">A phone is held to the tag</h2>
        <p className="dstep-body">
          <mark className="dstep-mark">No app, no account, no wallet.</mark>{" "}
          The phone is held near the part and the browser opens on its own.
        </p>
        <p className="dstep-body">
          The chip answers with a code it has never produced before. Every tap
          is different, so a code captured once is worthless the second time.
        </p>
        <p className="dstep-body">
          Nobody has to be taught anything, and nobody has to trust the person
          selling the part.
        </p>
      </div>

      <div className="tp-scene" data-phase={phase}>
        <img src="/images/part2.png" alt="" className="tp-part" />
        <img src="/images/logo.png" alt="" className="tp-tag" />

        <div className="tp-waves" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <img
          src="/images/hand-phone.png"
          alt="Hand holding a phone near the part"
          className="tp-hand"
        />

        <div className="tp-caption">
          <span className="swap" data-show={String(phase)}>
            <span data-v="0">Hold the phone near the part</span>
            <span data-v="1">The chip answers</span>
            <span data-v="2">The browser opens on its own</span>
          </span>
        </div>
      </div>
    </div>
  );
}
