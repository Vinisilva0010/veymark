"use client";

const LOGO = "/images/logo.png";

/**
 * Step 3: the run is set and the tag is read.
 * The phone crosses to the tag and the chip's number arrives on its own.
 */
export default function StepReadTag({ progress }: { progress: number }) {
  const phase = progress < 0.3 ? 0 : progress < 0.62 ? 1 : 2;

  return (
    <div className="rt-grid">
      <div className="rt-copy">
        <p className="rt-tag">Step 3</p>
        <h2 className="rt-title">The run is set, the tag is read</h2>

        <p className="rt-body">
          Product and batch are picked{" "}
          <mark className="rt-mark">once at the start of the shift</mark>.
          Entering them again on every unit is where mistakes come from, and a
          wrong batch follows that part for the rest of its life.
        </p>

        <p className="rt-body">
          After that the operator types nothing. The tag is held to the reader
          and its number arrives on its own.
        </p>

        <p className="rt-body">
          That number is burned into the chip when it is made. It is printed
          nowhere and entered by nobody, so{" "}
          <mark className="rt-mark">
            a wrong digit can never tie a real key to the wrong part
          </mark>
          .
        </p>
      </div>

      <div className="rt-scene" data-phase={phase}>
        <img src={LOGO} alt="Veymark tag" className="rt-logo" />

        <div className="rt-waves" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="rt-phone">
          <div className="rt-screen">
            <p className="rt-brand">Provisioning</p>

            <div className="rt-row">
              <span>Product</span>
              <strong>Shock Absorber XR-40</strong>
            </div>
            <div className="rt-row">
              <span>Batch</span>
              <strong>2410-A</strong>
            </div>
            <div className="rt-row">
              <span>Tag number</span>
              <strong className="rt-mono">
                <span className="swap" data-show={phase === 2 ? "1" : "0"}>
                  <span data-v="0">— — — —</span>
                  <span data-v="1">04A7F2C13B9E60</span>
                </span>
              </strong>
            </div>

            <div className={"rt-status is-" + phase}>
              <span className="swap" data-show={String(phase)}>
                <span data-v="0">Run ready</span>
                <span data-v="1">Reading the chip</span>
                <span data-v="2">Chip read</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
