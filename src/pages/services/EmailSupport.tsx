import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "business_name", label: "Business Name", type: "text", required: true },
  { name: "support_volume", label: "Expected Ticket Volume", type: "select", required: true, options: [
    { value: "under-50", label: "Under 50/month" },
    { value: "50-200", label: "50-200/month" },
    { value: "200+", label: "200+/month" },
  ]},
  { name: "response_time", label: "Required Response Time", type: "select", options: [
    { value: "24h", label: "Within 24 hours" },
    { value: "4h", label: "Within 4 hours" },
    { value: "1h", label: "Within 1 hour" },
  ]},
  { name: "scope", label: "Support Scope", type: "textarea", required: true, placeholder: "What types of questions will customers ask?" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

export default function EmailSupport() {
  usePageMeta({ title: "Email Support" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="email-support-handling"
        serviceTitle="Email Support Handling"
        serviceDescription="Professional email customer support managed on your behalf with branded responses."
        fields={FIELDS}
        estimatedPrice="From $499.00/month"
      />
    </div>
  );
}
