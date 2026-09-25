"use client";

import { useScrollProgress } from "./useScrollProgress";
import StepPartArrives from "./StepPartArrives";
import StepTap from "./StepTap";
import StepResult from "./StepResult";
import StepPublicProof from "./StepPublicProof";

const SCENES = [
  { key: "arrives", Scene: StepPartArrives },
  { key: "tap", Scene: StepTap },
  { key: "result", Scene: StepResult },
  { key: "proof", Scene: StepPublicProof },
];

/**
 * The field part of the demo: a part reaches a workshop and is checked.
 *
 * Same stage pattern as the factory story — one sticky viewport, scenes
 * stacked and swapped with CSS so browser translation never breaks.
 */
export default function FieldStory() {
  const { ref, progress } = useScrollProgress<HTMLElement>();

  const count = SCENES.length;
  const scaled = progress * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  const local = Math.min(1, Math.max(0, scaled - index));

  return (
    <section ref={ref} className="fs" style={{ height: `${count * 120}vh` }}>
      <div className="fs-sticky">
        <div className="fs-bar">
          <p className="fs-bar-label">Out in the field</p>
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
