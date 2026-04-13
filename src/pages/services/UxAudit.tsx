import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "website_url", label: "Website / App URL", type: "text", required: true },
  { name: "audit_type", label: "Audit Type", type: "select", required: true, options: [
    { value: "heuristic", label: "Heuristic Review" },
    { value: "accessibility", label: "Accessibility Audit (WCAG)" },
    { value: "conversion", label: "Conversion Rate Optimization" },
    { value: "comprehensive", label: "Comprehensive UX Audit" },
  ]},
  { name: "focus_areas", label: "Focus Areas", type: "textarea", placeholder: "e.g. checkout flow, onboarding, mobile experience" },
  { name: "target_audience", label: "Target Users", type: "text", placeholder: "e.g. notaries, legal professionals" },
  { name: "competitors", label: "Key Competitors", type: "textarea", placeholder: "List competitor websites for benchmarking" },
  { name: "notes", label: "Additional Context", type: "textarea" },
];

export default function UxAudit() {
  usePageMeta({ title: "UX Audit & Heuristic Review" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="ux-audit--heuristic-review"
        serviceTitle="UX Audit & Heuristic Review"
        serviceDescription="Comprehensive UX evaluation with actionable improvement recommendations based on industry best practices."
        fields={FIELDS}
        estimatedPrice="From $499.00"
      />
    </div>
  );
}
