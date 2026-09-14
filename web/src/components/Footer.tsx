"use client";

import { useEffect, useRef } from "react";

// ---- knobs ----
const LOGO_SRC = "/images/logo.png";
const X_URL = "https://x.com/veymark_xyz";
const CORAL = "#f73962";
const WINE = "#500414";
const CREAM = "#fdf9eb";
// ---------------

export default function Footer() {
  const sealRef = useRef<HTMLDivElement | null>(null);
  const stampRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const stamp = stampRef.current;
    if (!stamp) return;

    // The seal presses down into the footer when it comes into view —
    // a wax stamp closing the page.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stamp.classList.add("vm-stamped");
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    io.observe(stamp);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    let raf = 0;
    const spin = (t: number) => {
      ring.style.transform = `rotate(${(t * 0.004) % 360}deg)`;
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <footer
      className="relative mt-32 overflow-hidden"
      style={{ background: WINE, color: CREAM }}
    >
      {/* Torn wax edge along the top. */}
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        className="block h-6 w-full md:h-10"
        aria-hidden
      >
        <path
          d="M0 40 V14 Q 50 2 100 14 T 200 14 T 300 14 T 400 14 T 500 14 T 600 14 T 700 14 T 800 14 T 900 14 T 1000 14 T 1100 14 T 1200 14 V40 Z"
          fill={WINE}
        />
      </svg>

      <div className="mx-auto max-w-6xl px-6 pb-10 pt-4 md:pb-14">
        {/* Stamped seal with the rotating text ring around it. */}
        <div className="flex justify-center">
          <div
            ref={stampRef}
            className="vm-stamp relative h-36 w-36 md:h-44 md:w-44"
          >
            <svg
              ref={ringRef}
              viewBox="0 0 200 200"
              className="absolute inset-0 h-full w-full"
              style={{ willChange: "transform" }}
              aria-hidden
            >
              <defs>
                <path
                  id="vm-ring"
                  d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
                  fill="none"
                />
              </defs>
              <text
                fill={CREAM}
                fillOpacity="0.45"
                fontSize="11"
                fontWeight="700"
                letterSpacing="5.4"
              >
                <textPath href="#vm-ring" startOffset="0">
                  PHYSICAL PROOF YOU CAN&apos;T PHOTOGRAPH · SEALED BY VEYMARK ·
                </textPath>
              </text>
            </svg>

            <div
              ref={sealRef}
              className="absolute inset-[22%] flex items-center justify-center"
            >
              <img
                src={LOGO_SRC}
                alt="Veymark seal"
                draggable={false}
                className="w-full select-none"
              />
            </div>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-lg font-medium leading-snug md:text-xl">
          A photo can copy a label. A photo can&apos;t copy a secret.
        </p>

        <div className="mt-10 flex justify-center">
          <a href={X_URL} target="_blank" rel="noreferrer" className="vm-foot-x">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M18.9 2.5h3.3l-7.2 8.2 8.5 11.3h-6.7l-5.2-6.9-6 6.9H2.3l7.7-8.8L1.9 2.5h6.8l4.7 6.3 5.5-6.3Zm-1.2 17.6h1.8L7.4 4.3H5.4l12.3 15.8Z" />
            </svg>
            @veymark_xyz
          </a>
        </div>

        <div
          className="mt-10 flex flex-col items-center gap-3 border-t pt-6 text-xs md:flex-row md:justify-between"
          style={{ borderColor: "rgba(253,249,235,0.16)" }}
        >
          <span style={{ color: "rgba(253,249,235,0.55)" }}>
            Veymark · Built on Solana
          </span>

          <nav className="flex gap-5">
            <a href="#about" className="vm-foot-link">
              About
            </a>
            <a href="#faq" className="vm-foot-link">
              FAQ
            </a>
          </nav>

          <span style={{ color: "rgba(253,249,235,0.4)" }}>
            Devnet. Nothing shipped yet.
          </span>
        </div>
      </div>

      <style jsx global>{`
        .vm-stamp {
          transform: scale(1.3) rotate(-14deg);
          opacity: 0;
          transition:
            transform 0.75s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.5s ease;
        }
        .vm-stamp.vm-stamped {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }

        .vm-foot-x {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 9999px;
          border: 1px solid rgba(253, 249, 235, 0.28);
          padding: 11px 20px;
          font-size: 14px;
          font-weight: 700;
          color: ${CREAM};
          transition:
            background-color 0.24s ease,
            border-color 0.24s ease,
            transform 0.24s ease;
        }
        .vm-foot-x:hover {
          background: ${CORAL};
          border-color: ${CORAL};
          transform: translateY(-2px);
        }

        .vm-foot-link {
          position: relative;
          color: rgba(253, 249, 235, 0.72);
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .vm-foot-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -4px;
          height: 1.5px;
          width: 100%;
          background: ${CORAL};
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .vm-foot-link:hover {
          color: ${CREAM};
        }
        .vm-foot-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }

        @media (prefers-reduced-motion: reduce) {
          .vm-stamp {
            transition: none;
            transform: none;
            opacity: 1;
          }
        }
      `}</style>
    </footer>
  );
}