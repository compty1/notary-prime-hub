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

const PACKAGES = [
  { id: "standard", name: "Standard", price: "$30/page", description: "5-7 business days", features: ["Professional translator", "Proofread", "PDF delivery", "1 revision"] },
  { id: "certified", name: "Certified", price: "$45/page", description: "3-5 business days", features: ["ATA-certified translator", "Certificate of accuracy", "Notarization available", "2 revisions"], recommended: true },
  { id: "rush", name: "Rush Certified", price: "$75/page", description: "24-48 hours", features: ["Priority assignment", "ATA-certified", "Certificate of accuracy", "Express delivery", "Unlimited revisions"] },
];

const ADDONS = [
  { id: "notarize", name: "Notarization", price: "$25", description: "Notarize the translation certificate" },
  { id: "apostille", name: "Apostille", price: "$50", description: "State apostille for international use" },
  { id: "extra-copy", name: "Extra Certified Copy", price: "$15", description: "Additional certified copy of the translation" },
];

const FAQ = [
  { q: "What's the difference between standard and certified translation?", a: "Certified translations include a signed certificate of accuracy from the translator, required for legal, immigration, and academic purposes." },
  { q: "Do you support rare languages?", a: "Yes, we have access to translators for 100+ languages. Contact us for availability on rare language pairs." },
  { q: "Can translations be notarized?", a: "Yes, we offer notarization of translation certificates as an add-on service." },
  { q: "Will USCIS accept your translations?", a: "Yes, our certified translations meet USCIS requirements for immigration petitions." },
];

const TIMELINE = {
  steps: [
    { title: "Document Upload", description: "Submit your documents for translation" },
    { title: "Translator Assignment", description: "Matched with a qualified translator for your language pair" },
    { title: "Translation", description: "Professional translation with quality checks" },
    { title: "Review & Certification", description: "Proofreading and certificate of accuracy preparation" },
    { title: "Delivery", description: "Digital delivery with optional hard copy mailing" },
  ],
  turnaround: "3-7 business days",
};

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
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
