import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "source_language", label: "Source Language", type: "text", required: true, placeholder: "e.g. Spanish" },
  { name: "target_language", label: "Target Language", type: "text", required: true, placeholder: "e.g. English" },
  { name: "document_type", label: "Document Type", type: "select", required: true, options: [
    { value: "personal", label: "Personal Document" },
    { value: "business", label: "Business Document" },
    { value: "academic", label: "Academic Record" },
    { value: "medical", label: "Medical Record" },
    { value: "other", label: "Other" },
  ]},
  { name: "page_count", label: "Estimated Page Count", type: "number", placeholder: "1" },
  { name: "deadline", label: "Preferred Deadline", type: "date" },
  { name: "source_documents", label: "Upload Documents", type: "file", description: "Upload files to be translated" },
  { name: "notes", label: "Additional Notes", type: "textarea", placeholder: "Any special instructions..." },
];

export default function StandardTranslation() {
  usePageMeta({ title: "Standard Translation Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="standard-translation"
        serviceTitle="Standard Translation"
        serviceDescription="Professional document translation services for personal, business, and academic documents."
        fields={FIELDS}
        estimatedPrice="From $30.00/page"
      />
    </div>
  );
}
