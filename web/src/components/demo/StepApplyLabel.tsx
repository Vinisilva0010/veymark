"use client";

/**
 * Step 6: the result, then where the label goes and what that proves.
 *
 * A tag on a sealed case proves the case. It says nothing about the cells and
 * boards inside it, so a workshop can open the case, swap the internals and
 * close it again with the tag still reading as authentic. Two things answer
 * that, and this scene shows both because they are one question: the label is
 * applied across the opening, so opening the case tears the antenna, and the
 * parts that belong inside are registered in their own right.
 *
 * Four phases drive off scroll progress. Every element stays in the page and
 * is shown or hidden with CSS — mounting and unmounting breaks browser
 * translation, which rewrites text nodes React then cannot find.
 */
export default function StepApplyLabel({ progress }: { progress: number }) {
  const phase =
    progress < 0.24 ? 0 : progress < 0.48 ? 1 : progress < 0.72 ? 2 : 3;

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">Step 6</p>
        <h2 className="dstep-title">
          Where the label goes, and what is inside
        </h2>
        <p className="dstep-body">
          The screen says <mark className="dstep-mark">written</mark> or{" "}
          <mark className="dstep-mark">stop</mark> before the operator picks up
          the label. If it were unclear, a real part could end up with a tag
          the system never recorded, and it would fail every check from then
          on.
        </p>
        <p className="dstep-body">
          A battery is a closed box. The tag proves the box is real, but not
          what is inside it, so the label is stuck{" "}
          <mark className="dstep-mark">
            over the gap between the lid and the box
          </mark>
          . To open the box you have to tear the label, and a torn label stops
          working.
        </p>
        <p className="dstep-body">
          The cell and the board inside have tags of their own, recorded as
          belonging to this battery. If someone swaps the cell,{" "}
          <mark className="dstep-mark">the new one is not in the record</mark>.
        </p>
      </div>

      <div className="al-scene sl-scene" data-phase={phase}>
        <div className="al-phone">
          <div className="al-screen">
            <div className="al-state al-state-writing">
              <span className="al-spin" />
              <p>Writing the tag</p>
            </div>
            <div className="al-state al-state-done">
              <span className="al-check">OK</span>
              <p className="al-ok-title">Tag written</p>
              <p className="al-ok-note">Stick it over the gap</p>
            </div>
          </div>
        </div>

        <div className="sl-stage">
          <svg className="sl-svg" viewBox="0 0 260 220" aria-hidden="true">
            {/* Case body. The lid is a separate group so it can hinge open. */}
            <rect
              x="30"
              y="96"
              width="200"
              height="96"
              rx="8"
              className="sl-body"
            />
            <rect
              x="30"
              y="96"
              width="200"
              height="14"
              className="sl-body-lip"
            />

            {/* Contents, revealed once the lid is up. */}
            <g className="sl-contents">
              <rect x="50" y="118" width="78" height="60" rx="5" className="sl-cell" />
              <rect x="58" y="128" width="62" height="8" rx="3" className="sl-tag-mini" />
              <text x="89" y="166" className="sl-part-label">CELL</text>

              <rect x="140" y="118" width="70" height="60" rx="5" className="sl-cell" />
              <rect x="148" y="128" width="54" height="8" rx="3" className="sl-tag-mini" />
              <text x="175" y="166" className="sl-part-label">BOARD</text>
            </g>

            {/* Lid. Rotates about the left edge of the seam. */}
            <g className="sl-lid">
              <rect x="30" y="58" width="200" height="44" rx="8" className="sl-body" />
              <rect x="52" y="70" width="60" height="7" rx="3" className="sl-term" />
              <rect x="150" y="70" width="60" height="7" rx="3" className="sl-term" />
              <text x="130" y="94" className="sl-case-label">
                BATTERY PACK BT-90
              </text>
            </g>

            {/* The label is the Veymark mark itself, straddling the seam.
                Clipped into an upper and a lower half so it can tear. */}
            <defs>
              <clipPath id="sl-clip-top">
                <rect x="104" y="72" width="52" height="28" />
              </clipPath>
              <clipPath id="sl-clip-bottom">
                <rect x="104" y="100" width="52" height="28" />
              </clipPath>
            </defs>

            <image
              href="/images/logo.png"
              x="104"
              y="72"
              width="52"
              height="52"
              className="sl-mark sl-mark-top"
              clipPath="url(#sl-clip-top)"
            />
            <image
              href="/images/logo.png"
              x="104"
              y="72"
              width="52"
              height="52"
              className="sl-mark sl-mark-bottom"
              clipPath="url(#sl-clip-bottom)"
            />
          </svg>

          <p className="sl-caption sl-caption-sealed">
            The label covers the gap
          </p>
          <p className="sl-caption sl-caption-torn">
            Opened — the label is torn
          </p>
          <p className="sl-caption sl-caption-inside">
            Each part inside has its own tag
          </p>
        </div>
      </div>
    </div>
  );
}
