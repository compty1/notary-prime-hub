import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "company_name", label: "Company Name", type: "text", required: true },
  { name: "use_case", label: "Integration Use Case", type: "textarea", required: true, placeholder: "Describe how you'd like to integrate our services..." },
  { name: "volume", label: "Expected Monthly API Calls", type: "select", required: true, options: [
    { value: "under-100", label: "Under 100" },
    { value: "100-1000", label: "100-1,000" },
    { value: "1000-10000", label: "1,000-10,000" },
    { value: "10000+", label: "10,000+" },
  ]},
  { name: "technical_contact", label: "Technical Contact Email", type: "text", required: true },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

const PACKAGES = [
  { id: "starter", name: "Starter", price: "$99/mo", description: "Up to 100 API calls/month, basic endpoints", features: ["Notarization status API", "Document upload", "Email support"] },
  { id: "business", name: "Business", price: "$499/mo", description: "Up to 5,000 calls/month, full API access", features: ["All endpoints", "Webhook notifications", "Priority support", "Sandbox environment"], recommended: true },
  { id: "enterprise", name: "Enterprise", price: "Custom", description: "Unlimited calls, dedicated infrastructure", features: ["Custom endpoints", "SLA guarantee", "Dedicated account manager", "On-premise option"] },
];

const FAQ = [
  { q: "What API formats do you support?", a: "Our REST API supports JSON request/response format with OAuth 2.0 authentication." },
  { q: "Is there a sandbox environment?", a: "Yes, Business and Enterprise plans include a full sandbox environment for testing." },
  { q: "What's the typical integration timeline?", a: "Most integrations are completed within 1-2 weeks with our documentation and support." },
  { q: "Do you support webhooks?", a: "Yes, we support webhooks for real-time status updates on notarization sessions and document processing." },
];

const TIMELINE = {
  steps: [
    { title: "Application Review", description: "We review your use case and technical requirements" },
    { title: "API Key Provisioning", description: "Receive your API keys and sandbox access" },
    { title: "Integration Development", description: "Build your integration with our documentation and support" },
    { title: "Testing & Certification", description: "Test in sandbox and get certified for production" },
    { title: "Go Live", description: "Launch your integration with production API access" },
  ],
  turnaround: "1-2 weeks setup",
};

export default function ApiIntegration() {
  usePageMeta({ title: "API Integration" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="api-integration"
        serviceTitle="API Integration"
        serviceDescription="Integrate notarization and document services directly into your application via our REST API."
        fields={FIELDS}
        estimatedPrice="From $99/month"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
