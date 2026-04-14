import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "form_type", label: "Court Form Type", type: "select", required: true, options: [
    { value: "divorce", label: "Divorce / Dissolution" },
    { value: "custody", label: "Custody / Visitation" },
    { value: "child-support", label: "Child Support Modification" },
    { value: "name-change", label: "Name Change" },
    { value: "small-claims", label: "Small Claims" },
    { value: "eviction", label: "Eviction / Forcible Entry" },
    { value: "civil-complaint", label: "Civil Complaint" },
    { value: "other", label: "Other Court Form" },
  ]},
  { name: "county", label: "County", type: "text", required: true, placeholder: "e.g. Franklin, Hamilton" },
  { name: "case_number", label: "Existing Case Number (if any)", type: "text" },
  { name: "opposing_party", label: "Opposing Party Name (if applicable)", type: "text" },
  { name: "children_involved", label: "Children Involved?", type: "switch", placeholder: "Minor children are involved in this case" },
  { name: "files", label: "Upload Supporting Documents", type: "file", description: "Existing court orders, prior filings, etc." },
  { name: "notes", label: "Case Details & Special Instructions", type: "textarea", required: true },
];

const PACKAGES = [
  { id: "basic", name: "Single Form", price: "$35.00", description: "Preparation of a single court form", features: ["One court form prepared", "County-specific formatting", "Filing instructions included"] },
  { id: "package", name: "Form Package", price: "$75.00", description: "Complete package for your case type", features: ["All required forms for case type", "County-specific formatting", "Cover sheet and instructions", "Filing fee information"], popular: true },
  { id: "full", name: "Full Preparation + Filing Assist", price: "$125.00", description: "Complete prep with filing guidance", features: ["All package features", "Step-by-step filing guide", "Deadline calendar", "Process serving coordination"] },
];

const FAQ = [
  { q: "Is this legal advice?", a: "No. This is a document preparation service only, not legal advice. We do not provide legal counsel or represent clients in court." },
  { q: "Which county should I file in?", a: "Generally, you file in the county where the opposing party resides or where the incident occurred." },
  { q: "Do you file the forms for me?", a: "We prepare the forms and provide filing instructions. You can add our courier service to have them delivered to the courthouse." },
  { q: "How do I know which forms I need?", a: "Select your case type and county, and we'll identify all required forms including local forms." },
];

const CHECKLIST = [
  { label: "Case type and county", required: true },
  { label: "Names and addresses of all parties", required: true },
  { label: "Existing case number (if modifying)", required: false },
  { label: "Supporting documents", required: false },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Submit Information", description: "Provide case details and supporting docs" },
    { step: 2, label: "Form Preparation", description: "County-specific forms prepared" },
    { step: 3, label: "Review", description: "Review prepared forms for accuracy" },
    { step: 4, label: "Filing Instructions", description: "Receive forms with filing guide" },
  ],
  turnaround: "3–5 business days",
};

export default function CourtFormPreparation() {
  usePageMeta({ title: "Court Form Preparation" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceType="court-forms" />
      <ServiceIntakeForm
        serviceSlug="court-form-preparation"
        serviceTitle="Court Form Preparation"
        serviceDescription="Professional document preparation for Ohio court filings. All 88 counties supported."
        fields={FIELDS}
        estimatedPrice="From $35.00"
        packages={PACKAGES}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
