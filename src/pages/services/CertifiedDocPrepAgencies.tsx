import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "agency_name", label: "Agency / Firm Name", type: "text", required: true },
  { name: "document_types", label: "Document Types", type: "textarea", required: true, placeholder: "List the document types you need prepared..." },
  { name: "volume", label: "Monthly Volume", type: "select", required: true, options: [
    { value: "1-10", label: "1-10 documents" },
    { value: "11-50", label: "11-50 documents" },
    { value: "51-100", label: "51-100 documents" },
    { value: "100+", label: "100+ documents" },
  ]},
  { name: "turnaround", label: "Standard Turnaround", type: "select", options: [
    { value: "24h", label: "24 hours" },
    { value: "48h", label: "48 hours" },
    { value: "1week", label: "1 week" },
  ]},
  { name: "notes", label: "Special Requirements", type: "textarea" },
];

const PACKAGES = [
  { id: "basic", name: "Per-Document", price: "$15/doc", description: "Pay per document, no commitment", features: ["Standard formatting", "48-hour turnaround", "1 revision round", "Email delivery"] },
  { id: "agency", name: "Agency Plan", price: "$299/mo", description: "Up to 30 documents/month", features: ["30 documents included", "24-hour turnaround", "2 revision rounds", "Template library access", "Dedicated prep specialist"], recommended: true },
  { id: "enterprise", name: "Enterprise", price: "$699/mo", description: "Unlimited documents", features: ["Unlimited documents", "Same-day turnaround", "Unlimited revisions", "Custom templates", "API integration", "Priority queue"] },
];

const FAQ = [
  { question: "What is clerical document preparation?", answer: "We prepare documents based on information you provide. This is a clerical service and does not constitute legal advice." },
  { question: "What document formats do you support?", answer: "We deliver in PDF, DOCX, and fillable PDF formats. Custom formats available on Enterprise plans." },
  { question: "Can you prepare court filings?", answer: "We can prepare clerical court forms based on your instructions. We do not provide legal advice or representation." },
  { question: "Do you maintain confidentiality?", answer: "Yes, all documents are handled under strict NDA and our privacy policy. Enterprise clients receive a custom confidentiality agreement." },
];

const CHECKLIST = [
  { id: "info", label: "Client/signer information sheet completed", required: true },
  { id: "templates", label: "Sample or template documents (if applicable)" },
  { id: "instructions", label: "Specific formatting instructions or requirements" },
  { id: "deadline", label: "Filing deadline or due date noted" },
];

export default function CertifiedDocPrepAgencies() {
  usePageMeta({ title: "Certified Document Prep for Agencies" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Certified Document Preparation">
        <ServiceIntakeForm
          serviceSlug="certified-doc-prep-agencies"
          serviceTitle="Certified Document Preparation for Agencies"
          serviceDescription="Bulk document preparation services for agencies, law firms, and organizations. Clerical service only."
          fields={FIELDS}
          estimatedPrice="From $15/document"
          packages={PACKAGES}
          faq={FAQ}
          checklist={CHECKLIST}
          consentItems={[{ id: "upl", label: "I understand this is a clerical service and does not constitute legal advice.", required: true }]}
        />
      </UPLGuard>
    </div>
  );
}
