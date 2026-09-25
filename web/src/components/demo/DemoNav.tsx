"use client";

import { useEffect, useState } from "react";

const PARTS = [
  { id: "factory", label: "At the factory", note: "The part is registered" },
  { id: "field", label: "At the workshop", note: "The buyer checks it" },
  { id: "attacks", label: "Breaking it", note: "Try to fool the system" },
];

/**
 * Fixed index across the top of the demo.
 *
 * Without it a reader has no idea how long the page is and can abandon it
 * halfway. It also lets someone in a hurry jump straight to the attacks,
 * which is the part that proves the product rather than describing it.
 */
export default function DemoNav() {
  const [active, setActive] = useState("factory");
  const [visible, setVisible] = useState(false);

  // The site navbar is fixed and would sit on top of this index. Marking the
  // body lets CSS hide it for this page only, without touching the layout.
  useEffect(() => {
    document.body.classList.add("demo-page");
    return () => document.body.classList.remove("demo-page");
  }, []);

  useEffect(() => {
    let queued = false;
    let raf = 0;

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(() => {
        queued = false;
        // Appears as soon as the reader starts moving, so the page never
        // feels endless — especially on a phone, where the intro is tall.
        setVisible(window.scrollY > 120);

        let current = PARTS[0].id;
        for (const part of PARTS) {
          const el = document.getElementById(part.id);
          if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) {
            current = part.id;
          }
        }
        setActive(current);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav className={"dn" + (visible ? " is-on" : "")} aria-label="Demo sections">
      <div className="dn-inner">
        {PARTS.map((part, i) => (
          <button
            key={part.id}
            type="button"
            onClick={() =>
              document
                .getElementById(part.id)
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className={"dn-item" + (active === part.id ? " is-on" : "")}
          >
            <span className="dn-num">{i + 1}</span>
            <span className="dn-text">
              <strong>{part.label}</strong>
              <em>{part.note}</em>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
