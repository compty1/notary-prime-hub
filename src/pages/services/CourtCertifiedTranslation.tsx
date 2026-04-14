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

const PACKAGES = [
  { id: "standard", name: "Standard", price: "$65/page", description: "5-7 business day delivery", features: ["Sworn translator affidavit", "Court-accepted format", "Certificate of accuracy", "PDF + hard copy"] },
  { id: "expedited", name: "Expedited", price: "$95/page", description: "2-3 business days", features: ["Priority translator assignment", "Sworn affidavit", "Court formatting", "Express delivery"], recommended: true },
  { id: "rush", name: "Rush", price: "$130/page", description: "24-hour turnaround", features: ["Same-day start", "Sworn affidavit", "Court formatting", "Overnight delivery", "Direct translator contact"] },
];

const ADDONS = [
  { id: "notarize", label: "Notarized Translation", price: "$25", description: "Add notarization to the translator's affidavit" },
  { id: "extra-copies", label: "Extra Certified Copies", price: "$10/set", description: "Additional copies for filing" },
  { id: "apostille", label: "Apostille", price: "$50", description: "State apostille for international use" },
];

const FAQ = [
  { q: "What makes a translation 'court-certified'?", a: "It includes a sworn affidavit from the translator attesting to accuracy, formatted per court requirements." },
  { q: "Will Ohio courts accept your translations?", a: "Yes, our translations meet Ohio Rules of Evidence requirements and are accepted by all Ohio courts." },
  { q: "Can you translate from any language?", a: "We support 50+ languages including Spanish, Mandarin, Arabic, French, Portuguese, Korean, Japanese, and more." },
  { q: "What if I have a tight court deadline?", a: "Our rush service provides 24-hour turnaround. Contact us directly for same-day emergencies." },
];

const CHECKLIST = [
  { label: "Original document or clear scan/photo", required: true },
  { label: "Court name and case number", required: true },
  { label: "Court filing deadline", required: true },
  { label: "Any specific formatting requirements from the court" },
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
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
        checklist={CHECKLIST}
        consentItems={[{ id: "court", label: "I understand that court-certified translations include a sworn affidavit from the translator.", required: true }]}
      />
    </div>
  );
}
