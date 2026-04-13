import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "source_language", label: "Source Language", type: "text", required: true },
  { name: "target_language", label: "Target Language", type: "text", required: true },
  { name: "court_name", label: "Court Name", type: "text", required: true, placeholder: "e.g. Franklin County Common Pleas" },
  { name: "case_number", label: "Case Number", type: "text" },
  { name: "document_type", label: "Document Type", type: "text", required: true },
  { name: "page_count", label: "Page Count", type: "number", placeholder: "1" },
  { name: "deadline", label: "Court Deadline", type: "date", required: true },
  { name: "source_documents", label: "Upload Documents", type: "file", required: true },
];

export default function CourtCertifiedTranslation() {
  usePageMeta({ title: "Court-Certified Translation" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="court-certified-translation"
        serviceTitle="Court-Certified Translation"
        serviceDescription="Translations prepared for court filings with sworn translator affidavit, accepted by Ohio courts."
        fields={FIELDS}
        estimatedPrice="From $65.00/page"
        consentItems={[{ id: "court", label: "I understand that court-certified translations include a sworn affidavit from the translator.", required: true }]}
      />
    </div>
  );
}
