import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "business_name", label: "Business Name", type: "text", required: true },
  { name: "estimated_volume", label: "Estimated Monthly Volume", type: "select", required: true, options: [
    { value: "1-10", label: "1-10 notarizations" },
    { value: "11-50", label: "11-50 notarizations" },
    { value: "51-100", label: "51-100 notarizations" },
    { value: "100+", label: "100+ notarizations" },
  ]},
  { name: "service_types", label: "Primary Services Needed", type: "textarea", required: true, placeholder: "e.g. RON, document prep, apostille..." },
  { name: "contact_name", label: "Primary Contact Name", type: "text", required: true },
  { name: "contact_email", label: "Contact Email", type: "text", required: true },
  { name: "contact_phone", label: "Contact Phone", type: "text" },
  { name: "notes", label: "Additional Requirements", type: "textarea" },
];

const PACKAGES = [
  { id: "starter", name: "Starter Plan", price: "$149/mo", description: "Up to 10 notarizations/month", features: ["10 included notarizations", "RON & in-person", "Priority scheduling", "Monthly reporting"] },
  { id: "professional", name: "Professional", price: "$399/mo", description: "Up to 50 notarizations/month", features: ["50 included notarizations", "All service types", "Dedicated account rep", "API access", "Bulk document prep"], recommended: true },
  { id: "enterprise", name: "Enterprise", price: "$999/mo", description: "Unlimited notarizations", features: ["Unlimited notarizations", "White-label option", "Custom SLA", "On-site notary available", "24/7 support", "Custom integrations"] },
];

const FAQ = [
  { q: "Can I change plans mid-cycle?", a: "Yes, you can upgrade at any time. Downgrades take effect at the next billing cycle." },
  { q: "What happens if I exceed my plan limits?", a: "Additional notarizations are billed at a discounted per-use rate. You'll receive alerts at 80% and 100% usage." },
  { q: "Is there a contract commitment?", a: "Monthly plans have no commitment. Annual plans offer a 15% discount with a 12-month term." },
  { q: "Can multiple team members use one subscription?", a: "Yes, Professional and Enterprise plans support unlimited team members with role-based access." },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Plan Selection", description: "Choose the subscription tier that fits your volume" },
    { step: 2, label: "Account Setup", description: "We configure your business account and team access" },
    { step: 3, label: "Onboarding Call", description: "30-minute call to set up workflows and preferences" },
    { step: 4, label: "Go Live", description: "Start scheduling and using services immediately" },
  ],
  turnaround: "Same-day activation",
};

export default function BusinessSubscriptions() {
  usePageMeta({ title: "Business Subscriptions" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="business-subscriptions"
        serviceTitle="Business Subscription Plans"
        serviceDescription="Volume-based subscription plans for businesses needing recurring notarization and document services."
        fields={FIELDS}
        estimatedPrice="From $149/month"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
