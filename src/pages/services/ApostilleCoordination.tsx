/**
 * Sprint 3: Apostille Coordination intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "document_type", label: "Document Type", type: "select", required: true, options: [
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "marriage_certificate", label: "Marriage Certificate" },
    { value: "death_certificate", label: "Death Certificate" },
    { value: "diploma", label: "Diploma/Degree" },
    { value: "power_of_attorney", label: "Power of Attorney" },
    { value: "corporate_document", label: "Corporate Document" },
    { value: "court_document", label: "Court Document" },
    { value: "other", label: "Other" },
  ]},
  { name: "destination_country", label: "Destination Country", type: "text", required: true },
  { name: "document_count", label: "Number of Documents", type: "number", required: true },
  { name: "issuing_state", label: "Document Issuing State", type: "text", required: true, placeholder: "e.g., Ohio" },
  { name: "urgency", label: "Processing Speed", type: "select", options: [
    { value: "standard", label: "Standard (2-3 weeks)" },
    { value: "expedited", label: "Expedited (5-7 days)" },
    { value: "rush", label: "Rush (2-3 days)" },
  ]},
  { name: "files", label: "Upload Documents", type: "file" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

export default function ApostilleCoordination() {
  usePageMeta({ title: "Apostille Coordination" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="apostille-coordination"
        serviceTitle="Apostille Coordination"
        serviceDescription="We coordinate the apostille process for your documents through the Ohio Secretary of State."
        fields={FIELDS}
        estimatedPrice="From $75.00"
      />
    </div>
  );
}
