import { ShieldCheck, Scale, Lock, FileCheck2, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBarProps {
  className?: string;
  variant?: "light" | "dark";
}

const items = [
  { icon: Scale, label: "Ohio ORC §147.65" },
  { icon: ShieldCheck, label: "Commissioned & Bonded" },
  { icon: Lock, label: "AES-256 Encrypted" },
  { icon: Fingerprint, label: "KBA + Biometric ID" },
  { icon: FileCheck2, label: "10-Year Retention" },
];

/**
 * TrustBar — persistent legal/security signal lockup.
 * Place under the navbar on marketing pages.
 */
export function TrustBar({ className, variant = "light" }: TrustBarProps) {
  const tone =
    variant === "dark"
      ? "bg-foreground text-background border-foreground/40"
      : "bg-surface text-surface-foreground border-border-subtle";
  return (
    <div className={cn("w-full border-y", tone, className)} role="region" aria-label="Trust and compliance">
      <div className="container py-2.5">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
          {items.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5 whitespace-nowrap">
              <Icon className="h-3.5 w-3.5 opacity-80" aria-hidden />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
