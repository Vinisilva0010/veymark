"use client";

/**
 * Assembly station.
 *
 * A sealed case proves itself, and says nothing about what is inside it. This
 * screen is where the contents are recorded: the operator locks one assembly,
 * then reads each component tag into a declared role until the case is full.
 *
 * The assembly is locked first, like product and batch on the provisioning
 * station, because an operator fills one case at a time. Re-reading the case
 * tag per component would be the obvious source of a component landing in the
 * wrong assembly.
 */

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DashNav from "@/components/DashNav";
import { soundAccepted, soundRefused } from "@/lib/feedback";

type Slot = {
  role: string;
  filled: boolean;
  chipUid: string | null;
  assetId: string | null;
  model: string | null;
};

type AssemblyState = {
  isAssembly: boolean;
  sealPosition: "surface" | "across_opening";
  slots: Slot[];
  complete: boolean;
};

type Outcome =
  | { kind: "attached"; chipUid: string; role: string }
  | { kind: "failed"; chipUid: string; message: string };

export default function AssemblyPage() {
  const router = useRouter();

  const [assemblyUid, setAssemblyUid] = useState("");
  const [lockedUid, setLockedUid] = useState("");
  const [state, setState] = useState<AssemblyState | null>(null);

  const [componentUid, setComponentUid] = useState("");
  const [role, setRole] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const [busy, setBusy] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const componentInput = useRef<HTMLInputElement | null>(null);

  const loadState = useCallback(
    async (uid: string) => {
      const response = await fetch(
        `/api/assembly?chipUid=${encodeURIComponent(uid)}`
      );

      if (response.status === 401) {
        router.push("/dashboard/login");
        return null;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLookupError(data.error ?? "Could not read that tag");
        return null;
      }

      return data.state as AssemblyState;
    },
    [router]
  );

  async function handleLock(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setLookupError("");
    setOutcome(null);

    const uid = assemblyUid.trim().toUpperCase();
    const next = await loadState(uid);

    if (next) {
      // A part that is not an assembly has nothing to hold. Refusing here
      // costs the operator one read; refusing later costs a whole case.
      if (!next.isAssembly) {
        setLookupError("This part is not a sealed assembly. Nothing to attach.");
      } else {
        setLockedUid(uid);
        setState(next);
      }
    }

    setBusy(false);
  }

  async function handleAttach(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setOutcome(null);

    const uid = componentUid.trim().toUpperCase();

    try {
      const response = await fetch("/api/assembly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assemblyChipUid: lockedUid,
          componentChipUid: uid,
          role,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        soundRefused();
        setOutcome({
          kind: "failed",
          chipUid: uid,
          message: data.error ?? "Could not attach that component",
        });
        return;
      }

      soundAccepted();
      setState(data.state as AssemblyState);
      setOutcome({ kind: "attached", chipUid: uid, role });
      setComponentUid("");
      setRole("");
    } catch {
      soundRefused();
      setOutcome({
        kind: "failed",
        chipUid: uid,
        message: "Network error. The component was not attached.",
      });
    } finally {
      setBusy(false);
      componentInput.current?.focus();
    }
  }

  const openSlots = state?.slots.filter((s) => !s.filled) ?? [];

  return (
    <main className="vm-dash">
      <header className="vm-dash-head">
        <div>
          <span className="vm-dash-tag">Assembly station</span>
          <h1 className="vm-dash-title">Record contents</h1>
          <p className="vm-dash-sub">
            {state
              ? `${state.slots.filter((s) => s.filled).length} of ${
                  state.slots.length
                } in place`
              : "Read a case tag to start"}
          </p>
        </div>
      </header>

      <DashNav />

      {!lockedUid ? (
        <section className="vm-section">
          <h2 className="vm-h2">Step 1 — read the case</h2>
          <p className="vm-hint">
            Hold the tag on the outside of the case against the reader. This is
            the part that holds the others — a battery pack, a control module.
            Its contents are recorded in the next step.
          </p>

          <form onSubmit={handleLock} className="vm-card vm-form">
            <label className="vm-field">
              <span className="vm-label">Case chip UID</span>
              <input
                autoFocus
                value={assemblyUid}
                onChange={(e) => setAssemblyUid(e.target.value)}
                placeholder="04AABBCCDDEE80"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                className="vm-input vm-uid"
              />
            </label>
            <button type="submit" disabled={busy} className="vm-submit">
              {busy ? "Reading..." : "Open case"}
            </button>
          </form>

          {lookupError && (
            <div className="vm-result is-bad" role="alert">
              <span className="vm-result-icon">STOP</span>
              <h3 className="vm-result-title">Cannot open</h3>
              <p className="vm-result-body">{lookupError}</p>
            </div>
          )}
        </section>
      ) : (
        <section className="vm-section">
          <div className="vm-runbar">
            <div>
              <span className="vm-runlabel">Current case</span>
              <p className="vm-runvalue">{lockedUid}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLockedUid("");
                setState(null);
                setOutcome(null);
                setAssemblyUid("");
              }}
              className="vm-ghost"
            >
              Change
            </button>
          </div>

          {/* A case recorded as a surface tag can be opened and closed again
              without breaking anything, so its contents prove less than the
              operator may assume. Said here, before the case is filled. */}
          {state?.sealPosition === "surface" && (
            <div className="vm-result is-bad" role="alert">
              <span className="vm-result-icon">WARN</span>
              <h3 className="vm-result-title">Not sealed</h3>
              <p className="vm-result-body">
                This case carries a surface tag. Opening it does not break the
                antenna, so the contents recorded here can be swapped later
                without the tag going silent.
              </p>
            </div>
          )}

          {state && !state.complete && (
            <form onSubmit={handleAttach} className="vm-card vm-form">
              <label className="vm-field">
                <span className="vm-label">
                  Step 2 — read the part going inside
                </span>
                <input
                  ref={componentInput}
                  value={componentUid}
                  onChange={(e) => setComponentUid(e.target.value)}
                  placeholder="04AABBCCDDEE80"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                  className="vm-input vm-uid"
                />
              </label>

              <label className="vm-field">
                <span className="vm-label">Step 3 — what it goes in as</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="vm-input"
                >
                  <option value="">Select a role</option>
                  {openSlots.map((slot) => (
                    <option key={slot.role} value={slot.role}>
                      {slot.role}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={busy || !role}
                className="vm-submit"
              >
                {busy ? "Attaching..." : "Attach component"}
              </button>
            </form>
          )}

          {outcome?.kind === "attached" && (
            <div className="vm-result is-ok" role="status">
              <span className="vm-result-icon">OK</span>
              <h3 className="vm-result-title">Component recorded</h3>
              <p className="vm-result-body">
                {outcome.chipUid} is now inside this case as {outcome.role}.
              </p>
            </div>
          )}

          {outcome?.kind === "failed" && (
            <div className="vm-result is-bad" role="alert">
              <span className="vm-result-icon">STOP</span>
              <h3 className="vm-result-title">Not attached</h3>
              <p className="vm-result-body">
                Do not close this case. {outcome.message}
              </p>
            </div>
          )}

          {state?.complete && (
            <div className="vm-result is-ok" role="status">
              <span className="vm-result-icon">OK</span>
              <h3 className="vm-result-title">Case complete</h3>
              <p className="vm-result-body">
                Every declared component is in place. The case can be sealed.
              </p>
            </div>
          )}

          {state && state.slots.length > 0 && (
            <section className="vm-section">
              <h2 className="vm-h2">Contents</h2>
              <ul className="vm-list">
                {state.slots.map((slot) => (
                  <li key={slot.role} className="vm-card vm-item">
                    <div className="vm-item-main">
                      <h3 className="vm-item-model">{slot.role}</h3>
                      <p className="vm-item-desc">
                        {slot.filled
                          ? `${slot.chipUid} · ${slot.model}`
                          : "Missing"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      )}
    </main>
  );
}
