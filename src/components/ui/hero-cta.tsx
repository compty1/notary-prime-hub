import * as React from "react";
import { Link } from "react-router-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline";

const BASE =
  "rounded-full px-8 border-2 border-foreground shadow-block " +
  "hover:-translate-y-0.5 hover:shadow-block-lg active:translate-y-0 active:shadow-block-active " +
  "font-black tracking-tight uppercase transition-all duration-150";

const VARIANT_CLS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary",
  outline: "bg-card text-foreground hover:bg-card",
};

export interface HeroCTAProps extends Omit<ButtonProps, "variant"> {
  /** Visual variant — primary (yellow) or outline (paper card). */
  variant?: Variant;
  /** Optional internal route — renders as a react-router Link. */
  to?: string;
  /** Optional external href — renders as an anchor. */
  href?: string;
}

/**
 * Standardized Block Shadow CTA for every public marketing surface.
 * Use instead of bare <Button size="lg"> in heroes and section CTAs so the
 * shape, border, shadow, and motion never drift across pages.
 */
export const HeroCTA = React.forwardRef<HTMLButtonElement, HeroCTAProps>(function HeroCTA(
  { variant = "primary", to, href, className, children, size = "lg", ...rest },
  ref,
) {
  const btn = (
    <Button ref={ref} size={size} className={cn(BASE, VARIANT_CLS[variant], className)} {...rest}>
      {children}
    </Button>
  );
  if (to) return <Link to={to}>{btn}</Link>;
  if (href) return <a href={href}>{btn}</a>;
  return btn;
});
