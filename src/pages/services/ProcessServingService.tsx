/**
 * Sprint 5: Process Serving intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "serve_type", label: "Service Type", type: "select", required: true, options: [
    { value: "personal", label: "Personal Service" },
    { value: "substitute", label: "Substitute Service" },
    { value: "posting", label: "Posting/Nail & Mail" },
    { value: "skip_trace", label: "Skip Trace + Serve" },
  ]},
  { name: "recipient_name", label: "Recipient Name", type: "text", required: true },
  { name: "recipient_address", label: "Recipient Address", type: "textarea", required: true },
  { name: "case_number", label: "Case Number", type: "text" },
  { name: "court_name", label: "Court Name", type: "text" },
  { name: "deadline", label: "Service Deadline", type: "date" },
  { name: "attempts_requested", label: "Max Attempts", type: "number", placeholder: "3" },
  { name: "files", label: "Upload Documents to Serve", type: "file", required: true },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

export default function ProcessServingService() {
  usePageMeta({ title: "Process Serving" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="process-serving"
        serviceTitle="Process Serving"
        serviceDescription="Professional process serving with proof of service documentation."
        fields={FIELDS}
        estimatedPrice="From $65.00"
      />
    </div>
  );
}
