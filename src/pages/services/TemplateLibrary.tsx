import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "template_category", label: "Template Category", type: "select", required: true, options: [
    { value: "legal", label: "Legal Documents" },
    { value: "real-estate", label: "Real Estate" },
    { value: "business", label: "Business Formation" },
    { value: "personal", label: "Personal / Family" },
    { value: "notary", label: "Notary Forms" },
  ]},
  { name: "specific_need", label: "What do you need?", type: "textarea", required: true, placeholder: "Describe the template or document type you're looking for..." },
  { name: "format", label: "Preferred Format", type: "select", options: [
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "Word (DOCX)" },
    { value: "both", label: "Both" },
  ]},
];

export default function TemplateLibrary() {
  usePageMeta({ title: "Template Library" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="template-library"
        serviceTitle="Document Template Library"
        serviceDescription="Access our curated library of professionally drafted document templates for legal, business, and personal use."
        fields={FIELDS}
        estimatedPrice="From $9.99/template"
      />
    </div>
  );
}
