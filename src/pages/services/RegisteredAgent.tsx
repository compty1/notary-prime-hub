import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "business_name", label: "Business Name", type: "text", required: true },
  { name: "entity_type", label: "Entity Type", type: "select", required: true, options: [
    { value: "llc", label: "LLC" },
    { value: "corporation", label: "Corporation" },
    { value: "nonprofit", label: "Non-Profit" },
    { value: "other", label: "Other" },
  ]},
  { name: "state", label: "State of Registration", type: "text", required: true, placeholder: "e.g. Ohio" },
  { name: "current_agent", label: "Current Registered Agent (if any)", type: "text" },
  { name: "start_date", label: "Desired Start Date", type: "date" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

export default function RegisteredAgent() {
  usePageMeta({ title: "Registered Agent Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="registered-agent"
        serviceTitle="Registered Agent Services"
        serviceDescription="Reliable registered agent services for Ohio businesses — receive and forward legal documents, state filings, and compliance notices."
        fields={FIELDS}
        estimatedPrice="From $149.00/year"
      />
    </div>
  );
}
