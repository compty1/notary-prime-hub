import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "current_status", label: "Current Notary Status", type: "select", required: true, options: [
    { value: "not-commissioned", label: "Not yet commissioned" },
    { value: "traditional", label: "Traditional notary (no RON)" },
    { value: "ron-pending", label: "RON application pending" },
    { value: "ron-active", label: "RON active, need help" },
  ]},
  { name: "state", label: "Commission State", type: "text", required: true, placeholder: "e.g. Ohio" },
  { name: "goals", label: "Consulting Goals", type: "textarea", required: true, placeholder: "What do you need help with?" },
  { name: "preferred_schedule", label: "Preferred Schedule", type: "select", options: [
    { value: "weekday", label: "Weekday" },
    { value: "evening", label: "Evening" },
    { value: "weekend", label: "Weekend" },
  ]},
];

export default function RonOnboardingConsulting() {
  usePageMeta({ title: "RON Onboarding Consulting" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="ron-onboarding-consulting"
        serviceTitle="RON Onboarding Consulting"
        serviceDescription="Expert guidance for notaries transitioning to Remote Online Notarization, covering Ohio ORC §147.66 requirements, technology setup, and best practices."
        fields={FIELDS}
        estimatedPrice="From $199.00/session"
      />
    </div>
  );
}
