import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "entity_type", label: "Entity Type", type: "select", required: true, options: [
    { value: "llc", label: "LLC" },
    { value: "corporation", label: "Corporation (C-Corp or S-Corp)" },
    { value: "dba", label: "DBA / Trade Name" },
    { value: "nonprofit", label: "Non-Profit Corporation" },
    { value: "partnership", label: "Partnership (LP, LLP)" },
  ]},
  { name: "business_name", label: "Desired Business Name", type: "text", required: true, placeholder: "We'll check availability with Ohio SOS" },
  { name: "alt_names", label: "Alternative Names (if first choice unavailable)", type: "text" },
  { name: "state", label: "State of Formation", type: "text", required: true, placeholder: "Ohio" },
  { name: "member_count", label: "Number of Members/Owners", type: "number", placeholder: "1" },
  { name: "registered_agent", label: "Need Registered Agent Service?", type: "switch", placeholder: "Yes, include registered agent ($149/yr)" },
  { name: "ein_needed", label: "Need EIN from IRS?", type: "switch", placeholder: "Yes, apply for EIN ($0 — included)" },
  { name: "files", label: "Upload Supporting Documents", type: "file", description: "Operating agreement drafts, partnership agreements, etc." },
  { name: "notes", label: "Additional Details", type: "textarea" },
];

const PACKAGES = [
  { id: "basic", name: "Basic Formation", price: "$149.00", description: "Standard filing with Ohio SOS", features: ["Name availability check", "Articles of organization/incorporation", "Filing with Ohio SOS", "Digital copies of filed documents"] },
  { id: "standard", name: "Standard Package", price: "$299.00", description: "Formation + essential add-ons", features: ["All Basic features", "EIN application", "Operating agreement template", "Banking resolution", "First year registered agent"], popular: true },
  { id: "premium", name: "Premium Package", price: "$499.00", description: "Complete business launch package", features: ["All Standard features", "Custom operating agreement", "Business license research", "Compliance calendar setup", "Priority processing"] },
];

const ADD_ONS = [
  { id: "agent", label: "Registered Agent Service", price: "+$149.00/yr", description: "We serve as your Ohio registered agent" },
  { id: "compliance", label: "Annual Compliance Package", price: "+$99.00/yr", description: "Annual report filing and compliance reminders" },
  { id: "rush", label: "Expedited Filing", price: "+$100.00", description: "24-hour processing with Ohio SOS" },
];

const FAQ = [
  { q: "How long does Ohio LLC formation take?", a: "Standard processing takes 3–5 business days. Expedited (24-hour) processing is available for an additional fee." },
  { q: "Do I need a registered agent?", a: "Yes — Ohio law requires every LLC and corporation to maintain a registered agent with a physical Ohio address." },
  { q: "What's the difference between LLC and Corporation?", a: "LLCs offer flexibility in management and pass-through taxation. Corporations have a formal structure with shareholders and can issue stock." },
  { q: "Do you help with EIN applications?", a: "Yes — EIN application with the IRS is included at no extra cost with Standard and Premium packages." },
];

const CHECKLIST = [
  { label: "Desired business name(s)", required: true, description: "Primary and 1–2 alternatives" },
  { label: "Names and addresses of all members/officers", required: true },
  { label: "Business purpose description", required: true },
  { label: "Registered agent selection", required: true },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Name Search", description: "Verify name availability with Ohio SOS" },
    { step: 2, label: "Document Preparation", description: "Prepare articles and formation documents" },
    { step: 3, label: "Filing", description: "Submit to Ohio Secretary of State" },
    { step: 4, label: "Delivery", description: "Receive filed documents and formation package" },
  ],
  turnaround: "5–7 business days (rush available)",
};

export default function BusinessFormationService() {
  usePageMeta({ title: "Business Formation" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Business Formation"><div /></UPLGuard>
      <ServiceIntakeForm
        serviceSlug="business-formation"
        serviceTitle="Ohio Business Formation"
        serviceDescription="LLC, Corporation, DBA, and Non-Profit formation with Ohio Secretary of State."
        fields={FIELDS}
        estimatedPrice="From $149.00"
        packages={PACKAGES}
        addOns={ADD_ONS}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
