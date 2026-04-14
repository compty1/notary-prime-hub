import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "form_type", label: "Form Type", type: "select", required: true, options: [
    { value: "government", label: "Government Form" },
    { value: "court", label: "Court Form" },
    { value: "business", label: "Business Form" },
    { value: "medical", label: "Medical Form" },
    { value: "financial", label: "Financial Form" },
    { value: "other", label: "Other" },
  ]},
  { name: "form_name", label: "Form Name/Number", type: "text", required: true, placeholder: "e.g., SS-5, I-130, Ohio Probate Form 4.0" },
  { name: "description", label: "Additional Details", type: "textarea", placeholder: "Any specific instructions..." },
  { name: "deadline", label: "Deadline", type: "date" },
  { name: "files", label: "Upload Blank Form (if available)", type: "file" },
];

const PACKAGES = [
  { id: "single", name: "Single Form", price: "$20", description: "One form completed", features: ["1 form", "Accuracy review", "PDF delivery", "1 revision"] },
  { id: "bundle", name: "Form Bundle", price: "$50", description: "Up to 5 related forms", features: ["Up to 5 forms", "Cross-reference check", "Organized package", "2 revisions"], recommended: true },
  { id: "complex", name: "Complex Filing", price: "$100+", description: "Multi-page court/government filings", features: ["Unlimited pages", "Exhibit preparation", "Filing instructions", "Unlimited revisions", "Priority handling"] },
];

const ADDONS = [
  { id: "notarize", name: "Add Notarization", price: "$25", description: "Notarize the completed form" },
  { id: "copies", name: "Certified Copies", price: "$5/copy", description: "Extra certified copies for filing" },
  { id: "rush", name: "Rush (Same-Day)", price: "$20", description: "Same-day completion" },
];

const FAQ = [
  { q: "Is this legal advice?", a: "No. Form filling is a clerical service. We enter information you provide into forms — we do not advise on what information to provide." },
  { q: "What if I don't have the blank form?", a: "We maintain a library of common government and court forms. Just tell us the form name/number." },
  { q: "Can you fill out court forms?", a: "Yes, we can fill out court forms based on information you provide. We do not provide legal advice or representation." },
  { q: "How do I provide my information?", a: "You can upload a completed draft, fill out our intake questionnaire, or provide handwritten notes." },
];

export default function FormFilling() {
  usePageMeta({ title: "Form Filling Assistance" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Form Filling Assistance">
        <ServiceIntakeForm
          serviceSlug="form-filling"
          serviceTitle="Form Filling Assistance"
          serviceDescription="We help fill out forms accurately based on information you provide. This is a clerical service."
          fields={FIELDS}
          estimatedPrice="From $20.00"
          packages={PACKAGES}
          addOns={ADDONS}
          faq={FAQ}
          consentItems={[{ id: "upl", label: "I understand this is a clerical form-filling service, not legal advice.", required: true }]}
        />
      </UPLGuard>
    </div>
  );
}
