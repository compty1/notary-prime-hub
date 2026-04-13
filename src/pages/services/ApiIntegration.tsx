import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "company_name", label: "Company Name", type: "text", required: true },
  { name: "use_case", label: "Integration Use Case", type: "textarea", required: true, placeholder: "Describe how you'd like to integrate our services..." },
  { name: "volume", label: "Expected Monthly API Calls", type: "select", required: true, options: [
    { value: "under-100", label: "Under 100" },
    { value: "100-1000", label: "100-1,000" },
    { value: "1000-10000", label: "1,000-10,000" },
    { value: "10000+", label: "10,000+" },
  ]},
  { name: "technical_contact", label: "Technical Contact Email", type: "text", required: true },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

export default function ApiIntegration() {
  usePageMeta({ title: "API Integration" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="api-integration"
        serviceTitle="API Integration"
        serviceDescription="Integrate notarization and document services directly into your application via our REST API."
        fields={FIELDS}
        estimatedPrice="Custom pricing"
      />
    </div>
  );
}
