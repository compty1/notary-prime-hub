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

const PACKAGES = [
  { id: "basic", name: "Basic Entry", price: "$20/hr", description: "Standard accuracy data entry", features: ["99% accuracy", "Standard turnaround", "Excel/CSV output", "Email delivery"] },
  { id: "professional", name: "Professional", price: "$30/hr", description: "High-accuracy with QA", features: ["99.5% accuracy", "Quality assurance check", "Multiple output formats", "Progress updates"], recommended: true },
  { id: "critical", name: "Critical Accuracy", price: "$45/hr", description: "Double-entry verification", features: ["99.9% accuracy", "Double-entry method", "Supervisor QA", "Same-day delivery available", "Encrypted handling"] },
];

const FAQ = [
  { q: "What types of data can you process?", a: "We handle handwritten forms, printed documents, PDFs, spreadsheets, database records, and scanned images." },
  { q: "How do you ensure data accuracy?", a: "We use multi-tier QA processes. Critical accuracy projects use double-entry verification where two operators independently enter data." },
  { q: "Is my data secure?", a: "Yes, all data is handled under NDA with encrypted transmission and secure deletion after project completion." },
  { q: "What output formats do you support?", a: "We deliver in Excel, CSV, JSON, SQL, or directly into your database/CRM system." },
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
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
