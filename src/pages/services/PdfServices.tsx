/**
 * Sprint 3: PDF Services intake (6 tools)
 */
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
      />
    </div>
  );
}
