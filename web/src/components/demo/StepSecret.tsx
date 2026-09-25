"use client";

const KEY_HEX = "9f3c71a0e28b4d6510c7fa82b35e9d41";
const SEALED = "\u2022".repeat(KEY_HEX.length);

/**
 * Step 4: the part gets a secret, and the secret is sealed before it is
 * stored. The one moment the key is ever readable.
 */
export default function StepSecret({ progress }: { progress: number }) {
  const phase = progress < 0.32 ? 0 : progress < 0.64 ? 1 : 2;
  const sealed = phase > 0 ? "1" : "0";

  return (
    <div className="sc-grid">
      <div className="sc-copy">
        <p className="sc-tag">Step 4</p>
        <h2 className="sc-title">The part gets a secret, then it is sealed</h2>

        <p className="sc-body">
          A key is created for this one part and no other. It goes inside the
          chip, and{" "}
          <mark className="sc-mark">
            this is the only moment it can ever be read
          </mark>
          . From then on the chip proves it knows the key without handing it
          over.
        </p>

        <p className="sc-body">
          Before the key reaches the database it is encrypted with a master key
          kept somewhere else entirely. Someone who steals the whole database{" "}
          <mark className="sc-mark">gets rows that decrypt to nothing</mark>.
        </p>

        <p className="sc-body">
          That is what stops a leak from becoming forged parts. Without the
          key, nobody can produce a reading the system will accept.
        </p>
      </div>

      <div className="sc-scene" data-phase={phase}>
        <div className="sc-phone">
          <div className="sc-screen">
            <p className="sc-brand">Key</p>

            <div className="sc-keybox">
              <span className="sc-keylabel">
                <span className="swap" data-show={sealed}>
                  <span data-v="0">In the open</span>
                  <span data-v="1">Sealed</span>
                </span>
              </span>
              <code className={"sc-key" + (phase > 0 ? " is-sealed" : "")}>
                <span className="swap" data-show={sealed}>
                  <span data-v="0">{KEY_HEX}</span>
                  <span data-v="1">{SEALED}</span>
                </span>
              </code>
            </div>

            <div className="sc-lockwrap">
              <div className="sc-lock" aria-hidden="true">
                <span className="sc-lock-shackle" />
                <span className="sc-lock-body" />
              </div>
              <p className="sc-lockcaption">
                <span className="swap" data-show={sealed}>
                  <span data-v="0">Generated for this part</span>
                  <span data-v="1">AES-256-GCM</span>
                </span>
              </p>
            </div>

            <div className={"sc-store is-" + phase}>
              <span className="swap" data-show={String(phase)}>
                <span data-v="0">Not stored yet</span>
                <span data-v="1">Encrypting</span>
                <span data-v="2">Saved, unreadable</span>
              </span>
            </div>
          </div>
        </div>

        <svg className="sc-db" viewBox="0 0 120 150" aria-hidden="true">
          <path
            d="M10 25v100c0 8 22 15 50 15s50-7 50-15V25z"
            className="sc-db-body"
          />
          <ellipse cx="60" cy="25" rx="50" ry="16" className="sc-db-top" />
          <path d="M10 62c0 8 22 15 50 15s50-7 50-15" className="sc-db-line" />
          <path d="M10 99c0 8 22 15 50 15s50-7 50-15" className="sc-db-line" />
          <rect x="30" y="35" width="60" height="8" rx="4" className="sc-db-row is-new" />
          <rect x="30" y="72" width="60" height="8" rx="4" className="sc-db-row" />
          <rect x="30" y="109" width="60" height="8" rx="4" className="sc-db-row" />
        </svg>
      </div>
    </div>
  );
}
