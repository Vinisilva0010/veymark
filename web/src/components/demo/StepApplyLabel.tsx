"use client";

const LOGO = "/images/logo.png";

/**
 * Step 6: the screen says written or stop, then the label goes on the part.
 * Both screen states stay in the page and are shown or hidden with CSS.
 */
export default function StepApplyLabel({ progress }: { progress: number }) {
  const phase = progress < 0.3 ? 0 : progress < 0.62 ? 1 : 2;

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">Step 6</p>
        <h2 className="dstep-title">
          Written or failed, before the label goes on
        </h2>
        <p className="dstep-body">
          The screen gives a clear answer before anyone reaches for the part:{" "}
          <mark className="dstep-mark">written, or stop</mark>.
        </p>
        <p className="dstep-body">
          A vague signal here would put a tag into the world that the system
          does not know. That genuine part would fail every check for the rest
          of its life.
        </p>
        <p className="dstep-body">
          If the Solana record is slow to confirm, the part is still registered
          and can already be checked by its chip.{" "}
          <mark className="dstep-mark">
            The public record catches up on its own.
          </mark>
        </p>
      </div>

      <div className="al-scene" data-phase={phase}>
        <div className="al-phone">
          <div className="al-screen">
            <div className="al-state al-state-writing">
              <span className="al-spin" />
              <p>Writing the tag</p>
            </div>
            <div className="al-state al-state-done">
              <span className="al-check">OK</span>
              <p className="al-ok-title">Tag written</p>
              <p className="al-ok-note">Apply the label now</p>
            </div>
          </div>
        </div>

        <div className="al-partwrap">
          <svg className="al-part" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="90" className="al-metal-dark" />
            <circle cx="100" cy="100" r="82" className="al-metal" />
            <circle cx="100" cy="100" r="50" className="al-metal-dark" />
            <circle cx="100" cy="100" r="44" className="al-metal" />
            <circle cx="100" cy="100" r="17" className="al-hub" />
            {[0, 72, 144, 216, 288].map((deg) => {
              const r = (deg * Math.PI) / 180;
              return (
                <circle
                  key={deg}
                  cx={100 + 32 * Math.cos(r)}
                  cy={100 + 32 * Math.sin(r)}
                  r="5.5"
                  className="al-metal-dark"
                />
              );
            })}
            {Array.from({ length: 16 }).map((_, i) => {
              const r = (i * 22.5 * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={100 + 56 * Math.cos(r)}
                  y1={100 + 56 * Math.sin(r)}
                  x2={100 + 76 * Math.cos(r)}
                  y2={100 + 76 * Math.sin(r)}
                  className="al-vent"
                />
              );
            })}
          </svg>

          <span className="al-burst" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <img src={LOGO} alt="" className="al-sticker" />
        </div>
      </div>
    </div>
  );
}
