"use client";

import { useEffect, useRef, useState } from "react";

const LOGO_SRC = "/images/logo.png";

export default function Intro() {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  // The reading effect starts when the block is on screen, not on page load,
  // so it is never missed by someone who lands mid-page.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={"dm-intro" + (inView ? " is-in" : "")}>
      <img src={LOGO_SRC} alt="Veymark" className="dm-logo" />

      <h1 className="dm-hook" style={{ ["--i" as string]: 0 }}>
        Car parts you can verify on-chain.
      </h1>

      <p className="dm-line" style={{ ["--i" as string]: 1 }}>
        This page runs the <mark className="dm-mark">real Veymark system</mark>.
        Not a video, not a mockup.
      </p>

      <p className="dm-line" style={{ ["--i" as string]: 2 }}>
        Today a fake brake part passes the same test as a real one: a QR code
        anyone can photograph and reprint. Veymark puts a chip on the part that
        proves it is genuine{" "}
        <mark className="dm-mark">without ever revealing its secret</mark>, and{" "}
        <mark className="dm-mark">registers every part on Solana</mark> at the
        factory.
      </p>

      <p className="dm-line" style={{ ["--i" as string]: 3 }}>
        Scroll down and follow one part from the factory to a buyer&rsquo;s
        hand: the tag getting its secret, the passport minted on-chain, a phone
        checking it, and three ways to try to fool it.{" "}
        <mark className="dm-mark">All three fail.</mark>
      </p>

      <p className="dm-line" style={{ ["--i" as string]: 4 }}>
        The only thing simulated is the plastic tag, because physical tags are
        not in our hands yet. The cryptography, the database, the replay check
        and the Solana transactions are{" "}
        <mark className="dm-mark">live</mark>. Everything you trigger below runs
        in production.
      </p>

      <div className="dm-cue" style={{ ["--i" as string]: 5 }}>
        <span>Scroll to start</span>
        <span className="dm-cue-arrow" aria-hidden="true" />
      </div>
    </section>
  );
}
