/**
 * UI-008: Reduced motion compliance wrapper
 * Provides animation variants that respect prefers-reduced-motion
 */
import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

export const safePageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

export const noMotion = {
  initial: {},
  animate: {},
  exit: {},
  transition: { duration: 0 },
};

export function getMotionProps(prefersReduced: boolean) {
  return prefersReduced ? noMotion : safePageTransition;
}
