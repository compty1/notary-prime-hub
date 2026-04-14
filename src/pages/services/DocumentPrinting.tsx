import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "print_type", label: "Print Type", type: "select", required: true, options: [
    { value: "bw", label: "Black & White ($0.25/page)" },
    { value: "color", label: "Color ($0.75/page)" },
    { value: "large_format", label: "Large Format" },
  ]},
  { name: "page_count", label: "Page Count", type: "number", required: true },
  { name: "copies", label: "Number of Copies", type: "number", required: true },
  { name: "binding", label: "Binding", type: "select", options: [
    { value: "none", label: "None" }, { value: "staple", label: "Stapled" },
    { value: "spiral", label: "Spiral Bound" }, { value: "comb", label: "Comb Bound" },
  ]},
  { name: "paper_size", label: "Paper Size", type: "select", options: [
    { value: "letter", label: "Letter (8.5x11)" }, { value: "legal", label: "Legal (8.5x14)" },
    { value: "tabloid", label: "Tabloid (11x17)" },
  ]},
  { name: "double_sided", label: "Double-Sided", type: "switch", placeholder: "Print on both sides" },
  { name: "collation_needed", label: "Collation Needed", type: "switch", placeholder: "Collate multi-page sets" },
  { name: "files", label: "Upload Documents", type: "file", required: true },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

const ADDONS = [
  { id: "binding-spiral", name: "Spiral Binding", price: "$5/set", description: "Professional spiral binding" },
  { id: "lamination", name: "Lamination", price: "$3/page", description: "Protective lamination for important pages" },
  { id: "tabs", name: "Tab Dividers", price: "$2/set", description: "Labeled tab dividers between sections" },
  { id: "covers", name: "Card Stock Covers", price: "$3/set", description: "Heavy card stock front and back covers" },
];

const FAQ = [
  { q: "What's the $10 prep fee?", a: "The prep fee covers file review, print optimization, and quality setup. It applies once per order regardless of page count." },
  { q: "Can you print on legal-size paper?", a: "Yes, we support Letter (8.5x11), Legal (8.5x14), and Tabloid (11x17) paper sizes." },
  { q: "Do you offer same-day printing?", a: "Yes, orders placed before 2 PM EST are available for same-day pickup or shipping." },
  { q: "What file formats do you accept?", a: "We accept PDF, DOCX, XLSX, PPTX, and most common image formats." },
];

export default function DocumentPrinting() {
  usePageMeta({ title: "Document Printing & Prep" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="document-printing"
        serviceTitle="Document Printing & Preparation"
        serviceDescription="Professional printing with prep fee ($10) + per-page rates. Collation and binding available."
        fields={FIELDS}
        estimatedPrice="$10 prep + per-page"
        addOns={ADDONS}
        faq={FAQ}
      />
    </div>
  );
}
