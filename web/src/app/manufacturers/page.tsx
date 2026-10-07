"use client";

/**
 * Request access, aimed at manufacturers.
 *
 * Not a mailing list. The questions are the point: what they make, and
 * whether counterfeits of their own brand have come back to them. Three
 * answers from people who make parts are worth more than two hundred
 * addresses from people who were curious about the technology.
 */

import { useState } from "react";

const CORAL = "#f73962";
const WINE = "#500414";

const FIELD =
  "mt-2 w-full rounded-xl border-2 px-4 py-3 text-lg font-bold outline-none";

export default function ManufacturersPage() {
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [partsMade, setPartsMade] = useState("");
  const [problem, setProblem] = useState("");

  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "manufacturer",
          company,
          contactName,
          email,
          partsMade,
          problem,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Could not send that. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Nothing was sent.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-40" style={{ color: WINE }}>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">Got it.</h1>
        <p className="mt-6 text-lg font-medium leading-relaxed">
          We read every one of these ourselves. If what you make is a fit for
          what we have running, we will write back.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-32 md:py-40" style={{ color: WINE }}>
      <p
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: CORAL }}
      >
        For manufacturers
      </p>

      <h1 className="mt-4 text-4xl font-bold leading-[1.05] md:text-6xl">
        Request access
      </h1>

      <p className="mt-7 max-w-2xl text-xl font-medium leading-snug md:text-2xl">
        Veymark is for manufacturers whose parts get copied.
      </p>

      <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed">
        Nothing has shipped yet. The system runs end to end on a test network
        and we have no physical tags in hand. We are talking to the people who
        have the problem before we build anything around a guess.
      </p>

      <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed">
        If that is you, tell us what you make. We read these ourselves.
      </p>

      <form onSubmit={handleSubmit} className="mt-14 flex flex-col gap-8">
        <label className="block">
          <span className="text-lg font-bold">Company</span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            maxLength={160}
            className={FIELD}
            style={{ borderColor: WINE, color: WINE, background: "#ffffff" }}
          />
        </label>

        <label className="block">
          <span className="text-lg font-bold">Your name</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            maxLength={120}
            className={FIELD}
            style={{ borderColor: WINE, color: WINE, background: "#ffffff" }}
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
            className={FIELD}
            style={{ borderColor: WINE, color: WINE, background: "#ffffff" }}
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
            style={{ borderColor: WINE, color: WINE, background: "#ffffff" }}
          />
        </label>

        <label className="block">
          <span className="text-lg font-bold">
            Have counterfeits of your parts come back to you?
          </span>
          <span className="mt-2 block text-base font-medium leading-relaxed">
            How you found out, and what it cost you. This is the part we most
            want to read.
          </span>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={6}
            maxLength={2000}
            className={`${FIELD} leading-relaxed`}
            style={{ borderColor: WINE, color: WINE, background: "#ffffff" }}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-xl px-8 py-4 text-lg font-bold text-white disabled:opacity-60"
          style={{ background: CORAL }}
        >
          {busy ? "Sending..." : "Send"}
        </button>

        {error && (
          <p role="alert" className="text-lg font-bold" style={{ color: "#8c0620" }}>
            {error}
          </p>
        )}
      </form>

      <p className="mt-14 max-w-2xl text-base font-medium leading-relaxed">
        We use what you send to reply to you. Nothing else, and we do not pass
        it on.
      </p>
    </main>
  );
}
