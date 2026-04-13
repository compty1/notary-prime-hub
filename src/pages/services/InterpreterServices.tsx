/**
 * Sprint 3: Interpreter Services
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "language_from", label: "From Language", type: "select", required: true, options: [
    { value: "English", label: "English" }, { value: "Spanish", label: "Spanish" },
    { value: "Mandarin", label: "Mandarin" }, { value: "Arabic", label: "Arabic" },
    { value: "French", label: "French" }, { value: "other", label: "Other" },
  ]},
  { name: "language_to", label: "To Language", type: "select", required: true, options: [
    { value: "English", label: "English" }, { value: "Spanish", label: "Spanish" },
    { value: "Mandarin", label: "Mandarin" }, { value: "Arabic", label: "Arabic" },
    { value: "French", label: "French" }, { value: "other", label: "Other" },
  ]},
  { name: "session_type", label: "Session Type", type: "select", required: true, options: [
    { value: "in_person", label: "In-Person" },
    { value: "phone", label: "Phone" },
    { value: "video", label: "Video Call" },
  ]},
  { name: "preferred_date", label: "Preferred Date", type: "date", required: true },
  { name: "duration_estimate", label: "Estimated Duration (minutes)", type: "number" },
  { name: "context", label: "Context/Purpose", type: "textarea", required: true, placeholder: "e.g., Notarization session, legal meeting..." },
];

export default function InterpreterServices() {
  usePageMeta({ title: "Interpreter Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="interpreter"
        serviceTitle="Interpreter Services"
        serviceDescription="Professional interpretation services for notarizations, legal meetings, and more."
        fields={FIELDS}
        estimatedPrice="From $50.00/hour"
      />
    </div>
  );
}
