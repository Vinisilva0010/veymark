"use client";

import { useEffect, useRef } from "react";

// ---- knobs ----
const PART_SRC = "/images/part.png";
const PANEL_HEIGHT = "300vh"; // per panel. Longer = slower.
const CORAL = "#f73962";
const WINE = "#500414";
const CREAM = "#fdf9eb";
const GREEN = "#1f8a4c";
const AMBER = "#d9a514";
const ORANGE = "#e06a15";
// ---------------

type State = "authentic" | "unverified" | "suspicious";

const track = (p: number, s: number, e: number) =>
  Math.min(1, Math.max(0, (p - s) / (e - s)));

/* ------------------------------------------------------------------ */
/* Phone screens                                                       */
/* ------------------------------------------------------------------ */

function AddressBar() {
  return (
    <div
      className="flex items-center gap-[4px] px-[6%] py-[3%]"
      style={{ background: "#eceadd", borderBottom: "1px solid #dcd8c7" }}
    >
      <svg viewBox="0 0 24 24" className="w-[7%]" fill="none">
        <rect x="5" y="10" width="14" height="10" rx="2" fill="#4a4a4a" />
        <path
          d="M8 10V7.5a4 4 0 118 0V10"
          stroke="#4a4a4a"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <span className="text-[7px] tracking-tight" style={{ color: "#4a4a4a" }}>
        veymark.xyz/v/8f2c…
      </span>
    </div>
  );
}

function StatusIcon({ kind }: { kind: State }) {
  if (kind === "authentic") {
    return (
      <svg viewBox="0 0 24 24" className="w-[26%]" fill="none">
        <circle cx="12" cy="12" r="11" fill={GREEN} />
        <path
          d="M7 12.4l3.2 3.2L17 9"
          stroke={CREAM}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const color = kind === "unverified" ? AMBER : ORANGE;
  return (
    <svg viewBox="0 0 24 24" className="w-[26%]" fill="none">
      <circle cx="12" cy="12" r="11" fill={color} />
      <path
        d="M12 6.6v7"
        stroke={CREAM}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.4" r="1.35" fill={CREAM} />
    </svg>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-[3%]"
      style={{ borderTop: "1px solid rgba(80,4,20,0.10)" }}
    >
      <span className="text-[7px] uppercase tracking-wide" style={{ color: `${WINE}80` }}>
        {label}
      </span>
      <span className="text-[8px] font-semibold" style={{ color: WINE }}>
        {value}
      </span>
    </div>
  );
}

function Screen({ state }: { state: State }) {
  if (state === "authentic") {
    return (
      <div className="flex h-full flex-col px-[8%] pb-[6%] pt-[5%]">
        <span className="text-[6.5px] uppercase tracking-[0.14em]" style={{ color: `${WINE}70` }}>
          Part verified for
        </span>
        <span className="mt-[1%] text-[13px] font-bold leading-none" style={{ color: WINE }}>
          Fremax
        </span>

        <div className="mt-[7%] flex flex-col items-center">
          <StatusIcon kind="authentic" />
          <span className="mt-[4%] text-[11px] font-bold" style={{ color: WINE }}>
            Authentic part
          </span>
          <span
            className="mt-[3%] rounded-full px-[6%] py-[2%] text-[6.5px] font-semibold"
            style={{ background: "rgba(31,138,76,0.12)", color: GREEN }}
          >
            NXP silicon verified
          </span>
          <span className="mt-[2%] text-[6.5px]" style={{ color: `${WINE}80` }}>
            First verification of this code
          </span>
        </div>

        <div className="mt-[6%]">
          <DataRow label="Part" value="BD-4718" />
          <DataRow label="Batch" value="24-B" />
          <DataRow label="Made" value="2026-04-11" />
        </div>

        <div
          className="mt-[5%] rounded-[6px] px-[5%] py-[3.5%] text-[7px] font-semibold"
          style={{ border: `1px solid ${WINE}25`, color: WINE }}
        >
          How do we know it&apos;s authentic? ›
        </div>

        <span className="mt-auto pt-[5%] text-center text-[6px]" style={{ color: `${WINE}55` }}>
          Sealed by Veymark
        </span>
      </div>
    );
  }

  if (state === "unverified") {
    return (
      <div className="flex h-full flex-col px-[8%] pb-[6%] pt-[8%]">
        <div className="flex flex-col items-center">
          <StatusIcon kind="unverified" />
          <span className="mt-[4%] text-center text-[11px] font-bold leading-tight" style={{ color: WINE }}>
            Could not verify
          </span>
        </div>

        <p className="mt-[6%] text-[7px] leading-[1.5]" style={{ color: `${WINE}A0` }}>
          This tag matches no record. It may be a damaged tag or a product that
          was never registered. This does not confirm the product is fake.
        </p>

        <div
          className="mt-[6%] rounded-[6px] px-[5%] py-[4%]"
          style={{ background: "rgba(217,165,20,0.10)" }}
        >
          <span className="text-[7px] leading-[1.5]" style={{ color: WINE }}>
            Confirm through the manufacturer&apos;s official channel.
          </span>
        </div>

        <div
          className="mt-[5%] rounded-[6px] py-[4%] text-center text-[7.5px] font-bold"
          style={{ background: WINE, color: CREAM }}
        >
          Contact the manufacturer
        </div>

        <span className="mt-auto pt-[5%] text-center text-[6px]" style={{ color: `${WINE}55` }}>
          Sealed by Veymark
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-[8%] pb-[6%] pt-[6%]">
      <div className="flex flex-col items-center">
        <StatusIcon kind="suspicious" />
        <span className="mt-[4%] text-center text-[10.5px] font-bold leading-tight" style={{ color: WINE }}>
          Unusual verification
        </span>
      </div>

      <p className="mt-[5%] text-[7px] leading-[1.5]" style={{ color: `${WINE}A0` }}>
        This code was verified in another region minutes ago. That can indicate
        a copy or a diversion in distribution.
      </p>

      <div className="mt-[4%]">
        <DataRow label="Part" value="BD-4718" />
        <DataRow label="Batch" value="24-B" />
      </div>

      <div className="mt-[4%] space-y-[3%]">
        {[
          ["Today 14:02", "São Paulo, BR"],
          ["Today 13:47", "Curitiba, BR"],
          ["Aug 12", "Factory"],
        ].map(([when, where]) => (
          <div key={when} className="flex justify-between text-[6.5px]" style={{ color: `${WINE}90` }}>
            <span>{when}</span>
            <span>{where}</span>
          </div>
        ))}
      </div>

      <div
        className="mt-[5%] rounded-[6px] py-[4%] text-center text-[7.5px] font-bold"
        style={{ background: ORANGE, color: CREAM }}
      >
        Report to the manufacturer
      </div>

      <span className="mt-auto pt-[4%] text-center text-[6px]" style={{ color: `${WINE}55` }}>
        Sealed by Veymark
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scroll-driven panel                                                 */
/* ------------------------------------------------------------------ */

function Panel({
  state,
  eyebrow,
  title,
  body,
}: {
  state: State;
  eyebrow: string;
  title: string;
  body: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const partRef = useRef<HTMLDivElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const wavesRef = useRef<HTMLDivElement | null>(null);
  const idleRef = useRef<HTMLDivElement | null>(null);
  const scanRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    let queued = false;

    const apply = (p: number) => {
      const a = track(p, 0, 0.15);
      const b = track(p, 0.15, 0.4);
      const c = track(p, 0.4, 0.55);
      const d = track(p, 0.55, 0.7);
      const e = track(p, 0.7, 0.84);

      if (textRef.current) {
        textRef.current.style.opacity = String(track(p, 0.02, 0.2));
        textRef.current.style.transform = `translate3d(0, ${
          (1 - track(p, 0.02, 0.2)) * 24
        }px, 0)`;
      }
      if (partRef.current) {
        partRef.current.style.opacity = String(a);
        partRef.current.style.transform = `translate3d(0, ${
          (1 - a) * 36
        }px, 0) scale(${0.95 + a * 0.05})`;
      }
      if (phoneRef.current) {
        phoneRef.current.style.opacity = String(b);
        phoneRef.current.style.transform = `translate3d(${c * -13}%, ${
          (1 - b) * 90
        }%, 0) rotate(${8 - c * 8}deg)`;
      }
      if (wavesRef.current) wavesRef.current.style.opacity = String(c * (1 - d));
      if (idleRef.current) idleRef.current.style.opacity = String(1 - d);
      if (scanRef.current) scanRef.current.style.opacity = String(d * (1 - e));
      if (resultRef.current) {
        resultRef.current.style.opacity = String(e);
        resultRef.current.style.transform = `translate3d(0, ${
          (1 - e) * 8
        }px, 0)`;
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(() => {
        queued = false;
        const r = section.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        if (total <= 0) return;
        apply(Math.min(1, Math.max(0, -r.top / total)));
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
    <section ref={sectionRef} style={{ height: PANEL_HEIGHT }}>
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
          {/* Left: explanation */}
          <div ref={textRef} className="opacity-0" style={{ willChange: "transform, opacity" }}>
            <span
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: CORAL }}
            >
              {eyebrow}
            </span>
            <h2
              className="mt-3 text-3xl font-bold leading-tight md:text-4xl"
              style={{ color: WINE }}
            >
              {title}
            </h2>
            <p
              className="mt-5 max-w-md text-lg font-medium leading-snug"
              style={{ color: `${WINE}C0` }}
            >
              {body}
            </p>
          </div>

          {/* Right: animation */}
          <div className="relative mx-auto aspect-square w-full max-w-[400px]">
            <div
              ref={partRef}
              className="absolute inset-0 flex items-center justify-center opacity-0"
              style={{ willChange: "transform, opacity" }}
            >
              <img src={PART_SRC} alt="" className="w-[76%] select-none" draggable={false} />
            </div>

            <div
              ref={wavesRef}
              aria-hidden
              className="absolute left-1/2 top-1/2 opacity-0"
              style={{ willChange: "opacity" }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="vm-wave"
                  style={{ border: `2px solid ${CORAL}`, animationDelay: `${i * 0.55}s` }}
                />
              ))}
            </div>

            <div
              ref={phoneRef}
              className="absolute bottom-[-4%] right-0 h-[88%] w-[42%] opacity-0"
              style={{ willChange: "transform, opacity" }}
            >
              <div
                className="relative h-full w-full overflow-hidden rounded-[13%] p-[3.5%] shadow-2xl"
                style={{ background: "#191113" }}
              >
                <div
                  className="relative h-full w-full overflow-hidden rounded-[10%]"
                  style={{ background: CREAM }}
                >
                  <AddressBar />

                  <div className="relative h-[calc(100%-13%)]">
                    <div
                      ref={idleRef}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span
                        className="text-[8px] font-semibold tracking-wide"
                        style={{ color: `${WINE}80` }}
                      >
                        HOLD NEAR PART
                      </span>
                    </div>

                    <div
                      ref={scanRef}
                      className="absolute inset-0 flex items-center justify-center opacity-0"
                    >
                      <span className="vm-spin" style={{ borderTopColor: CORAL }} />
                    </div>

                    <div
                      ref={resultRef}
                      className="absolute inset-0 opacity-0"
                      style={{ willChange: "transform, opacity" }}
                    >
                      <Screen state={state} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export default function VerifyStates() {
  return (
    <>
      <Panel
        state="authentic"
        eyebrow="State 01"
        title="The part is genuine."
        body="The chip answers with a code it has never used before, and the browser confirms the silicon is real NXP. The manufacturer's name is the one you trust — not ours."
      />
      <Panel
        state="unverified"
        eyebrow="State 02"
        title="We can't confirm it."
        body="A damaged tag and a fake tag look the same to software. So we never say counterfeit. We say we don't know, and we send you to the channel the counterfeiter doesn't control."
      />
      <Panel
        state="suspicious"
        eyebrow="State 03"
        title="The chip is real. The pattern isn't."
        body="Same code, two cities, twenty minutes apart. The cryptography passed, so someone holds the genuine part — and someone else holds a copy. The manufacturer needs to know which."
      />

      <style jsx global>{`
        .vm-wave {
          position: absolute;
          left: 0;
          top: 0;
          width: 40px;
          height: 40px;
          margin: -20px 0 0 -20px;
          border-radius: 9999px;
          opacity: 0;
          animation: vm-ping 1.65s ease-out infinite;
        }
        @keyframes vm-ping {
          0% {
            transform: scale(0.4);
            opacity: 0.7;
          }
          100% {
            transform: scale(4.2);
            opacity: 0;
          }
        }
        .vm-spin {
          width: 26%;
          aspect-ratio: 1;
          border-radius: 9999px;
          border: 3px solid rgba(80, 4, 20, 0.15);
          animation: vm-rot 0.9s linear infinite;
        }
        @keyframes vm-rot {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vm-wave,
          .vm-spin {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}