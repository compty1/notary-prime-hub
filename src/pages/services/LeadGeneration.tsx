import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "target_market", label: "Target Market", type: "text", required: true, placeholder: "e.g. real estate agents in Columbus, OH" },
  { name: "lead_count", label: "Desired Lead Count", type: "select", required: true, options: [
    { value: "50", label: "50 leads" },
    { value: "100", label: "100 leads" },
    { value: "250", label: "250 leads" },
    { value: "500+", label: "500+ leads" },
  ]},
  { name: "data_points", label: "Data Points Needed", type: "textarea", placeholder: "e.g. name, email, phone, company, title" },
  { name: "delivery_format", label: "Delivery Format", type: "select", options: [
    { value: "csv", label: "CSV / Excel" },
    { value: "crm", label: "Direct CRM Import" },
  ]},
  { name: "notes", label: "Additional Criteria", type: "textarea" },
];

export default function LeadGeneration() {
  usePageMeta({ title: "Lead Generation" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="lead-generation"
        serviceTitle="Lead Generation"
        serviceDescription="Targeted prospect research and lead list building for your business development needs."
        fields={FIELDS}
        estimatedPrice="From $0.50/lead"
      />
    </div>
  );
}
