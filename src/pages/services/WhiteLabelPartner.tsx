import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "company_name", label: "Company Name", type: "text", required: true },
  { name: "website", label: "Website URL", type: "text" },
  { name: "industry", label: "Industry", type: "select", required: true, options: [
    { value: "legal", label: "Legal Services" },
    { value: "real-estate", label: "Real Estate" },
    { value: "finance", label: "Financial Services" },
    { value: "insurance", label: "Insurance" },
    { value: "other", label: "Other" },
  ]},
  { name: "description", label: "Partnership Goals", type: "textarea", required: true },
  { name: "volume", label: "Expected Monthly Volume", type: "text" },
  { name: "contact_name", label: "Contact Name", type: "text", required: true },
  { name: "contact_email", label: "Contact Email", type: "text", required: true },
];

const PACKAGES = [
  { id: "starter", name: "Starter Partner", price: "$299/mo", description: "Basic white-label", features: ["Your branding on documents", "Up to 25 transactions/month", "Standard API access", "Email support"] },
  { id: "professional", name: "Professional", price: "$799/mo", description: "Full white-label suite", features: ["Complete brand customization", "Up to 100 transactions/month", "Full API access", "Custom domain", "Priority support", "Co-branded portal"], recommended: true },
  { id: "enterprise", name: "Enterprise", price: "Custom", description: "Unlimited volume", features: ["Unlimited transactions", "Dedicated infrastructure", "Custom integrations", "SLA guarantee", "Dedicated account manager", "Revenue share options", "Training & onboarding"] },
];

const FAQ = [
  { q: "What services can be white-labeled?", a: "RON notarization, document preparation, apostille, translation, and all document services can be offered under your brand." },
  { q: "How does branding work?", a: "We apply your logo, colors, and domain to the client-facing experience. Communications go out under your brand." },
  { q: "What's the revenue model?", a: "You set your own pricing. We charge wholesale rates with volume discounts. Enterprise plans offer revenue share options." },
  { q: "How long does setup take?", a: "Starter plans are live in 48 hours. Professional setup takes 1-2 weeks. Enterprise customization takes 4-6 weeks." },
];

const TIMELINE = {
  steps: [
    { title: "Application", description: "Submit your partnership application for review" },
    { title: "Discovery Call", description: "Discuss your business model, volume, and customization needs" },
    { title: "Brand Setup", description: "Configure your white-label branding and portal" },
    { title: "Integration", description: "Set up API access and workflow integration" },
    { title: "Launch", description: "Go live with your branded notarization service" },
  ],
  turnaround: "1-6 weeks depending on plan",
};

export default function WhiteLabelPartner() {
  usePageMeta({ title: "White-Label Partnership" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="white-label-partner"
        serviceTitle="White-Label Partnership"
        serviceDescription="Offer notarization and document services under your brand with our white-label partnership program."
        fields={FIELDS}
        estimatedPrice="From $299/month"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
