/**
 * Sprint 3: Document Printing intake
 */
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
      />
    </div>
  );
}
