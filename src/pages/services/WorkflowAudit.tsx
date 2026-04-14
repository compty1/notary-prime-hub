import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "business_name", label: "Business / Practice Name", type: "text", required: true },
  { name: "current_tools", label: "Current Tools & Platforms", type: "textarea", placeholder: "List software, platforms, and tools you currently use..." },
  { name: "pain_points", label: "Key Pain Points", type: "textarea", required: true, placeholder: "Describe inefficiencies or challenges..." },
  { name: "team_size", label: "Team Size", type: "select", options: [
    { value: "solo", label: "Solo practitioner" },
    { value: "2-5", label: "2-5 people" },
    { value: "6-20", label: "6-20 people" },
    { value: "20+", label: "20+ people" },
  ]},
  { name: "notes", label: "Additional Context", type: "textarea" },
];

const PACKAGES = [
  { id: "basic", name: "Quick Assessment", price: "$299.00", description: "High-level workflow review", features: ["60-min discovery call", "Tool stack assessment", "Top 5 recommendations", "Summary report"] },
  { id: "standard", name: "Full Audit", price: "$599.00", description: "Comprehensive workflow analysis", features: ["All Quick Assessment features", "Process mapping", "Automation opportunities", "Cost-benefit analysis", "Detailed implementation plan"], popular: true },
  { id: "implementation", name: "Audit + Implementation", price: "$1,499.00", description: "Audit with hands-on implementation", features: ["All Full Audit features", "Tool setup and configuration", "Team training (2 sessions)", "30-day support", "ROI tracking"] },
];

const FAQ = [
  { q: "What types of workflows do you audit?", a: "We audit notary workflows, legal document processing, client intake, scheduling, billing, document management, and general office operations. We specialize in document-heavy service businesses." },
  { q: "Will I need to buy new software?", a: "Not necessarily. We often find that existing tools are underutilized. Our recommendations focus on optimizing current tools first, then suggest new ones only when there's a clear ROI." },
  { q: "How much time do I need to invest?", a: "A Quick Assessment requires about 1 hour of your time. A Full Audit typically involves 2–3 hours across discovery calls and review sessions." },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Discovery", description: "Review current tools and interview team" },
    { step: 2, label: "Process Mapping", description: "Document current workflows step by step" },
    { step: 3, label: "Analysis", description: "Identify bottlenecks and opportunities" },
    { step: 4, label: "Recommendations", description: "Deliver prioritized improvement plan" },
  ],
  turnaround: "5–10 business days",
};

export default function WorkflowAudit() {
  usePageMeta({ title: "Workflow Audit" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="workflow-audit"
        serviceTitle="Workflow Audit & Optimization"
        serviceDescription="Comprehensive review of your notary or document services workflow with actionable efficiency recommendations."
        fields={FIELDS}
        estimatedPrice="From $299.00"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
