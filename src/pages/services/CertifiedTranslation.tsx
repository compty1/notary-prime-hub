import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "source_language", label: "Source Language", type: "text", required: true },
  { name: "target_language", label: "Target Language", type: "text", required: true, placeholder: "e.g. English" },
  { name: "document_type", label: "Document Type", type: "select", required: true, options: [
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "marriage_certificate", label: "Marriage Certificate" },
    { value: "diploma", label: "Diploma / Degree" },
    { value: "transcript", label: "Academic Transcript" },
    { value: "immigration", label: "Immigration Document" },
    { value: "legal", label: "Legal Document" },
    { value: "other", label: "Other" },
  ]},
  { name: "purpose", label: "Purpose of Translation", type: "select", required: true, options: [
    { value: "uscis", label: "USCIS / Immigration" },
    { value: "education", label: "Educational Institution" },
    { value: "legal", label: "Legal Proceedings" },
    { value: "personal", label: "Personal Use" },
  ]},
  { name: "page_count", label: "Page Count", type: "number", placeholder: "1" },
  { name: "rush", label: "Rush Service Needed?", type: "select", options: [
    { value: "no", label: "Standard (3-5 business days)" },
    { value: "yes", label: "Rush (1-2 business days, +50%)" },
  ]},
  { name: "source_documents", label: "Upload Documents", type: "file", required: true },
];

export default function CertifiedTranslation() {
  usePageMeta({ title: "Certified Translation Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="certified-translation"
        serviceTitle="Certified Translation"
        serviceDescription="USCIS-accepted certified translations with a Certificate of Translation Accuracy for official use."
        fields={FIELDS}
        estimatedPrice="From $45.00/page"
        consentItems={[{ id: "accuracy", label: "I understand the certified translation will include a signed Certificate of Accuracy.", required: true }]}
      />
    </div>
  );
}
