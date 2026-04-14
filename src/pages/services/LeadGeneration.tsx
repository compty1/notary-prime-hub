import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "target_market", label: "Target Market", type: "text", required: true, placeholder: "e.g. real estate agents in Columbus, OH" },
  { name: "lead_count", label: "Desired Lead Count", type: "select", required: true, options: [
    { value: "50", label: "50 leads" },
    { value: "100", label: "100 leads" },
    { value: "250", label: "250 leads" },
    { value: "500+", label: "500+ leads" },
  ]},
  { name: "data_points", label: "Data Points Needed", type: "textarea", placeholder: "e.g. name, email, phone, company, title" },
  { name: "delivery_format", label: "Delivery Format", type: "select", options: [
    { value: "csv", label: "CSV / Excel" },
    { value: "crm", label: "Direct CRM Import" },
  ]},
  { name: "notes", label: "Additional Criteria", type: "textarea" },
];

const PACKAGES = [
  { id: "starter", name: "Starter", price: "$49", description: "50 verified leads", features: ["50 leads", "Name + email", "Industry targeting", "CSV delivery", "1 revision"] },
  { id: "professional", name: "Professional", price: "$149", description: "200 verified leads", features: ["200 leads", "Full contact info", "Company data", "Phone verification", "CRM-ready format", "2 revisions"], recommended: true },
  { id: "enterprise", name: "Enterprise", price: "$399", description: "500+ leads + enrichment", features: ["500+ leads", "Full enrichment", "Social profiles", "Decision-maker targeting", "Custom filters", "Direct CRM import", "Monthly refresh"] },
];

const ADDONS = [
  { id: "phone-verify", name: "Phone Verification", price: "$0.15/lead", description: "Verify phone numbers are active" },
  { id: "email-verify", name: "Email Verification", price: "$0.05/lead", description: "Verify email deliverability" },
  { id: "linkedin", name: "LinkedIn Profile Match", price: "$0.25/lead", description: "Match leads to LinkedIn profiles" },
];

const FAQ = [
  { question: "How are leads sourced?", answer: "We use multiple data sources including business registries, professional directories, and public records to build targeted lead lists." },
  { question: "What's the accuracy rate?", answer: "Our Professional tier achieves 95%+ email deliverability and 90%+ phone accuracy through multi-step verification." },
  { question: "Can you target specific industries?", answer: "Yes, we can target by industry, job title, company size, geography, and many other criteria." },
  { question: "Do you offer ongoing lead generation?", answer: "Yes, Enterprise plans include monthly list refreshes with new leads matching your criteria." },
];

export default function LeadGeneration() {
  usePageMeta({ title: "Lead Generation" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="lead-generation"
        serviceTitle="Lead Generation"
        serviceDescription="Targeted prospect research and lead list building for your business development needs."
        fields={FIELDS}
        estimatedPrice="From $0.50/lead"
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
      />
    </div>
  );
}
