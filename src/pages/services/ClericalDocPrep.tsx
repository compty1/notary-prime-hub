/**
 * Sprint 3: Clerical Document Preparation intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "document_type", label: "Document Type", type: "select", required: true, options: [
    { value: "letter", label: "Letter" },
    { value: "contract", label: "Contract" },
    { value: "affidavit", label: "Affidavit" },
    { value: "memorandum", label: "Memorandum" },
    { value: "agreement", label: "Agreement" },
    { value: "other", label: "Other" },
  ]},
  { name: "description", label: "Document Description", type: "textarea", required: true, placeholder: "Describe the document you need prepared..." },
  { name: "page_count", label: "Estimated Pages", type: "number", placeholder: "1" },
  { name: "deadline", label: "Deadline", type: "date" },
  { name: "source_documents", label: "Source Documents", type: "file", description: "Upload any reference documents" },
];

export default function ClericalDocPrep() {
  usePageMeta({ title: "Clerical Document Preparation" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Clerical Document Preparation">
        <ServiceIntakeForm
          serviceSlug="clerical-document-preparation"
          serviceTitle="Clerical Document Preparation"
          serviceDescription="Professional document drafting and preparation services. This is a clerical service — not legal advice."
          fields={FIELDS}
          estimatedPrice="From $25.00"
          consentItems={[{ id: "upl", label: "I understand this is a clerical service and does not constitute legal advice.", required: true }]}
        />
      </UPLGuard>
    </div>
  );
}
