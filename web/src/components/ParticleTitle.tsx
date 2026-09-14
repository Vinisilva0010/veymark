"use client";

import { useEffect, useRef } from "react";

// ---- knobs ----
const TEXT = "veymark";
// Cream (#fdf9eb) is the page background — it will be invisible there.
const COLORS = ["#500414"];
const GAP = 4; // pixel sampling step. Higher = fewer particles = lighter.
const REPEL_RADIUS = 145;
const REPEL_FORCE = 2.8;
// ---------------

const W = 1100;
const H = 340;

type P = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  phase: number;
};

export default function ParticleTitle() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let mouseX = -1000;
    let mouseY = -1000;
    let particles: P[] = [];

    const build = () => {
      const off = document.createElement("canvas");
      const octx = off.getContext("2d");
      if (!octx) return;

      off.width = W;
      off.height = H;

      let fontSize = 260;
      octx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
      while (octx.measureText(TEXT).width > W * 0.9 && fontSize > 20) {
        fontSize -= 2;
        octx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
      }

      const x = 0;
      const y = H / 2 + fontSize * 0.34;

      octx.clearRect(0, 0, W, H);
      octx.fillStyle = "#000";
      octx.fillText(TEXT, x, y);

      const data = octx.getImageData(0, 0, W, H).data;
      const next: P[] = [];

      for (let py = 0; py < H; py += GAP) {
        for (let px = 0; px < W; px += GAP) {
          if (data[(py * W + px) * 4 + 3] > 130) {
            const ci = Math.floor(((px / W) * COLORS.length) % COLORS.length);
            next.push({
              x: px + (Math.random() - 0.5) * 4,
              y: py + (Math.random() - 0.5) * 4,
              homeX: px,
              homeY: py,
              vx: 0,
              vy: 0,
             size: Math.random() < 0.15 ? 3.2 : 2.3,
              color: COLORS[ci],
              phase: Math.random() * Math.PI * 2,
            });
          }
        }
      }

      particles = next;
    };

    build();
    // No pointer on touch devices, so drive the repel point with a
    // slow figure-eight. Keeps the title alive on mobile.
    const touch = window.matchMedia("(hover: none)").matches;
    let raf = 0;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
            if (touch) {
        mouseX = W / 2 + Math.sin(t * 0.0006) * W * 0.42;
        mouseY = H / 2 + Math.sin(t * 0.0012) * H * 0.3;
      }

      for (const p of particles) {
        p.vx += (p.homeX - p.x) * 0.016;
        p.vy += (p.homeY - p.y) * 0.016;

        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const d = Math.hypot(dx, dy);

        if (d < REPEL_RADIUS) {
          const f = (REPEL_RADIUS - d) / REPEL_RADIUS;
          const a = Math.atan2(dy, dx);
          p.vx += Math.cos(a) * f * REPEL_FORCE;
          p.vy += Math.sin(a) * f * REPEL_FORCE;
        }

        p.vx += Math.sin(t * 0.0014 + p.phase) * 0.012;
        p.vy += Math.cos(t * 0.0011 + p.phase) * 0.012;

        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;

        const speed = Math.min(Math.hypot(p.vx, p.vy), 6);
       ctx.globalAlpha = 0.92 + Math.min(speed * 0.08, 0.08);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + speed * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / r.width) * W;
      mouseY = ((e.clientY - r.top) / r.height) * H;
    };
    const onLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={TEXT}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        aspectRatio: `${W} / ${H}`,
        touchAction: "none",
      }}
    />
  );
}