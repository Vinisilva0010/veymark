"use client";

/**
 * The explainer video, between the opening statement and the scrolling story.
 *
 * Plays muted on its own once it is on screen — every browser blocks sound
 * that starts without a click — and carries a sound button, since the video
 * has narration. Clicking the frame opens it larger with sound on: someone
 * who asked for the big version wants to hear it.
 *
 * Nothing loads until the section is reached, so a visitor who never scrolls
 * this far downloads none of it.
 */

import { useEffect, useRef, useState } from "react";

const CORAL = "#f73962";
const WINE = "#500414";
const CREAM = "#fdf9eb";

export default function VideoPanel() {
  const section = useRef<HTMLDivElement | null>(null);
  const inline = useRef<HTMLVideoElement | null>(null);

  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const [open, setOpen] = useState(false);

  // Start loading and playing only once the section comes into view.
  useEffect(() => {
    const el = section.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (visible) inline.current?.play().catch(() => {});
  }, [visible]);

  // The inline video should not keep playing behind the enlarged one.
  useEffect(() => {
    if (!open) return;

    inline.current?.pause();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      inline.current?.play().catch(() => {});
    };
  }, [open]);

  return (
    <section
      id="video"
      ref={section}
      className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 md:py-32"
    >
      <div className="w-full max-w-3xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Play the video full size"
          className="group relative block w-full overflow-hidden rounded-3xl shadow-2xl transition hover:-translate-y-1"
          style={{ boxShadow: "0 24px 60px rgba(80,4,20,0.28)" }}
        >
          <video
            ref={inline}
            src={visible ? "/video.mp4" : undefined}
            muted={muted}
            loop
            playsInline
            preload="none"
            className="block aspect-video w-full object-cover"
          />

          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-4 text-base font-bold text-white"
            style={{
              background:
                "linear-gradient(to top, rgba(18,3,8,0.75), rgba(18,3,8,0))",
            }}
          >
            <span>Click to watch</span>
          </span>
        </button>

        <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              setMuted((m) => !m);
              inline.current?.play().catch(() => {});
            }}
            className="w-full rounded-xl border-2 px-6 py-3 text-base font-bold sm:w-auto"
            style={{ borderColor: WINE, color: WINE }}
          >
            {muted ? "Turn sound on" : "Turn sound off"}
          </button>
        </div>

        <p
          className="mt-12 text-center text-lg font-medium leading-relaxed"
          style={{ color: WINE }}
        >
          The demo takes you through the whole thing: a tag written on the
          factory line, a buyer checking the part, and three attacks running
          against the live system.
        </p>

        <div className="mt-6 flex justify-center">
          <a
            href="/demo"
            className="w-full rounded-xl px-8 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 sm:w-auto"
            style={{ background: CORAL, boxShadow: "0 10px 24px rgba(247,57,98,0.35)" }}
          >
            Open the demo
          </a>
        </div>

        <div
          className="mt-12 flex flex-col items-center gap-2 text-sm font-bold uppercase tracking-[0.18em]"
          style={{ color: WINE }}
        >
          Keep scrolling
          <span className="vm-scroll-arrow" aria-hidden="true">
            ↓
          </span>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(18, 3, 8, 0.8)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-4xl">
            <div className="flex justify-end pb-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-xl px-4 py-2 text-lg font-bold"
                style={{ background: CREAM, color: WINE }}
              >
                ×
              </button>
            </div>

            <video
              src="/video.mp4"
              controls
              autoPlay
              playsInline
              className="block aspect-video w-full rounded-2xl bg-black"
            />
          </div>
        </div>
      )}
    </section>
  );
}
