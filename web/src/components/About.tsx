"use client";

import { useEffect, useRef } from "react";

// ---- knobs ----
const CORAL = "#f73962";
const WINE = "#500414";
const CREAM = "#fdf9eb";
// ---------------

const PROOFS = [
  {
    n: "01",
    title: "Proof of silicon",
    body: "Every genuine NXP chip carries a factory signature the phone checks on the spot, with no server in the loop. A cheap clone fails here before anything else runs.",
  },
  {
    n: "02",
    title: "Proof of touch",
    body: "Each tap produces a code the chip has never produced before. A copy of a previous tap is already dead on arrival.",
  },
  {
    n: "03",
    title: "Proof in the open",
    body: "The record sits on Solana. Anyone can read it in a block explorer, without trusting our site — or a cloned one — and check it against the manufacturer's public wallet.",
  },
];

/** Reveals children one after another when the block enters the viewport. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("vm-in");
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return ref;
}

export default function About() {
  const proofsRef = useReveal<HTMLDivElement>();
  const limitRef = useReveal<HTMLDivElement>();
  const founderRef = useReveal<HTMLDivElement>();

  return (
    <section id="about" className="mx-auto max-w-6xl px-6 py-28 md:py-40">
      {/* Statement */}
      <div className="max-w-3xl">
        <span
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: CORAL }}
        >
          About
        </span>
        <h2
          className="mt-4 text-4xl font-bold leading-[1.05] md:text-6xl"
          style={{ color: WINE }}
        >
          Every proof of authenticity on the market can be defeated with a
          camera and a printer.
        </h2>
        <p
          className="mt-7 max-w-2xl text-xl font-medium leading-snug md:text-2xl"
          style={{ color: `${WINE}C0` }}
        >
          QR codes, serial numbers, holographic seals — all of them are things
          you can see. Anything you can see, you can photograph. Veymark puts a
          secret inside the part that never appears on any screen, and proves it
          exists on every single tap.
        </p>
      </div>

      {/* Three proofs */}
      <div ref={proofsRef} className="vm-stagger mt-24 grid gap-5 md:grid-cols-3">
        {PROOFS.map((p) => (
          <article key={p.n} className="vm-card">
            <span className="vm-card-n">{p.n}</span>
            <h3
              className="mt-6 text-2xl font-bold leading-tight"
              style={{ color: WINE }}
            >
              {p.title}
            </h3>
            <p
              className="mt-3 text-base font-medium leading-relaxed"
              style={{ color: `${WINE}A8` }}
            >
              {p.body}
            </p>
          </article>
        ))}
      </div>

      {/* The limit we admit */}
      <div
        ref={limitRef}
        className="vm-fade mt-24 overflow-hidden rounded-3xl px-8 py-12 md:px-14 md:py-16"
        style={{ background: WINE, color: CREAM }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: CORAL }}
        >
          What we don&apos;t claim
        </span>
        <h3 className="mt-4 max-w-3xl text-3xl font-bold leading-tight md:text-4xl">
          We will never tell you this is impossible to fake.
        </h3>
        <p
          className="mt-6 max-w-2xl text-lg font-medium leading-relaxed"
          style={{ color: "rgba(253,249,235,0.78)" }}
        >
          Any screen in the world can be cloned visually — your bank&apos;s, a
          watchmaker&apos;s, ours. What we remove is the easy attack: photograph
          and reprint. What&apos;s left is building a parallel fake ecosystem —
          own site, own tags, own distribution. That is expensive, traceable and
          prosecutable, and no system in any industry eliminates it. It is
          fought with official channels and criminal courts, not engineering.
        </p>
        <p
          className="mt-6 max-w-2xl text-base font-semibold"
          style={{ color: CREAM }}
        >
          Anyone promising you perfection is selling you the next thing that
          gets copied.
        </p>
      </div>

      {/* Founder */}
      <div
        ref={founderRef}
        className="vm-fade mt-24 grid items-start gap-10 md:grid-cols-[1fr_1.3fr]"
      >
        <div>
          <span
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: CORAL }}
          >
            Why us
          </span>
          <h3
            className="mt-4 text-3xl font-bold leading-tight md:text-4xl"
            style={{ color: WINE }}
          >
            Twenty-two years inside the problem.
          </h3>
        </div>

        <div>
          <p
            className="text-lg font-medium leading-relaxed"
            style={{ color: `${WINE}C0` }}
          >
            One of our founders spent 22 years at GM Brazil building new cars:
            sourcing parts, running the lab, signing off on quality. Ask him
            about counterfeit parts and he doesn&apos;t quote a statistic. He
            names the supplier, the batch and the failure.
          </p>
          <p
            className="mt-5 text-lg font-medium leading-relaxed"
            style={{ color: `${WINE}C0` }}
          >
            The other half of the team builds on Solana. That combination is the
            whole reason this is a security product and not a collectibles
            product: a fake bearing doesn&apos;t cost a brand its margin. It
            costs someone their car at speed.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .vm-card {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid rgba(80, 4, 20, 0.12);
          background: rgba(253, 249, 235, 0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 34px 28px 32px;
          opacity: 0;
          transform: translateY(26px);
          transition:
            opacity 0.6s ease,
            transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.3s ease;
        }
        .vm-stagger.vm-in .vm-card {
          opacity: 1;
          transform: translateY(0);
        }
        .vm-stagger.vm-in .vm-card:nth-child(2) {
          transition-delay: 0.12s;
        }
        .vm-stagger.vm-in .vm-card:nth-child(3) {
          transition-delay: 0.24s;
        }
        .vm-card:hover {
          border-color: ${CORAL};
        }
        /* Oversized numeral bleeding off the corner. */
        .vm-card-n {
          display: block;
          font-size: 64px;
          font-weight: 900;
          line-height: 0.8;
          letter-spacing: -0.04em;
          color: ${CORAL};
          opacity: 0.22;
          transition: opacity 0.3s ease;
        }
        .vm-card:hover .vm-card-n {
          opacity: 1;
        }

        .vm-fade {
          opacity: 0;
          transform: translateY(26px);
          transition:
            opacity 0.7s ease,
            transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .vm-fade.vm-in {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .vm-card,
          .vm-fade {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}