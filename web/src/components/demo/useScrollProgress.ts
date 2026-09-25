"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Progress of a tall section through the viewport, from 0 to 1.
 * Read once per animation frame so scrolling stays smooth.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    let queued = false;
    let raf = 0;

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(() => {
        queued = false;
        const rect = section.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total <= 0) return;
        setProgress(Math.min(1, Math.max(0, -rect.top / total)));
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

  return { ref, progress };
}
