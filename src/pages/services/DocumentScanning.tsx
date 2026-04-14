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

const PACKAGES = [
  { id: "basic", name: "Basic Scan", price: "$0.50/page", description: "300 DPI standard scanning", features: ["300 DPI resolution", "PDF output", "Cloud delivery", "Basic file naming"] },
  { id: "professional", name: "Professional", price: "$1.00/page", description: "600 DPI with OCR", features: ["600 DPI resolution", "OCR text recognition", "Searchable PDF", "Custom file naming", "Organized folders"], recommended: true },
  { id: "archival", name: "Archival", price: "$2.00/page", description: "1200 DPI preservation quality", features: ["1200 DPI resolution", "TIFF + PDF formats", "OCR + metadata tagging", "Color calibration", "Long-term preservation format"] },
];

const ADDONS = [
  { id: "ocr", name: "OCR Text Recognition", price: "$0.15/page", description: "Make scanned text searchable and copyable" },
  { id: "organize", name: "File Organization", price: "$25/project", description: "Custom folder structure and naming conventions" },
  { id: "shred", name: "Secure Shredding", price: "$15/box", description: "NAID-certified shredding of originals after scanning" },
];

const FAQ = [
  { q: "What's the difference between scan resolutions?", a: "300 DPI is good for general documents. 600 DPI is ideal for detailed documents with fine print. 1200 DPI is for archival preservation." },
  { q: "What is OCR?", a: "Optical Character Recognition converts scanned images into searchable, copyable text within the PDF." },
  { q: "Can you scan bound books?", a: "Yes, we have flatbed and overhead scanners for bound materials without damaging the binding." },
  { q: "How are files delivered?", a: "Files are delivered via secure cloud link. USB drive or external hard drive delivery is available for large projects." },
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
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
      />
    </div>
  );
}
