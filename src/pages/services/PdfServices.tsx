import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "service", label: "PDF Service", type: "select", required: true, options: [
    { value: "merge", label: "Merge PDFs" },
    { value: "split", label: "Split PDF" },
    { value: "compress", label: "Compress PDF" },
    { value: "convert_to_pdf", label: "Convert to PDF" },
    { value: "convert_from_pdf", label: "Convert from PDF" },
    { value: "ocr", label: "OCR (Text Recognition)" },
  ]},
  { name: "description", label: "Instructions", type: "textarea", placeholder: "Describe what you need..." },
  { name: "files", label: "Upload Files", type: "file", required: true },
  { name: "output_format", label: "Output Format", type: "select", options: [
    { value: "pdf", label: "PDF" }, { value: "docx", label: "Word" }, { value: "xlsx", label: "Excel" }, { value: "jpg", label: "Images" },
  ]},
];

const PACKAGES = [
  { id: "single", name: "Single Task", price: "$10", description: "One PDF operation", features: ["1 operation", "Up to 50 pages", "Same-day delivery", "1 revision"] },
  { id: "bundle", name: "Task Bundle", price: "$25", description: "Up to 5 operations", features: ["5 operations", "Up to 200 pages", "Priority processing", "2 revisions"], recommended: true },
  { id: "unlimited", name: "Monthly Plan", price: "$49/mo", description: "Unlimited PDF services", features: ["Unlimited operations", "Unlimited pages", "Same-day turnaround", "All formats", "Priority queue"] },
];

const FAQ = [
  { q: "What file formats can you convert?", a: "We convert between PDF, Word, Excel, PowerPoint, images (JPG/PNG), and HTML." },
  { q: "Is there a file size limit?", a: "Single files up to 500MB. For larger files, contact us for custom handling." },
  { q: "Do you maintain document formatting?", a: "Yes, our conversion tools preserve formatting, fonts, images, and layout as closely as possible." },
  { q: "Can you add OCR to scanned PDFs?", a: "Yes, our OCR service converts scanned document images into searchable, editable text within the PDF." },
];

export default function PdfServices() {
  usePageMeta({ title: "PDF Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="pdf-services"
        serviceTitle="PDF Services"
        serviceDescription="Merge, split, compress, convert, and OCR your PDF documents."
        fields={FIELDS}
        estimatedPrice="From $10.00"
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
