import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "email_volume", label: "Daily Email Volume", type: "select", required: true, options: [
    { value: "under-25", label: "Under 25 emails" },
    { value: "25-50", label: "25-50 emails" },
    { value: "50-100", label: "50-100 emails" },
    { value: "100+", label: "100+ emails" },
  ]},
  { name: "services_needed", label: "Services Needed", type: "textarea", required: true, placeholder: "e.g. inbox management, response drafting, scheduling..." },
  { name: "hours_per_week", label: "Hours Per Week", type: "select", options: [
    { value: "5", label: "5 hours" },
    { value: "10", label: "10 hours" },
    { value: "20", label: "20 hours" },
    { value: "40", label: "Full-time (40 hours)" },
  ]},
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

export default function EmailManagement() {
  usePageMeta({ title: "Email Management" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="email-management"
        serviceTitle="Email Management"
        serviceDescription="Professional email inbox management, response handling, and organization services."
        fields={FIELDS}
        estimatedPrice="From $25.00/hour"
      />
    </div>
  );
}
