"use client";

import { useEffect, useRef } from "react";

const CREAM = "#fdf9eb";
const CORAL = [245, 115, 137] as const;

type Blob = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  px: number;
  py: number;
};

export default function Background() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render at half resolution and let the browser scale it up.
    // Big soft gradients hide the loss completely and it costs a
    // quarter of the pixels.
    const SCALE = 0.5;

    let w = 0;
    let h = 0;

       const blobs: Blob[] = [
      { x: 0.15, y: 0.2, r: 0.55, alpha: 0.5, ax: 0.28, ay: 0.22, sx: 0.00045, sy: 0.00058, px: 0, py: 1.7 },
      { x: 0.85, y: 0.6, r: 0.6, alpha: 0.42, ax: 0.32, ay: 0.26, sx: 0.00034, sy: 0.0004, px: 2.1, py: 0.4 },
      { x: 0.45, y: 0.95, r: 0.5, alpha: 0.38, ax: 0.25, ay: 0.24, sx: 0.00056, sy: 0.00033, px: 4.2, py: 3.1 },
    ];

    const resize = () => {
      w = Math.floor(window.innerWidth * SCALE);
      h = Math.floor(window.innerHeight * SCALE);
      canvas.width = w;
      canvas.height = h;
    };

    resize();
    window.addEventListener("resize", resize);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let last = 0;

    const draw = (t: number) => {
      // Cap at ~30fps. The motion is slow enough that nobody can tell,
      // and it halves the work.
      if (t - last < 33) {
        raf = requestAnimationFrame(draw);
        return;
      }
      last = t;

      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, w, h);

      const base = Math.max(w, h);

      for (const b of blobs) {
        const cx = (b.x + Math.sin(t * b.sx + b.px) * b.ax) * w;
        const cy = (b.y + Math.cos(t * b.sy + b.py) * b.ay) * h;
        const r = b.r * base * (1 + Math.sin(t * b.sx * 0.7 + b.px) * 0.22);

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${CORAL[0]},${CORAL[1]},${CORAL[2]},${b.alpha})`);
        g.addColorStop(0.45, `rgba(${CORAL[0]},${CORAL[1]},${CORAL[2]},${b.alpha * 0.35})`);
        g.addColorStop(1, `rgba(${CORAL[0]},${CORAL[1]},${CORAL[2]},0)`);

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -10,
        pointerEvents: "none",
        backgroundColor: CREAM,
      }}
    />
  );
}