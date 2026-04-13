import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "business_name", label: "Business Name", type: "text", required: true },
  { name: "estimated_volume", label: "Estimated Monthly Volume", type: "select", required: true, options: [
    { value: "1-10", label: "1-10 notarizations" },
    { value: "11-50", label: "11-50 notarizations" },
    { value: "51-100", label: "51-100 notarizations" },
    { value: "100+", label: "100+ notarizations" },
  ]},
  { name: "service_types", label: "Primary Services Needed", type: "textarea", required: true, placeholder: "e.g. RON, document prep, apostille..." },
  { name: "contact_name", label: "Primary Contact Name", type: "text", required: true },
  { name: "contact_email", label: "Contact Email", type: "text", required: true },
  { name: "contact_phone", label: "Contact Phone", type: "text" },
  { name: "notes", label: "Additional Requirements", type: "textarea" },
];

export default function BusinessSubscriptions() {
  usePageMeta({ title: "Business Subscriptions" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="business-subscriptions"
        serviceTitle="Business Subscription Plans"
        serviceDescription="Volume-based subscription plans for businesses needing recurring notarization and document services."
        fields={FIELDS}
        estimatedPrice="Custom pricing"
      />
    </div>
  );
}
