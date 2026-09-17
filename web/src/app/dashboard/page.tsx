"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const CORAL = "#f73962";
const WINE = "#500414";

type Product = {
  id: string;
  model: string;
  description: string | null;
  category: string | null;
  part_count: number;
};

type Account = {
  user: { email: string; displayName: string };
  manufacturer: {
    name: string;
    walletPubkey: string;
    verifiedOnchain: boolean;
  } | null;
};

type Session = {
  id: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  user_agent: string | null;
  ip_address: string | null;
};

type Tab = "catalog" | "sessions";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortAgent(agent: string | null): string {
  if (!agent) return "Unknown device";
  if (agent.startsWith("curl")) return "Command line";
  if (agent.includes("Edg/")) return "Edge";
  if (agent.includes("Chrome/")) return "Chrome";
  if (agent.includes("Firefox/")) return "Firefox";
  if (agent.includes("Safari/")) return "Safari";
  return "Other browser";
}

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("catalog");
  const [account, setAccount] = useState<Account | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModel, setEditModel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Delete asks for confirmation inline: the button becomes "Confirm" for a
  // few seconds instead of opening a modal, which is awkward on a phone.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [meRes, productsRes, sessionsRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/products"),
      fetch("/api/sessions"),
    ]);

    if (meRes.status === 401) {
      router.push("/dashboard/login");
      return;
    }

    setAccount(await meRes.json());
    setProducts((await productsRes.json()).products ?? []);
    setSessions((await sessionsRes.json()).sessions ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, description, category }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not create product");
        return;
      }
      setModel("");
      setDescription("");
      setCategory("");
      setFormOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditModel(product.model);
    setEditDescription(product.description ?? "");
    setEditCategory(product.category ?? "");
    setError(null);
  }

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: editModel,
          description: editDescription,
          category: editCategory,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not update product");
        return;
      }
      setEditingId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function askDelete(id: string) {
    setError(null);
    setConfirmingId(id);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    // Reset after 5s so a forgotten confirmation does not stay armed.
    confirmTimer.current = setTimeout(() => setConfirmingId(null), 5000);
  }

  async function handleDelete(id: string) {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not delete product");
        return;
      }
      setConfirmingId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  if (loading) {
    return (
      <main className="vm-dash">
        <p className="vm-loading">Loading...</p>
      </main>
    );
  }

  return (
    <main className="vm-dash">
      <header className="vm-dash-head">
        <div>
          <span className="vm-dash-tag">Veymark panel</span>
          <h1 className="vm-dash-title">{account?.manufacturer?.name}</h1>
          <p className="vm-dash-sub">
            {account?.manufacturer?.verifiedOnchain
              ? "Verified on-chain"
              : "Not yet verified on-chain"}
          </p>
        </div>
        <button type="button" onClick={handleLogout} className="vm-ghost">
          Sign out
        </button>
      </header>

      <nav className="vm-tabs">
        <button
          type="button"
          onClick={() => setTab("catalog")}
          className={`vm-tab ${tab === "catalog" ? "is-active" : ""}`}
        >
          Catalog
        </button>
        <button
          type="button"
          onClick={() => setTab("sessions")}
          className={`vm-tab ${tab === "sessions" ? "is-active" : ""}`}
        >
          Sessions ({sessions.length})
        </button>
      </nav>

      {error && (
        <p role="alert" className="vm-error vm-error-top">
          {error}
        </p>
      )}

      {tab === "catalog" && (
        <section className="vm-section">
          <div className="vm-section-head">
            <h2 className="vm-h2">Product catalog</h2>
            <button
              type="button"
              onClick={() => {
                setFormOpen((v) => !v);
                setEditingId(null);
              }}
              className="vm-primary"
            >
              {formOpen ? "Cancel" : "Add product"}
            </button>
          </div>

          {formOpen && (
            <form onSubmit={handleCreate} className="vm-card vm-form">
              <label className="vm-field">
                <span className="vm-label">Model</span>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="Shock Absorber XR-40"
                  className="vm-input"
                />
              </label>
              <label className="vm-field">
                <span className="vm-label">Description</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Front suspension shock absorber"
                  className="vm-input"
                />
              </label>
              <label className="vm-field">
                <span className="vm-label">Category</span>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Suspension"
                  className="vm-input"
                />
              </label>
              <button type="submit" disabled={busy} className="vm-submit">
                {busy ? "Saving..." : "Save product"}
              </button>
            </form>
          )}

          {products.length === 0 ? (
            <p className="vm-empty">
              No products yet. Add one before provisioning tags.
            </p>
          ) : (
            <ul className="vm-list">
              {products.map((product) => (
                <li key={product.id} className="vm-card vm-item">
                  {editingId === product.id ? (
                    <form onSubmit={handleUpdate} className="vm-form vm-edit">
                      <label className="vm-field">
                        <span className="vm-label">Model</span>
                        <input
                          value={editModel}
                          onChange={(e) => setEditModel(e.target.value)}
                          required
                          maxLength={120}
                          className="vm-input"
                        />
                      </label>
                      <label className="vm-field">
                        <span className="vm-label">Description</span>
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="vm-input"
                        />
                      </label>
                      <label className="vm-field">
                        <span className="vm-label">Category</span>
                        <input
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="vm-input"
                        />
                      </label>
                      <div className="vm-row">
                        <button
                          type="submit"
                          disabled={busy}
                          className="vm-submit"
                        >
                          {busy ? "Saving..." : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="vm-ghost"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="vm-item-main">
                        <h3 className="vm-item-model">{product.model}</h3>
                        {product.description && (
                          <p className="vm-item-desc">{product.description}</p>
                        )}
                        <div className="vm-item-meta">
                          {product.category && (
                            <span className="vm-chip">{product.category}</span>
                          )}
                          <span className="vm-count">
                            {product.part_count}{" "}
                            {product.part_count === 1 ? "part" : "parts"}
                          </span>
                        </div>
                      </div>
                      <div className="vm-row vm-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="vm-ghost"
                        >
                          Edit
                        </button>
                        {confirmingId === product.id ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            disabled={busy}
                            className="vm-danger"
                          >
                            Confirm delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => askDelete(product.id)}
                            className="vm-ghost vm-ghost-danger"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "sessions" && (
        <section className="vm-section">
          <h2 className="vm-h2">Active sessions</h2>
          <p className="vm-hint">
            Every device signed in to this account. Revoking cuts access
            immediately.
          </p>

          <ul className="vm-list">
            {sessions.map((session) => (
              <li key={session.id} className="vm-card vm-item">
                <div className="vm-item-main">
                  <h3 className="vm-item-model">
                    {shortAgent(session.user_agent)}
                  </h3>
                  <p className="vm-item-desc">
                    {session.ip_address} · last seen{" "}
                    {formatWhen(session.last_seen_at)}
                  </p>
                  <p className="vm-item-desc">
                    Expires {formatWhen(session.expires_at)}
                  </p>
                </div>
                <div className="vm-row vm-actions">
                  <button
                    type="button"
                    onClick={() => handleRevoke(session.id)}
                    disabled={busy}
                    className="vm-ghost vm-ghost-danger"
                  >
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <style jsx global>{`
        .vm-dash {
          min-height: 100dvh;
          background: #fdf9eb;
          padding: 22px 18px 60px;
        }
        @media (min-width: 768px) {
          .vm-dash {
            padding: 40px 32px 80px;
            max-width: 900px;
            margin: 0 auto;
          }
        }

        .vm-loading {
          padding: 40px 0;
          font-size: 15px;
          color: rgba(80, 4, 20, 0.6);
        }

        .vm-dash-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(80, 4, 20, 0.12);
        }
        .vm-dash-tag {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${CORAL};
        }
        .vm-dash-title {
          margin-top: 6px;
          font-size: 25px;
          font-weight: 700;
          line-height: 1.15;
          color: ${WINE};
        }
        @media (min-width: 768px) {
          .vm-dash-title {
            font-size: 31px;
          }
        }
        .vm-dash-sub {
          margin-top: 5px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(80, 4, 20, 0.6);
        }

        .vm-tabs {
          display: flex;
          gap: 6px;
          margin-top: 20px;
        }
        .vm-tab {
          min-height: 42px;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 700;
          color: rgba(80, 4, 20, 0.55);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }
        .vm-tab.is-active {
          color: ${CORAL};
          border-bottom-color: ${CORAL};
        }

        .vm-section {
          margin-top: 26px;
        }
        .vm-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .vm-h2 {
          font-size: 19px;
          font-weight: 700;
          color: ${WINE};
        }
        .vm-hint {
          margin-top: 6px;
          font-size: 14px;
          color: rgba(80, 4, 20, 0.6);
        }

        .vm-card {
          background: #fffdf7;
          border: 1px solid rgba(80, 4, 20, 0.12);
          border-radius: 15px;
        }

        .vm-form {
          margin-top: 18px;
          padding: 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .vm-edit {
          margin-top: 0;
          padding: 0;
          width: 100%;
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
          /* 16px keeps iOS Safari from zooming the page on focus. */
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
        .vm-input::placeholder {
          color: rgba(80, 4, 20, 0.32);
        }

        .vm-error {
          font-size: 14px;
          font-weight: 600;
          color: ${CORAL};
          background: rgba(247, 57, 98, 0.08);
          border-radius: 9px;
          padding: 10px 12px;
        }
        .vm-error-top {
          margin-top: 18px;
        }

        .vm-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .vm-actions {
          flex-shrink: 0;
        }

        .vm-primary,
        .vm-submit,
        .vm-danger {
          min-height: 46px;
          padding: 0 20px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          background: ${CORAL};
          border: none;
          border-radius: 11px;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
        }
        .vm-submit {
          min-height: 48px;
          font-size: 16px;
        }
        .vm-danger {
          background: ${WINE};
        }
        .vm-primary:hover,
        .vm-submit:hover:not(:disabled),
        .vm-danger:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .vm-submit:disabled,
        .vm-danger:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .vm-ghost {
          min-height: 42px;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 700;
          color: ${WINE};
          background: none;
          border: 1.5px solid rgba(80, 4, 20, 0.2);
          border-radius: 10px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .vm-ghost:hover {
          border-color: ${CORAL};
          color: ${CORAL};
        }
        .vm-ghost-danger:hover {
          border-color: ${WINE};
          color: ${WINE};
        }

        .vm-empty {
          margin-top: 22px;
          padding: 28px 20px;
          text-align: center;
          font-size: 15px;
          font-weight: 500;
          color: rgba(80, 4, 20, 0.55);
          border: 1px dashed rgba(80, 4, 20, 0.2);
          border-radius: 15px;
        }

        .vm-list {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          list-style: none;
          padding: 0;
        }
        .vm-item {
          padding: 17px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        @media (min-width: 640px) {
          .vm-item {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .vm-item-main {
          min-width: 0;
        }
        .vm-item-model {
          font-size: 16.5px;
          font-weight: 700;
          color: ${WINE};
          word-break: break-word;
        }
        .vm-item-desc {
          margin-top: 4px;
          font-size: 14px;
          color: rgba(80, 4, 20, 0.62);
          word-break: break-word;
        }
        .vm-item-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 9px;
          flex-wrap: wrap;
        }
        .vm-chip {
          font-size: 12px;
          font-weight: 700;
          color: ${CORAL};
          background: rgba(247, 57, 98, 0.1);
          padding: 5px 11px;
          border-radius: 999px;
        }
        .vm-count {
          font-size: 13px;
          font-weight: 600;
          color: rgba(80, 4, 20, 0.5);
        }

        @media (prefers-reduced-motion: reduce) {
          .vm-input,
          .vm-primary,
          .vm-submit,
          .vm-danger {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
