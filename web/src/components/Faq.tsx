"use client";

import { useEffect, useRef, useState } from "react";

// ---- knobs ----
const CORAL = "#f73962";
const WINE = "#500414";
// ---------------

const ITEMS = [
  {
    q: "What happens if someone clones the chip?",
    a: "A genuine NXP chip carries a factory signature the phone checks before anything else runs, so a cheap clone fails immediately. Cloning the silicon itself means fabricating authentic NXP parts — that is not a counterfeiter with a printer, that is a semiconductor operation. And even then, each tap must produce a code that has never been used; replaying a captured one fails.",
  },
  {
    q: "So it's impossible to fake?",
    a: "No, and we won't say it is. Someone can build a parallel fake ecosystem: their own site, their own tags, their own distribution. No system in any industry removes that. What we remove is the easy attack — photograph the label, reprint it — which is how counterfeit parts are authenticated today. What's left is expensive, traceable and prosecutable.",
  },
  {
    q: "Why blockchain? Couldn't this be a normal database?",
    a: "A database works until the question becomes 'who do I trust to run it'. A manufacturer verifying against our private server is trusting us; a buyer verifying against the manufacturer's server is trusting them. On Solana the record is public: anyone reads it in a block explorer and checks it against the manufacturer's public wallet, without our site being involved at all.",
  },
  {
    q: "Why Solana and not another chain?",
    a: "Because every individual part becomes its own token, and that only works where minting costs close to nothing. Compressed NFTs make a passport per unit economically viable down to a $200 shock absorber. On most other networks the issuance cost alone rules out anything but luxury goods.",
  },
  {
    q: "Does the buyer need an app or a wallet?",
    a: "No. They hold the phone near the part, the browser opens on its own, and the answer appears. No install, no account, no wallet. The chain is underneath, not in front.",
  },
  {
    q: "What if the tag is damaged or the part isn't registered?",
    a: "The screen says we could not verify it — never that it is counterfeit. A damaged tag and a fake tag look identical to software, and accusing a legitimate buyer of holding a fake is a worse failure than saying we don't know. From there we send them to the manufacturer's official channel.",
  },
  {
    q: "Where can I see it working?",
    a: "Nothing has shipped. The chips are renders and the transactions are on devnet while we build. We publish progress as it happens rather than after — what's on the site is the state of the work, not a promise about it.",
  },
];

function Item({
  q,
  a,
  open,
  onToggle,
  index,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  const bodyRef = useRef<HTMLDivElement | null>(null);

  // Animating to a measured pixel height keeps it smooth without a library.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.maxHeight = open ? `${el.scrollHeight}px` : "0px";
  }, [open]);

  return (
    <div className="vm-faq-item">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="vm-faq-btn"
      >
        <span className="vm-faq-n">{String(index + 1).padStart(2, "0")}</span>
        <span className="vm-faq-q">{q}</span>
        <span className={`vm-faq-icon ${open ? "is-open" : ""}`} aria-hidden>
          <span />
          <span />
        </span>
      </button>

      <div ref={bodyRef} className="vm-faq-body">
        <p className="vm-faq-a">{a}</p>
      </div>
    </div>
  );
}

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 py-28 md:py-36">
      <span
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: CORAL }}
      >
        FAQ
      </span>
      <h2
        className="mt-4 max-w-2xl text-4xl font-bold leading-[1.05] md:text-5xl"
        style={{ color: WINE }}
      >
        The questions worth asking.
      </h2>

      <div className="mt-14">
        {ITEMS.map((item, i) => (
          <Item
            key={item.q}
            index={i}
            q={item.q}
            a={item.a}
            open={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </div>

      <style jsx global>{`
        .vm-faq-item {
          border-top: 1px solid rgba(80, 4, 20, 0.14);
        }
        .vm-faq-item:last-child {
          border-bottom: 1px solid rgba(80, 4, 20, 0.14);
        }

        .vm-faq-btn {
          position: relative;
          display: grid;
          grid-template-columns: 42px 1fr 26px;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 26px 4px;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
        }
        /* Coral bar grows from the left edge on hover and while open. */
        .vm-faq-btn::before {
          content: "";
          position: absolute;
          left: -14px;
          top: 18%;
          height: 64%;
          width: 3px;
          background: ${CORAL};
          transform: scaleY(0);
          transform-origin: top;
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .vm-faq-btn:hover::before,
        .vm-faq-btn[aria-expanded="true"]::before {
          transform: scaleY(1);
        }

        .vm-faq-n {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: ${CORAL};
          opacity: 0.5;
        }
        .vm-faq-btn[aria-expanded="true"] .vm-faq-n {
          opacity: 1;
        }

        .vm-faq-q {
          font-size: 19px;
          font-weight: 700;
          line-height: 1.3;
          color: ${WINE};
        }
        @media (min-width: 768px) {
          .vm-faq-q {
            font-size: 21px;
          }
        }

        /* Plus that rotates into a minus. */
        .vm-faq-icon {
          position: relative;
          width: 18px;
          height: 18px;
          justify-self: end;
        }
        .vm-faq-icon span {
          position: absolute;
          left: 0;
          top: 50%;
          width: 18px;
          height: 2px;
          background: ${WINE};
          transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .vm-faq-icon span:nth-child(2) {
          transform: rotate(90deg);
        }
        .vm-faq-icon.is-open span:nth-child(1) {
          transform: rotate(180deg);
        }
        .vm-faq-icon.is-open span:nth-child(2) {
          transform: rotate(180deg);
        }

        .vm-faq-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.38s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .vm-faq-a {
          padding: 0 26px 28px 56px;
          font-size: 16.5px;
          font-weight: 500;
          line-height: 1.62;
          color: rgba(80, 4, 20, 0.72);
        }

        @media (prefers-reduced-motion: reduce) {
          .vm-faq-btn::before,
          .vm-faq-icon span,
          .vm-faq-body {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}