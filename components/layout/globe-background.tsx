"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ambient Earth in the bottom-right corner, behind the whole app.
 *
 * The WebGL code (lib/globe) and its two textures (~170 KB) load once the
 * page is idle, so the first paint is never delayed. Skipped on devices that
 * ask to save data or have little memory; still (one frame) for people who
 * reduce motion.
 */
type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function canShowGlobe() {
  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 2) {
    return false;
  }
  return typeof WebGLRenderingContext !== "undefined";
}

function whenIdle(fn: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 1200);
  return () => window.clearTimeout(id);
}

export function GlobeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canShowGlobe()) return;
    let stop: (() => void) | null = null;
    let cancelled = false;

    const cancelIdle = whenIdle(() => {
      import("@/lib/globe/earth-globe")
        .then(({ mountEarthGlobe }) => {
          const canvas = canvasRef.current;
          if (cancelled || !canvas) return null;
          return mountEarthGlobe({
            canvas,
            dayUrl: "/globe/earth-day.webp",
            nightUrl: "/globe/earth-night.webp",
            animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            onFirstFrame: () => {
              if (!cancelled) setVisible(true);
            },
          });
        })
        .then((dispose) => {
          if (!dispose) return;
          if (cancelled) dispose();
          else stop = dispose;
        })
        // An ambient decoration: if it cannot start, the app simply has none.
        .catch(() => undefined);
    });

    return () => {
      cancelled = true;
      cancelIdle();
      stop?.();
      setVisible(false);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className={`globe-canvas absolute transition-opacity duration-[1600ms] ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
