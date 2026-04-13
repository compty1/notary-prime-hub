/**
 * Sprint 3: Document Scanning & Digitization
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "scan_type", label: "Scan Type", type: "select", required: true, options: [
    { value: "standard", label: "Standard Scan (300 DPI)" },
    { value: "high_res", label: "High Resolution (600 DPI)" },
    { value: "archival", label: "Archival Quality (1200 DPI)" },
  ]},
  { name: "page_count", label: "Estimated Page Count", type: "number", required: true },
  { name: "ocr_needed", label: "OCR Text Recognition", type: "switch", placeholder: "Enable searchable text" },
  { name: "output_format", label: "Output Format", type: "select", options: [
    { value: "pdf", label: "PDF" }, { value: "tiff", label: "TIFF" }, { value: "jpg", label: "JPEG" },
  ]},
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

export default function DocumentScanning() {
  usePageMeta({ title: "Document Scanning & Digitization" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="document-scanning"
        serviceTitle="Document Scanning & Digitization"
        serviceDescription="Professional document scanning with optional OCR text recognition."
        fields={FIELDS}
        estimatedPrice="From $0.50/page"
      />
    </div>
  );
}
