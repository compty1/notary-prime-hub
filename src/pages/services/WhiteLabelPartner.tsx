import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "company_name", label: "Company Name", type: "text", required: true },
  { name: "website", label: "Website URL", type: "text" },
  { name: "industry", label: "Industry", type: "select", required: true, options: [
    { value: "legal", label: "Legal Services" },
    { value: "real-estate", label: "Real Estate" },
    { value: "finance", label: "Financial Services" },
    { value: "insurance", label: "Insurance" },
    { value: "other", label: "Other" },
  ]},
  { name: "description", label: "Partnership Goals", type: "textarea", required: true },
  { name: "volume", label: "Expected Monthly Volume", type: "text" },
  { name: "contact_name", label: "Contact Name", type: "text", required: true },
  { name: "contact_email", label: "Contact Email", type: "text", required: true },
];

export default function WhiteLabelPartner() {
  usePageMeta({ title: "White-Label Partnership" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="white-label-partner"
        serviceTitle="White-Label Partnership"
        serviceDescription="Offer notarization and document services under your brand with our white-label partnership program."
        fields={FIELDS}
        estimatedPrice="Custom pricing"
      />
    </div>
  );
}
