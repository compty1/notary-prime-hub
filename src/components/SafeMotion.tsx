/**
 * C-171: Motion wrapper that respects prefers-reduced-motion.
 * Wraps framer-motion to ensure accessibility compliance.
 */
import { motion, type MotionProps, type HTMLMotionProps } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

interface SafeMotionDivProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

/**
 * A div that animates with framer-motion but respects prefers-reduced-motion.
 * When reduced motion is preferred, animations are disabled.
 */
export const SafeMotionDiv = forwardRef<HTMLDivElement, SafeMotionDivProps>(
  ({ children, initial, animate, whileInView, transition, ...rest }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
      return <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
    }

    return (
      <motion.div
        ref={ref}
        initial={initial}
        animate={animate}
        whileInView={whileInView}
        transition={transition}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);

SafeMotionDiv.displayName = "SafeMotionDiv";

/** Fade-in animation preset */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

/** Slide-up animation preset */
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.35 },
};

/** Scale-in animation preset */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.25 },
};

/** Stagger children delay calculator */
export function staggerDelay(index: number, base = 0.05): number {
  return index * base;
}
