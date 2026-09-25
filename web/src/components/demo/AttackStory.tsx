"use client";

import { useScrollProgress } from "./useScrollProgress";
import AttackReplay from "./AttackReplay";
import AttackForged from "./AttackForged";
import AttackUnknown from "./AttackUnknown";

const SCENES = [
  { key: "replay", Scene: AttackReplay },
  { key: "forged", Scene: AttackForged },
  { key: "unknown", Scene: AttackUnknown },
];

/**
 * The attacks: three ways to try to fool the system, all run for real.
 *
 * This is the part that proves the product rather than describing it, so
 * every check here hits the live endpoint. Nothing is staged.
 */
export default function AttackStory() {
  const { ref, progress } = useScrollProgress<HTMLElement>();

  const count = SCENES.length;
  const scaled = progress * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  const local = Math.min(1, Math.max(0, scaled - index));

  return (
    <section ref={ref} className="fs" style={{ height: `${count * 130}vh` }}>
      <div className="fs-sticky">
        <div className="fs-bar">
          <p className="fs-bar-label">Try to fool the system</p>
          <div className="fs-bar-steps">
            {SCENES.map((s, i) => (
              <span
                key={s.key}
                className={
                  "fs-seg" +
                  (i < index ? " is-done" : i === index ? " is-on" : "")
                }
              >
                <i
                  style={
                    i === index ? { transform: `scaleX(${local})` } : undefined
                  }
                />
              </span>
            ))}
          </div>
        </div>

        <div className="fs-stage">
          {SCENES.map(({ key, Scene }, i) => (
            <div
              key={key}
              className={"fs-layer" + (i === index ? " is-on" : "")}
              aria-hidden={i !== index}
            >
              <Scene progress={i === index ? local : i < index ? 1 : 0} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
