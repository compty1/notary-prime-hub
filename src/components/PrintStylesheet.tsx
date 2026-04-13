/**
 * BR-008: Print stylesheet injection for certificates, invoices, and journal pages
 * Import this component once in PageShell or App to inject global print styles.
 */
import { useEffect } from "react";

const PRINT_CSS = `
@media print {
  /* Hide navigation, footer, FAB, chatbot, back-to-top, cookie consent */
  nav, footer, .mobile-fab, .ai-chatbot, .back-to-top,
  .cookie-consent, .offline-indicator,
  [data-no-print], button[aria-label="Back to top"],
  .sidebar, [data-sidebar] {
    display: none !important;
  }

  /* Reset backgrounds for ink savings */
  body, main, .min-h-screen {
    background: white !important;
    color: black !important;
  }

  /* Ensure content takes full width */
  main {
    margin: 0 !important;
    padding: 0.5in !important;
    max-width: 100% !important;
  }

  /* Brand header for printed pages */
  .print-header {
    display: block !important;
    text-align: center;
    border-bottom: 2px solid #1a1a2e;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  /* Page break controls */
  .page-break-before { page-break-before: always; }
  .page-break-after { page-break-after: always; }
  .no-page-break { page-break-inside: avoid; }

  /* Table styling for print */
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 10pt; }
  th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }

  /* Links show URL */
  a[href]:not([href^="#"])::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }
}
`;

export function PrintStylesheet() {
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-print-styles", "true");
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);
  return null;
}
