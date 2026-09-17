"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CORAL = "#f73962";
const WINE = "#500414";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Could not sign in");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="vm-login">
      <div className="vm-login-card">
        <span className="vm-login-tag">Veymark</span>
        <h1 className="vm-login-title">Manufacturer panel</h1>

        <form onSubmit={handleSubmit} className="vm-form">
          <label className="vm-field">
            <span className="vm-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="vm-input"
            />
          </label>

          <label className="vm-field">
            <span className="vm-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="vm-input"
            />
          </label>

          {error && (
            <p role="alert" className="vm-error">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="vm-submit">
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .vm-login {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          background: #fdf9eb;
        }
        .vm-login-card {
          width: 100%;
          max-width: 400px;
          background: #fffdf7;
          border: 1px solid rgba(80, 4, 20, 0.12);
          border-radius: 18px;
          padding: 34px 26px 30px;
          box-shadow: 0 10px 40px rgba(80, 4, 20, 0.07);
        }
        .vm-login-tag {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${CORAL};
        }
        .vm-login-title {
          margin-top: 10px;
          font-size: 27px;
          font-weight: 700;
          line-height: 1.15;
          color: ${WINE};
        }

        .vm-form {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .vm-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .vm-label {
          font-size: 13px;
          font-weight: 700;
          color: rgba(80, 4, 20, 0.78);
        }
        .vm-input {
          /* 16px minimum stops iOS Safari from zooming when the field focuses. */
          font-size: 16px;
          padding: 13px 14px;
          border: 1.5px solid rgba(80, 4, 20, 0.16);
          border-radius: 11px;
          background: #fff;
          color: ${WINE};
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .vm-input:focus {
          outline: none;
          border-color: ${CORAL};
          box-shadow: 0 0 0 3px rgba(247, 57, 98, 0.16);
        }

        .vm-error {
          font-size: 14px;
          font-weight: 600;
          color: ${CORAL};
          background: rgba(247, 57, 98, 0.08);
          border-radius: 9px;
          padding: 10px 12px;
        }

        .vm-submit {
          /* 48px tall: comfortable tap target on a phone. */
          min-height: 48px;
          margin-top: 4px;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          background: ${CORAL};
          border: none;
          border-radius: 11px;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
        }
        .vm-submit:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .vm-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (prefers-reduced-motion: reduce) {
          .vm-input,
          .vm-submit {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
