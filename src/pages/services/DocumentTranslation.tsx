/**
 * Sprint 3: Document Translation intake (enhances existing AdminTranslations)
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "source_language", label: "Source Language", type: "select", required: true, options: [
    { value: "Spanish", label: "Spanish" }, { value: "Mandarin", label: "Mandarin" },
    { value: "Arabic", label: "Arabic" }, { value: "French", label: "French" },
    { value: "Portuguese", label: "Portuguese" }, { value: "German", label: "German" },
    { value: "Japanese", label: "Japanese" }, { value: "Korean", label: "Korean" },
    { value: "other", label: "Other" },
  ]},
  { name: "target_language", label: "Target Language", type: "select", required: true, options: [
    { value: "English", label: "English" }, { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" }, { value: "other", label: "Other" },
  ]},
  { name: "document_type", label: "Document Type", type: "select", required: true, options: [
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "marriage_certificate", label: "Marriage Certificate" },
    { value: "diploma", label: "Diploma/Transcript" },
    { value: "legal_document", label: "Legal Document" },
    { value: "business_document", label: "Business Document" },
    { value: "other", label: "Other" },
  ]},
  { name: "certified", label: "Certified Translation Needed", type: "switch", placeholder: "Includes translator certification" },
  { name: "page_count", label: "Page Count", type: "number", required: true },
  { name: "deadline", label: "Deadline", type: "date" },
  { name: "files", label: "Upload Documents", type: "file", required: true },
];

export default function DocumentTranslation() {
  usePageMeta({ title: "Document Translation" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="document-translation"
        serviceTitle="Document Translation Services"
        serviceDescription="Professional document translation with optional certified translator certification."
        fields={FIELDS}
        estimatedPrice="From $30.00/page"
      />
    </div>
  );
}
