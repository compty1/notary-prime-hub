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

const PACKAGES = [
  { id: "simple", name: "Simple Document", price: "$25", description: "1-3 page documents", features: ["Up to 3 pages", "Standard formatting", "PDF delivery", "1 revision"] },
  { id: "standard", name: "Standard", price: "$50", description: "4-10 page documents", features: ["Up to 10 pages", "Professional formatting", "PDF + DOCX delivery", "2 revisions"], recommended: true },
  { id: "complex", name: "Complex Document", price: "$100+", description: "11+ pages or specialized", features: ["Unlimited pages", "Custom formatting", "All formats", "Unlimited revisions", "Rush available"] },
];

const ADDONS = [
  { id: "rush", label: "Rush Delivery", price: "$20", description: "Same-day turnaround" },
  { id: "notarize", label: "Add Notarization", price: "$25", description: "Notarize the completed document" },
  { id: "copies", label: "Certified Copies", price: "$5/copy", description: "Additional certified copies" },
];

const FAQ = [
  { q: "What is clerical document preparation?", a: "We type, format, and organize documents based on information you provide. We do not offer legal advice." },
  { q: "Can I provide handwritten notes?", a: "Yes, we can transcribe handwritten notes into professional typed documents." },
  { q: "What formats do you deliver?", a: "Standard delivery is PDF. We also provide DOCX and fillable PDF on request." },
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
          packages={PACKAGES}
          addOns={ADDONS}
          faq={FAQ}
          consentItems={[{ id: "upl", label: "I understand this is a clerical service and does not constitute legal advice.", required: true }]}
        />
      </UPLGuard>
    </div>
  );
}
