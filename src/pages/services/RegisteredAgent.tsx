import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "business_name", label: "Business Name", type: "text", required: true },
  { name: "entity_type", label: "Entity Type", type: "select", required: true, options: [
    { value: "llc", label: "LLC" },
    { value: "corporation", label: "Corporation" },
    { value: "nonprofit", label: "Non-Profit" },
    { value: "other", label: "Other" },
  ]},
  { name: "state", label: "State of Registration", type: "text", required: true, placeholder: "Ohio" },
  { name: "current_agent", label: "Current Registered Agent (if any)", type: "text" },
  { name: "start_date", label: "Desired Start Date", type: "date" },
  { name: "needs_change_filing", label: "Need Agent Change Filed?", type: "switch", placeholder: "File change with Ohio SOS" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

const PACKAGES = [
  { id: "basic", name: "Basic Agent", price: "$149.00/yr", description: "Essential registered agent service", features: ["Physical Ohio address", "Mail forwarding (weekly)", "Annual report reminders", "Secure document storage"], popular: true },
  { id: "premium", name: "Premium Agent", price: "$249.00/yr", description: "Full compliance management", features: ["All Basic features", "Same-day mail scanning", "Compliance calendar", "Annual report filing included", "Dedicated account manager"] },
];

const ADD_ONS = [
  { id: "change-filing", label: "Agent Change Filing", price: "+$25.00", description: "File agent change with Ohio SOS (one-time)" },
  { id: "mail-scanning", label: "Mail Scanning Upgrade", price: "+$5.00/mo", description: "Same-day scan and email of all mail" },
  { id: "compliance", label: "Compliance Calendar", price: "+$49.00/yr", description: "Automated deadline tracking and reminders" },
];

const FAQ = [
  { q: "What does a registered agent do?", a: "A registered agent receives legal documents, tax notices, and government correspondence on behalf of your business. Ohio law requires every LLC and corporation to have a registered agent with a physical Ohio address." },
  { q: "Can I be my own registered agent?", a: "Yes, but you must have a physical Ohio address (not a PO Box), be available during business hours, and your address becomes public record. Many business owners prefer a professional agent for privacy and reliability." },
  { q: "What happens if I miss a legal notice?", a: "Missing service of process or compliance notices can result in default judgments, penalties, or administrative dissolution of your business." },
  { q: "How do I switch registered agents?", a: "We file a Change of Agent form with the Ohio Secretary of State on your behalf. The process typically takes 3–5 business days." },
];

const CHECKLIST = [
  { label: "Business legal name", required: true },
  { label: "Entity type and state of formation", required: true },
  { label: "Current registered agent info", required: false, description: "If switching from another agent" },
  { label: "Ohio SOS entity number", required: false },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Sign Up", description: "Provide business details" },
    { step: 2, label: "Agent Designation", description: "We file as your registered agent" },
    { step: 3, label: "Confirmation", description: "Change confirmed by Ohio SOS" },
    { step: 4, label: "Active Service", description: "Mail forwarding and compliance monitoring begins" },
  ],
  turnaround: "3–5 business days for initial setup",
};

export default function RegisteredAgent() {
  usePageMeta({ title: "Registered Agent Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="registered-agent"
        serviceTitle="Registered Agent Services"
        serviceDescription="Professional registered agent services for Ohio businesses. Receive and forward legal documents, state filings, and compliance notices."
        fields={FIELDS}
        estimatedPrice="From $149.00/yr"
        packages={PACKAGES}
        addOns={ADD_ONS}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
