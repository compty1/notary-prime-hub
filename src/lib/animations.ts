import { Variants } from "framer-motion";

// Check if user prefers reduced motion (item 572)
const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const duration = (d: number) => prefersReducedMotion ? 0.01 : d;
const delay = (d: number) => prefersReducedMotion ? 0 : d;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: delay(i * 0.08), duration: duration(0.5), ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: prefersReducedMotion ? "blur(0px)" : "blur(10px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: { delay: delay(i * 0.08), duration: duration(0.5), ease: "easeOut" },
  }),
};

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.97 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: delay(i * 0.06), duration: duration(0.4), ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.05,
      delayChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration(0.3), ease: "easeOut" },
  },
};

export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration(0.6), ease: [0.16, 1, 0.3, 1] },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
  animate: { opacity: 1, y: 0, transition: { duration: duration(0.3), ease: "easeOut" as const } },
  exit: { opacity: 0, y: prefersReducedMotion ? 0 : -8, transition: { duration: duration(0.2) } },
};
