"use client";

import { useEffect, useRef } from "react";

const CORAL = "247, 57, 98";
const W = 1000;
const H = 760;
const SEAL = 500; // logo size in canvas units

export default function SealHologram() {
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

    // Offscreen buffer: the logo is drawn here and every effect is
    // composited with "source-atop", so it only paints on pixels the
    // PNG actually covers. That gives us a perfect mask for free.
    const buf = document.createElement("canvas");
    buf.width = SEAL * dpr;
    buf.height = SEAL * dpr;
    const bctx = buf.getContext("2d");
    if (!bctx) return;
    bctx.scale(dpr, dpr);

    let mouseX = 0;
    let mouseY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let loaded = false;

    const img = new Image();
    img.src = "/images/logo.png";
    img.onload = () => {
      loaded = true;
    };

    const orbit = Array.from({ length: 22 }, (_, i) => ({
      angle: (Math.PI * 2 * i) / 22,
      radius: 265 + Math.random() * 120,
      speed: 0.00018 + Math.random() * 0.0004,
      size: 2 + Math.random() * 4,
      dir: Math.random() > 0.5 ? 1 : -1,
      alpha: 0.25 + Math.random() * 0.35,
    }));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    let raf = 0;
    let last = 0;

    const frame = (t: number) => {
      if (t - last < 30) {
        raf = requestAnimationFrame(frame);
        return;
      }
      last = t;

      ctx.clearRect(0, 0, W, H);

      smoothX += (mouseX - smoothX) * 0.05;
      smoothY += (mouseY - smoothY) * 0.05;

      const bob = Math.sin(t * 0.0009) * 10;
      const cx = W / 2 + smoothX * 26;
      const cy = H / 2 - 10 + smoothY * 18 + bob;

      // Halo behind the seal. Keeps it seated on the cream background
      // instead of floating on top of it.
      const glow = ctx.createRadialGradient(cx, cy, 30, cx, cy, 330);
      glow.addColorStop(0, `rgba(${CORAL}, 0.20)`);
      glow.addColorStop(0.4, `rgba(${CORAL}, 0.07)`);
      glow.addColorStop(1, `rgba(${CORAL}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Orbiting bits.
      for (const b of orbit) {
        const a = b.angle + t * b.speed * b.dir;
        const x = cx + Math.cos(a) * b.radius;
        const y = cy + Math.sin(a) * b.radius * 0.5;
        const depth = (Math.sin(a) + 1) / 2; // fade when behind
        ctx.fillStyle = `rgba(${CORAL}, ${b.alpha * (0.35 + depth * 0.65)})`;
        ctx.fillRect(x - b.size / 2, y - b.size / 2, b.size, b.size);
      }

      // Contact shadow on the ground plane.
      const sw = 210 - bob * 1.5;
      const sh = 26 - bob * 0.3;
      const sg = ctx.createRadialGradient(cx, cy + 250, 0, cx, cy + 250, sw);
      sg.addColorStop(0, `rgba(${CORAL}, 0.22)`);
      sg.addColorStop(1, `rgba(${CORAL}, 0)`);
      ctx.save();
      ctx.translate(cx, cy + 250);
      ctx.scale(1, sh / sw);
      ctx.translate(-cx, -(cy + 250));
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(cx, cy + 250, sw, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!loaded) {
        raf = requestAnimationFrame(frame);
        return;
      }

      // ---- build the seal in the offscreen buffer ----
      bctx.clearRect(0, 0, SEAL, SEAL);
      bctx.drawImage(img, 0, 0, SEAL, SEAL);

      bctx.globalCompositeOperation = "source-atop";

      // Scan band travelling top to bottom.
      const scanY = ((t * 0.15) % (SEAL + 120)) - 60;
      const band = bctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      band.addColorStop(0, "rgba(255,255,255,0)");
      band.addColorStop(0.45, "rgba(255,255,255,0.25)");
      band.addColorStop(0.5, "rgba(255,255,255,0.75)");
      band.addColorStop(0.55, "rgba(255,255,255,0.25)");
      band.addColorStop(1, "rgba(255,255,255,0)");
      bctx.fillStyle = band;
      bctx.fillRect(0, scanY - 30, SEAL, 60);

      // Horizontal interference lines, drifting slowly.
      const off = (t * 0.012) % 7;
      bctx.fillStyle = "rgba(24, 8, 14, 0.065)";
      for (let y = -7 + off; y < SEAL; y += 7) {
        bctx.fillRect(0, y, SEAL, 1);
      }

      bctx.globalCompositeOperation = "source-over";

      // ---- composite the buffer onto the scene ----
      const flicker = Math.sin(t * 0.021) > 0.95 ? 0.55 : 1;
      const half = SEAL / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(smoothX * 0.05);
      ctx.transform(1, smoothY * 0.05, smoothX * 0.07, 1, 0, 0);

      // Ghost copy, offset — the holographic double image.
      ctx.globalAlpha = 0.26 * flicker;
      ctx.drawImage(buf, -half - 9, -half + 11, SEAL, SEAL);

      ctx.globalAlpha = flicker;
      ctx.drawImage(buf, -half, -half, SEAL, SEAL);
      ctx.globalAlpha = 1;

      ctx.restore();

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouseY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      mouseX = 0;
      mouseY = 0;
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
      aria-label="Veymark seal"
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