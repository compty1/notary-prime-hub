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

const PACKAGES = [
  { id: "single", name: "Single Template", price: "$9.99", description: "One template download", features: ["1 template", "Fillable PDF", "Instructions included", "Lifetime access"] },
  { id: "category", name: "Category Pack", price: "$39.99", description: "All templates in one category", features: ["All category templates", "PDF + DOCX formats", "Update notifications", "Lifetime access"], recommended: true },
  { id: "unlimited", name: "Full Library", price: "$99.99", description: "Access to entire library", features: ["All categories", "All formats", "New templates added", "Priority requests", "Customization guide", "1-year access"] },
];

const FAQ = [
  { q: "Are templates legally reviewed?", a: "Templates are professionally drafted and reviewed for common use cases. They are not a substitute for legal advice specific to your situation." },
  { q: "Can I customize the templates?", a: "Yes, DOCX templates are fully editable. PDF templates include fillable fields. Customization services are also available." },
  { q: "Are templates state-specific?", a: "Many templates are drafted for Ohio compliance. We note state-specific requirements where applicable." },
  { q: "How often are templates updated?", a: "Templates are reviewed annually and updated when laws or regulations change. Category Pack and Full Library subscribers receive update notifications." },
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
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
