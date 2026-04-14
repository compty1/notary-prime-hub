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

const PACKAGES = [
  { id: "heuristic", name: "Heuristic Review", price: "$499", description: "Expert evaluation", features: ["10-point heuristic analysis", "Annotated screenshots", "Priority issue list", "PDF report", "1 follow-up call"] },
  { id: "comprehensive", name: "Comprehensive", price: "$1,299", description: "Full UX audit", features: ["Heuristic review", "User flow analysis", "Accessibility check (WCAG 2.1)", "Competitive benchmarking", "Detailed recommendations", "Priority roadmap", "2 follow-up calls"], recommended: true },
  { id: "cro", name: "CRO Package", price: "$1,999", description: "Conversion optimization", features: ["Full UX audit", "Conversion funnel analysis", "A/B test recommendations", "Wireframe mockups", "Implementation guidance", "90-day support", "Monthly check-ins"] },
];

const FAQ = [
  { q: "How long does an audit take?", a: "Heuristic reviews take 3-5 business days. Comprehensive audits take 2-3 weeks. CRO packages run 4-6 weeks." },
  { q: "What deliverables do I receive?", a: "A detailed PDF report with annotated screenshots, prioritized recommendations, and an implementation roadmap." },
  { q: "Do you implement the changes?", a: "We provide recommendations and can partner with your development team. Implementation support is available as an add-on." },
  { q: "Do you test on mobile?", a: "Yes, all audits include mobile responsiveness evaluation across common device sizes." },
];

const TIMELINE = {
  steps: [
    { title: "Kickoff Call", description: "Discuss goals, target audience, and focus areas" },
    { title: "Data Collection", description: "Access setup, analytics review, and user flow mapping" },
    { title: "Expert Analysis", description: "Systematic evaluation against UX best practices" },
    { title: "Report Preparation", description: "Compile findings with annotated visuals and recommendations" },
    { title: "Presentation & Roadmap", description: "Walk through findings and prioritized implementation plan" },
  ],
  turnaround: "1-3 weeks",
};

export default function UxAudit() {
  usePageMeta({ title: "UX Audit & Heuristic Review" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="ux-audit--heuristic-review"
        serviceTitle="UX Audit & Heuristic Review"
        serviceDescription="Comprehensive UX evaluation with actionable improvement recommendations based on industry best practices."
        fields={FIELDS}
        estimatedPrice="From $499"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
