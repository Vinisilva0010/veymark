"use client";

/**
 * The two ways in, under the opening statement.
 *
 * Updates is an email and nothing else: someone who read two paragraphs and
 * wants to hear when this ships. Manufacturers is the form that carries
 * weight — what they make, and whether copies of their own parts have come
 * back to them. Both open in a panel so neither one pushes the page around.
 */

import { useEffect, useRef, useState } from "react";

const CORAL = "#f73962";
const WINE = "#500414";
const CREAM = "#fdf9eb";

const FIELD =
  "mt-2 w-full rounded-xl border-2 px-4 py-3 text-lg font-bold outline-none";

type Panel = null | "waitlist" | "manufacturer";

function Dialog({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Escape closes, and the page behind does not scroll while this is open.
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    box.current?.querySelector("input")?.focus();

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-10"
      style={{ background: "rgba(18, 3, 8, 0.55)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl rounded-3xl px-7 py-8 md:px-10 md:py-10"
        style={{ background: CREAM, color: WINE }}
      >
        <div className="flex items-start justify-between gap-6">
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: CORAL }}
          >
            {eyebrow}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl border-2 px-3 py-1 text-lg font-bold"
            style={{ borderColor: WINE, color: WINE }}
          >
            ×
          </button>
        </div>

        <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
          {title}
        </h2>

        {children}
      </div>
    </div>
  );
}

export default function Waitlist() {
  const [panel, setPanel] = useState<Panel>(null);

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [partsMade, setPartsMade] = useState("");
  const [problem, setProblem] = useState("");

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function open(which: Panel) {
    setPanel(which);
    setDone(false);
    setError("");
  }

  async function send(kind: "waitlist" | "manufacturer") {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "waitlist"
            ? { kind, email }
            : { kind, email, company, contactName, partsMade, problem }
        ),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Could not send that.");
        return;
      }

      setDone(true);
    } catch {
      setError("Network error. Nothing was sent.");
    } finally {
      setBusy(false);
    }
  }

  const field = {
    borderColor: WINE,
    color: WINE,
    background: "#ffffff",
  } as const;

  return (
    <>
      <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={() => open("waitlist")}
          className="w-full rounded-xl px-8 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 sm:w-auto"
          style={{ background: CORAL, boxShadow: "0 10px 24px rgba(247,57,98,0.35)" }}
        >
          Get updates
        </button>

        <button
          type="button"
          onClick={() => open("manufacturer")}
          className="w-full rounded-xl px-8 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 sm:w-auto"
          style={{ background: WINE, boxShadow: "0 10px 24px rgba(80,4,20,0.3)" }}
        >
          For manufacturers
        </button>
      </div>

      {panel === "waitlist" && (
        <Dialog
          eyebrow="Updates"
          title="Get our updates"
          onClose={() => setPanel(null)}
        >
          {done ? (
            <p className="mt-6 text-lg font-medium leading-relaxed">
              Done. We will email you when there is news.
            </p>
          ) : (
            <>
              <p className="mt-5 text-lg font-medium leading-relaxed">
                Leave your email and we will send you what we build, and tell
                you when Veymark is available.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send("waitlist");
                }}
                className="mt-7"
              >
                <label className="block">
                  <span className="text-lg font-bold">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={200}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@company.com"
                    className={FIELD}
                    style={field}
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 rounded-xl px-7 py-4 text-lg font-bold text-white disabled:opacity-60"
                  style={{ background: CORAL }}
                >
                  {busy ? "Adding..." : "Get updates"}
                </button>
              </form>
            </>
          )}

          {error && (
            <p role="alert" className="mt-4 text-base font-bold" style={{ color: "#8c0620" }}>
              {error}
            </p>
          )}
        </Dialog>
      )}

      {panel === "manufacturer" && (
        <Dialog
          eyebrow="For manufacturers"
          title="Tell us what you make"
          onClose={() => setPanel(null)}
        >
          {done ? (
            <p className="mt-6 text-lg font-medium leading-relaxed">
              Got it. We read every one of these ourselves, and we will write
              back.
            </p>
          ) : (
            <>
              <p className="mt-5 text-lg font-medium leading-relaxed">
                Veymark is for manufacturers whose parts get copied. Nothing has
                shipped yet — we are talking to the people who have the problem
                before we build anything around a guess.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send("manufacturer");
                }}
                className="mt-7 flex flex-col gap-6"
              >
                <label className="block">
                  <span className="text-lg font-bold">Company</span>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    maxLength={160}
                    autoComplete="organization"
                    className={FIELD}
                    style={field}
                  />
                </label>

                <label className="block">
                  <span className="text-lg font-bold">Your name</span>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    maxLength={120}
                    autoComplete="name"
                    className={FIELD}
                    style={field}
                  />
                </label>

                <label className="block">
                  <span className="text-lg font-bold">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={200}
                    autoComplete="email"
                    inputMode="email"
                    className={FIELD}
                    style={field}
                  />
                </label>

                <label className="block">
                  <span className="text-lg font-bold">What do you make?</span>
                  <input
                    value={partsMade}
                    onChange={(e) => setPartsMade(e.target.value)}
                    required
                    maxLength={400}
                    placeholder="Brake pads, batteries, bearings"
                    className={FIELD}
                    style={field}
                  />
                </label>

                <label className="block">
                  <span className="text-lg font-bold">
                    Have counterfeits of your parts come back to you?
                  </span>
                  <span className="mt-2 block text-base font-medium leading-relaxed">
                    How you found out, and what it cost you. This is the part we
                    most want to read.
                  </span>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    className={`${FIELD} leading-relaxed`}
                    style={field}
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl px-7 py-4 text-lg font-bold text-white disabled:opacity-60"
                  style={{ background: CORAL }}
                >
                  {busy ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}

          {error && (
            <p role="alert" className="mt-4 text-base font-bold" style={{ color: "#8c0620" }}>
              {error}
            </p>
          )}
        </Dialog>
      )}
    </>
  );
}
