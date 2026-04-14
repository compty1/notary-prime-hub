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

const PACKAGES = [
  { id: "standard", name: "Standard", price: "$30/page", description: "5-7 business days", features: ["Professional translator", "Proofread output", "PDF delivery", "1 revision round"] },
  { id: "express", name: "Express", price: "$50/page", description: "2-3 business days", features: ["Senior translator", "Quality assurance", "PDF + DOCX", "2 revision rounds"], recommended: true },
  { id: "rush", name: "Rush", price: "$75/page", description: "24-hour turnaround", features: ["Priority assignment", "Dual QA review", "All formats", "Unlimited revisions", "Direct translator contact"] },
];

const ADDONS = [
  { id: "certification", name: "Add Certification", price: "$25", description: "Translator certificate of accuracy" },
  { id: "notarize", name: "Add Notarization", price: "$25", description: "Notarize the translation certificate" },
  { id: "layout", name: "Layout Matching", price: "$15/page", description: "Match original document layout exactly" },
];

const FAQ = [
  { question: "What's the difference between standard and certified translation?", answer: "Standard translation is for personal use. Certified includes a signed accuracy certificate required for legal/official submissions." },
  { question: "How do you calculate page count?", answer: "We count 250 words as one standard page. Partially filled pages count as full pages." },
  { question: "What languages do you support?", answer: "We support 100+ languages including Spanish, French, Mandarin, Arabic, Portuguese, German, Japanese, Korean, and more." },
  { question: "Can I request a specific translator?", answer: "Yes, for ongoing projects you can request the same translator for consistency." },
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
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
      />
    </div>
  );
}
