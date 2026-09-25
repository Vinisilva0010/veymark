"use client";

/**
 * Step 1: the operator signs in.
 * Receives its progress from the factory stage; renders no scroll of its own.
 */
export default function StepSignIn({ progress }: { progress: number }) {
  const track = (from: number, to: number) =>
    Math.min(1, Math.max(0, (progress - from) / (to - from)));

  const operatorIn = progress > 0.02;
  const phoneIn = progress > 0.12;
  const email = track(0.2, 0.45);
  const password = track(0.47, 0.7);
  const signedIn = progress > 0.78;

  return (
    <div className="si-grid">
      <div className="si-copy">
        <p className="si-tag">Step 1</p>
        <h2 className="si-title">The operator signs in</h2>
        <p className="si-body">
          The factory panel is not open to anyone. A session is a random
          token, and only its hash is stored — a stolen database hands an
          attacker nothing they can sign in with. Cutting someone off is
          deleting one row, and it takes effect on their next request.
        </p>
      </div>

      <div
        className="si-scene"
        data-operator={operatorIn ? "1" : "0"}
        data-phone={phoneIn ? "1" : "0"}
      >
        <img
          src="/images/operator.png"
          alt="Factory operator looking at the panel"
          className="si-operator"
        />

        <div className="si-phone">
          <div className="si-screen">
            <p className="si-screen-brand">Veymark</p>
            <p className="si-screen-sub">Factory panel</p>

            <div className="si-field">
              <span className="si-field-label">Email</span>
              <div className="si-field-box">
                <span
                  className="si-fill"
                  style={{ transform: `scaleX(${email})` }}
                />
              </div>
            </div>

            <div className="si-field">
              <span className="si-field-label">Password</span>
              <div className="si-field-box">
                <span
                  className="si-fill is-dots"
                  style={{ transform: `scaleX(${password})` }}
                />
              </div>
            </div>

            <div className={"si-btn" + (signedIn ? " is-on" : "")}>
              <span className="swap" data-show={signedIn ? "1" : "0"}>
                <span data-v="0">Sign in</span>
                <span data-v="1">Signed in</span>
              </span>
            </div>

            <div className={"si-token" + (signedIn ? " is-on" : "")}>
              <span>Session token</span>
              <code>only its hash is stored</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
