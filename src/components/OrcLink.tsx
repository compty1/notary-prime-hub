import { ExternalLink } from "lucide-react";

interface OrcLinkProps {
  section: string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * Shared component that auto-generates hyperlinks to Ohio Revised Code sections on codes.ohio.gov.
 * Usage: <OrcLink section="147.60" /> renders "ORC §147.60" as a link
 *        <OrcLink section="147.60" label="Definitions" /> renders "ORC §147.60 — Definitions"
 */
export function OrcLink({ section, label, className = "", showIcon = true }: OrcLinkProps) {
  // Handle "Chapter 147" style references
  const isChapter = section.toLowerCase().startsWith("chapter");
  const url = isChapter
    ? `https://codes.ohio.gov/ohio-revised-code/chapter-${section.replace(/\D/g, "")}`
    : `https://codes.ohio.gov/ohio-revised-code/section-${section}`;

  const displayText = isChapter ? `ORC ${section}` : `ORC §${section}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-primary hover:underline font-medium ${className}`}
    >
      {displayText}
      {label && <span className="font-normal"> — {label}</span>}
      {showIcon && <ExternalLink className="h-3 w-3 flex-shrink-0" />}
    </a>
  );
}

/** Inline variant for use within prose text - smaller, less prominent */
export function OrcRef({ section, className = "" }: { section: string; className?: string }) {
  const url = `https://codes.ohio.gov/ohio-revised-code/section-${section}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-primary hover:underline ${className}`}
    >
      §{section}
    </a>
  );
}
