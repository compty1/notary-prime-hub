import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "data_type", label: "Type of Data", type: "select", required: true, options: [
    { value: "documents", label: "Document Digitization" },
    { value: "spreadsheets", label: "Spreadsheet Entry" },
    { value: "database", label: "Database Population" },
    { value: "forms", label: "Form Processing" },
    { value: "other", label: "Other" },
  ]},
  { name: "volume", label: "Estimated Volume", type: "text", required: true, placeholder: "e.g. 500 records, 100 pages" },
  { name: "deadline", label: "Deadline", type: "date" },
  { name: "accuracy", label: "Accuracy Requirement", type: "select", options: [
    { value: "standard", label: "Standard (99%)" },
    { value: "high", label: "High (99.5%+)" },
    { value: "critical", label: "Critical (99.9%+, double-entry)" },
  ]},
  { name: "source_documents", label: "Upload Sample / Source Files", type: "file" },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

export default function DataEntry() {
  usePageMeta({ title: "Data Entry Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="data-entry"
        serviceTitle="Data Entry Services"
        serviceDescription="Accurate, secure data entry and digitization services for documents, forms, and records."
        fields={FIELDS}
        estimatedPrice="From $20.00/hour"
      />
    </div>
  );
}
