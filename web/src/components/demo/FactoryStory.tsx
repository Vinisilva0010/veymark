"use client";

import { useScrollProgress } from "./useScrollProgress";
import StepSignIn from "./StepSignIn";
import StepCatalogue from "./StepCatalogue";
import StepReadTag from "./StepReadTag";
import StepSecret from "./StepSecret";
import StepMint from "./StepMint";
import StepApplyLabel from "./StepApplyLabel";

const SCENES = [
  { key: "signin", Scene: StepSignIn },
  { key: "catalogue", Scene: StepCatalogue },
  { key: "read", Scene: StepReadTag },
  { key: "secret", Scene: StepSecret },
  { key: "mint", Scene: StepMint },
  { key: "label", Scene: StepApplyLabel },
];

/**
 * The factory part of the demo as a single stage.
 *
 * One sticky viewport; each scene fades out as the next fades in, so the
 * reader scrolls roughly one screen per scene instead of three. Every scene
 * stays mounted and is shown or hidden with CSS — mounting and unmounting
 * breaks browser translation, which rewrites text nodes React then cannot
 * find.
 */
export default function FactoryStory() {
  const { ref, progress } = useScrollProgress<HTMLElement>();

  const count = SCENES.length;
  const scaled = progress * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  const local = Math.min(1, Math.max(0, scaled - index));

  return (
    <section ref={ref} className="fs" style={{ height: `${count * 120}vh` }}>
      <div className="fs-sticky">
        <div className="fs-bar">
          <p className="fs-bar-label">Inside the factory</p>
          <div className="fs-bar-steps">
            {SCENES.map((s, i) => (
              <span
                key={s.key}
                className={
                  "fs-seg" + (i < index ? " is-done" : i === index ? " is-on" : "")
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
