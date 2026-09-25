"use client";

/**
 * Field step 1: the part reaches the workshop.
 * The mechanic has no way to tell a genuine part from a copy by looking.
 */
export default function StepPartArrives({ progress }: { progress: number }) {
  const partIn = progress > 0.18;
  const doubtIn = progress > 0.52;

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">In the field · 1</p>
        <h2 className="dstep-title">The part reaches a workshop</h2>
        <p className="dstep-body">
          A box arrives. Inside is a shock absorber that looks exactly like the
          real thing, because{" "}
          <mark className="dstep-mark">a good copy always does</mark>.
        </p>
        <p className="dstep-body">
          The mechanic has no way to tell. The packaging can be reproduced, the
          printed code can be photographed and reprinted, and the part itself
          gives nothing away until it fails.
        </p>
        <p className="dstep-body">
          This is the moment everything before it was built for.
        </p>
      </div>

      <div className="fd-scene" data-in={partIn ? "1" : "0"} data-doubt={doubtIn ? "1" : "0"}>
        <img
          src="/images/mechanic.png"
          alt="Mechanic holding a shock absorber"
          className="fd-mechanic"
        />
        <img src="/images/part2.png" alt="" className="fd-part" />

        <div className="fd-doubt" aria-hidden="true">
          <span>?</span>
        </div>
      </div>
    </div>
  );
}
