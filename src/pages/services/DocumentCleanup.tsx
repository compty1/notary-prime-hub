import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "service_type", label: "Service Needed", type: "select", required: true, options: [
    { value: "formatting", label: "Document Formatting" },
    { value: "cleanup", label: "Document Cleanup" },
    { value: "conversion", label: "Format Conversion" },
    { value: "template", label: "Template Creation" },
  ]},
  { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Describe what needs to be done..." },
  { name: "page_count", label: "Page Count", type: "number" },
  { name: "output_format", label: "Output Format", type: "select", options: [
    { value: "pdf", label: "PDF" }, { value: "docx", label: "Word (.docx)" }, { value: "both", label: "Both" },
  ]},
  { name: "files", label: "Upload Documents", type: "file" },
];

const PACKAGES = [
  { id: "basic", name: "Basic Cleanup", price: "$15", description: "Simple formatting fixes", features: ["Fix formatting issues", "Standardize fonts/spacing", "PDF output", "1 revision"] },
  { id: "professional", name: "Professional", price: "$35", description: "Full cleanup + formatting", features: ["Complete reformatting", "Header/footer setup", "Table of contents", "PDF + DOCX", "2 revisions"], recommended: true },
  { id: "template", name: "Template Creation", price: "$75", description: "Reusable branded template", features: ["Custom template design", "Brand colors/logo", "Fillable fields", "All formats", "Usage instructions"] },
];

const FAQ = [
  { question: "What counts as 'document cleanup'?", answer: "Fixing formatting inconsistencies, standardizing fonts, correcting spacing, removing artifacts, and ensuring professional presentation." },
  { question: "Can you convert between formats?", answer: "Yes — we handle PDF to Word, Word to PDF, Excel to PDF, and many other conversions while preserving formatting." },
  { question: "Do you work with scanned documents?", answer: "Yes, we can apply OCR to scanned documents and reformat the extracted text into professional layouts." },
];

export default function DocumentCleanup() {
  usePageMeta({ title: "Document Cleanup & Formatting" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="document-cleanup"
        serviceTitle="Document Cleanup & Formatting"
        serviceDescription="Professional document cleanup, formatting, and conversion services."
        fields={FIELDS}
        estimatedPrice="From $15.00"
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
