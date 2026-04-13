/**
 * Sprint 3: Consular Legalization Prep
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "destination_country", label: "Destination Country", type: "text", required: true, placeholder: "e.g., China, UAE, Saudi Arabia" },
  { name: "document_type", label: "Document Type", type: "select", required: true, options: [
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "marriage_certificate", label: "Marriage Certificate" },
    { value: "diploma", label: "Diploma/Degree" },
    { value: "power_of_attorney", label: "Power of Attorney" },
    { value: "business_document", label: "Business Document" },
    { value: "other", label: "Other" },
  ]},
  { name: "document_count", label: "Number of Documents", type: "number", required: true },
  { name: "urgency", label: "Urgency", type: "select", options: [
    { value: "standard", label: "Standard (2–4 weeks)" },
    { value: "expedited", label: "Expedited (1–2 weeks)" },
    { value: "rush", label: "Rush (3–5 days)" },
  ]},
  { name: "consulate_location", label: "Nearest Consulate", type: "text", placeholder: "e.g., Chicago, IL" },
  { name: "files", label: "Upload Documents", type: "file" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

export default function ConsularLegalization() {
  usePageMeta({ title: "Consular Legalization Prep" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="consular-legalization"
        serviceTitle="Consular Legalization Preparation"
        serviceDescription="Prepare your documents for consular legalization. We handle the coordination — you provide the documents."
        fields={FIELDS}
        estimatedPrice="From $75.00"
      />
    </div>
  );
}
