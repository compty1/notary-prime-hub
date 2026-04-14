import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "business_name", label: "Business Name", type: "text", required: true },
  { name: "support_volume", label: "Expected Ticket Volume", type: "select", required: true, options: [
    { value: "under-50", label: "Under 50/month" },
    { value: "50-200", label: "50-200/month" },
    { value: "200+", label: "200+/month" },
  ]},
  { name: "response_time", label: "Required Response Time", type: "select", options: [
    { value: "24h", label: "Within 24 hours" },
    { value: "4h", label: "Within 4 hours" },
    { value: "1h", label: "Within 1 hour" },
  ]},
  { name: "scope", label: "Support Scope", type: "textarea", required: true, placeholder: "What types of questions will customers ask?" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

const PACKAGES = [
  { id: "starter", name: "Starter", price: "$499.00/mo", description: "Up to 50 emails/month", features: ["50 emails/month", "24-hour response time", "Branded responses", "Monthly summary report"] },
  { id: "growth", name: "Growth", price: "$899.00/mo", description: "Up to 200 emails/month", features: ["200 emails/month", "4-hour response time", "Branded responses", "Template library", "Weekly reports", "Escalation protocols"], popular: true },
  { id: "enterprise", name: "Enterprise", price: "$1,499.00/mo", description: "Unlimited volume", features: ["Unlimited emails", "1-hour response time", "Dedicated agent(s)", "CRM integration", "Daily reports", "Priority escalation"] },
];

const FAQ = [
  { q: "How do you learn our products/services?", a: "We conduct a thorough onboarding process including product training, FAQ review, and a trial period where we shadow your existing support flow. Most teams are fully ramped within 1 week." },
  { q: "Can you integrate with our existing tools?", a: "Yes — we work with popular helpdesks (Zendesk, Freshdesk, HelpScout), shared inboxes (Gmail, Outlook), and CRMs (HubSpot, Salesforce)." },
  { q: "What about sensitive customer data?", a: "All agents sign NDAs and follow data handling protocols. We comply with applicable data protection requirements." },
  { q: "Can we monitor the responses?", a: "Absolutely. You have full visibility into all responses. We also provide regular reports on volume, response times, and customer satisfaction." },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Onboarding", description: "Product training and process documentation" },
    { step: 2, label: "Template Setup", description: "Create response templates and escalation rules" },
    { step: 3, label: "Trial Period", description: "Supervised handling with your approval" },
    { step: 4, label: "Go Live", description: "Full autonomous email handling begins" },
  ],
  turnaround: "Setup in 3–5 days, then ongoing",
};

export default function EmailSupport() {
  usePageMeta({ title: "Email Support" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="email-support-handling"
        serviceTitle="Email Support Handling"
        serviceDescription="Professional email customer support managed on your behalf with branded responses."
        fields={FIELDS}
        estimatedPrice="From $499.00/mo"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
