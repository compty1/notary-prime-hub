/**
 * Sprint 3: Document Cleanup & Formatting intake
 */
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
      />
    </div>
  );
}
