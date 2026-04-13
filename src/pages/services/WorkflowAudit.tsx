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
      />
    </div>
  );
}
