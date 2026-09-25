"use client";

import { useEffect, useRef } from "react";

// ---- knobs ----
const LOGO_SRC = "/images/logo.png";
const X_URL = "https://x.com/veymark_xyz";
const CORAL = "#f73962";
const WINE = "#500414";
const CREAM = "#fdf9eb";
// ---------------

const LINKS = [
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "DEMO", href: "/demo" },
];

export default function Navbar() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let queued = false;

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(() => {
        queued = false;

        const y = window.scrollY;
        const max = document.body.scrollHeight - window.innerHeight;
        const p = max > 0 ? y / max : 0;

        // The seal turns as you read. Ties the nav to the brand mark.
        if (logoRef.current) {
          logoRef.current.style.transform = `rotate(${p * 140}deg)`;
        }

        // Progress line along the bottom edge of the capsule.
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${p})`;
        }

        // Capsule tightens once you leave the hero.
        if (barRef.current) {
          const solid = Math.min(1, y / 120);
          barRef.current.style.backgroundColor = `rgba(253, 249, 235, ${
            0.55 + solid * 0.4
          })`;
          barRef.current.style.borderColor = `rgba(80, 4, 20, ${
            0.08 + solid * 0.1
          })`;
          barRef.current.style.boxShadow = `0 ${4 + solid * 8}px ${
            14 + solid * 18
          }px rgba(80, 4, 20, ${0.04 + solid * 0.07})`;
        }
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 md:pt-6">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center">
        {/* Seal, breaking out of the capsule on the left. */}
        
         <a href="#top"
          className="relative z-10 -mr-7 block w-14 shrink-0 md:w-16"
          aria-label="Veymark, home"
        >
          <img
            ref={logoRef}
            src={LOGO_SRC}
            alt=""
            draggable={false}
            className="w-full select-none"
            style={{ willChange: "transform" }}
          />
        </a>

        <div
          ref={barRef}
          className="flex h-14 flex-1 items-center justify-between overflow-hidden rounded-full border pl-10 pr-2 md:h-16 md:pl-12"
          style={{
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            willChange: "background-color, box-shadow",
          }}
        >
          <span
            className="text-base font-black uppercase tracking-[0.22em] md:text-lg"
            style={{ color: WINE }}
          >
            Veymark
          </span>

          <nav className="flex items-center gap-1 md:gap-2">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="vm-link">
                <span className="vm-link-fill" />
                <span className="vm-link-text">{l.label}</span>
              </a>
            ))}

            
              <a href={X_URL}
              target="_blank"
              rel="noreferrer"
              className="vm-x"
              aria-label="Veymark on X"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M18.9 2.5h3.3l-7.2 8.2 8.5 11.3h-6.7l-5.2-6.9-6 6.9H2.3l7.7-8.8L1.9 2.5h6.8l4.7 6.3 5.5-6.3Zm-1.2 17.6h1.8L7.4 4.3H5.4l12.3 15.8Z" />
              </svg>
              <span className="hidden md:inline">Contact</span>
            </a>
          </nav>

          {/* Reading progress. */}
          <span
            ref={progressRef}
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
            style={{
              background: CORAL,
              transform: "scaleX(0)",
              willChange: "transform",
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        .vm-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          overflow: hidden;
          border-radius: 9999px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          isolation: isolate;
        }
        /* Coral wipes up from the bottom and the label flips to cream. */
        .vm-link-fill {
          position: absolute;
          inset: 0;
          z-index: -1;
          background: ${CORAL};
          transform: translateY(101%);
          transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .vm-link-text {
          color: ${WINE};
          transition: color 0.22s ease 0.05s;
        }
        .vm-link:hover .vm-link-fill,
        .vm-link:focus-visible .vm-link-fill {
          transform: translateY(0);
        }
        .vm-link:hover .vm-link-text,
        .vm-link:focus-visible .vm-link-text {
          color: ${CREAM};
        }

        .vm-x {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 9999px;
          background: ${WINE};
          color: ${CREAM};
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          transition: background-color 0.22s ease, transform 0.22s ease;
        }
        .vm-x:hover {
          background: ${CORAL};
          transform: translateY(-1px);
        }

        @media (prefers-reduced-motion: reduce) {
          .vm-link-fill,
          .vm-link-text,
          .vm-x {
            transition: none;
          }
        }
      `}</style>
    </header>
  );
}