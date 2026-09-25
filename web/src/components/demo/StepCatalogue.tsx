"use client";

const PRODUCTS = [
  { model: "Shock Absorber XR-40", category: "Suspension" },
  { model: "Wheel Bearing RM-12", category: "Bearings" },
  { model: "Headlight Bulb H7", category: "Lighting" },
];

/**
 * Step 2: products are registered once, and each manufacturer only ever
 * sees its own catalogue.
 */
export default function StepCatalogue({ progress }: { progress: number }) {
  const lockedIn = progress > 0.62;

  return (
    <div className="dstep-grid">
      <div>
        <p className="dstep-tag">Step 2</p>
        <h2 className="dstep-title">Products are registered once</h2>
        <p className="dstep-body">
          Before any tag is written, each product goes into the catalogue:
          model, category, description. It is done{" "}
          <mark className="dstep-mark">once, not on every part</mark>.
        </p>
        <p className="dstep-body">
          Each manufacturer only ever sees their own catalogue.{" "}
          <mark className="dstep-mark">
            Every lookup is tied to who is signed in
          </mark>
          , so changing a number in the address bar never opens somebody
          else&rsquo;s list.
        </p>
      </div>

      <div className="ct-scene">
        <div className="ct-laptop">
          <div className="ct-screen">
            <div className="ct-head">
              <span className="ct-brand">Catalogue</span>
              <span className="ct-owner">Demo Auto Parts</span>
            </div>
            {PRODUCTS.map((p, i) => (
              <div
                key={p.model}
                className={
                  "ct-row" + (progress > 0.12 + i * 0.14 ? " is-in" : "")
                }
              >
                <strong>{p.model}</strong>
                <span>{p.category}</span>
              </div>
            ))}
          </div>
          <div className="ct-base" />
        </div>

        <div className={"ct-other" + (lockedIn ? " is-in" : "")}>
          <p className="ct-other-title">Another manufacturer</p>
          <div className="ct-other-rows">
            <span />
            <span />
            <span />
          </div>
          <div className="ct-other-lock">
            <span className="ct-other-shackle" />
            <span className="ct-other-body" />
            <p>No access</p>
          </div>
        </div>
      </div>
    </div>
  );
}
