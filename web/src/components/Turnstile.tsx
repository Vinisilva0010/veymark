"use client";

/**
 * The Cloudflare Turnstile widget.
 *
 * Renders into its own container and reports the token up. The script is
 * loaded once per page and reused, so opening both panels does not load it
 * twice.
 *
 * With no site key configured it renders nothing and the form still submits —
 * the server treats an unconfigured check the same way, so local development
 * is not blocked by a service it does not need.
 */

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: Record<string, unknown>
      ) => string | undefined;
      remove: (id: string) => void;
    };
  }
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`
  );

  if (existing) {
    return new Promise((resolve) =>
      existing.addEventListener("load", () => resolve(), { once: true })
    );
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(), { once: true });
    document.head.appendChild(script);
  });
}

export default function Turnstile({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;

    let widgetId: string | undefined;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;

        widgetId = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onToken(token),
          // A token is single use and expires. Clearing it here means the
          // form cannot be submitted with one that no longer works.
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      })
      .catch(() => {
        // Script blocked. The server still refuses, so this fails safe.
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;

  return <div ref={box} className="mt-6" />;
}
