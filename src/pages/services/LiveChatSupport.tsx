import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "business_name", label: "Business Name", type: "text", required: true },
  { name: "website_url", label: "Website URL", type: "text", required: true },
  { name: "coverage_hours", label: "Coverage Hours", type: "select", required: true, options: [
    { value: "business", label: "Business Hours (9-5 EST)" },
    { value: "extended", label: "Extended (8am-10pm EST)" },
    { value: "24-7", label: "24/7 Coverage" },
  ]},
  { name: "chat_volume", label: "Expected Chat Volume", type: "select", options: [
    { value: "under-50", label: "Under 50/month" },
    { value: "50-200", label: "50-200/month" },
    { value: "200+", label: "200+/month" },
  ]},
  { name: "scope", label: "Chat Scope", type: "textarea", required: true, placeholder: "What topics should agents handle?" },
];

const PACKAGES = [
  { id: "basic", name: "Basic", price: "$299/mo", description: "Business hours coverage", features: ["9-5 EST coverage", "Up to 50 chats/month", "Pre-built responses", "Monthly reporting"] },
  { id: "professional", name: "Professional", price: "$699/mo", description: "Extended hours", features: ["8am-10pm EST", "Up to 200 chats/month", "Custom scripts", "CRM integration", "Weekly reporting", "Lead capture"], recommended: true },
  { id: "enterprise", name: "Enterprise", price: "$1,499/mo", description: "24/7 coverage", features: ["24/7 coverage", "Unlimited chats", "Multi-language support", "Custom integrations", "Real-time dashboard", "Dedicated team", "Escalation protocols"] },
];

const FAQ = [
  { question: "How do agents learn about my business?", answer: "We conduct a comprehensive onboarding including business overview, FAQs, product/service details, and common customer scenarios." },
  { question: "Can agents process orders or bookings?", answer: "Yes, Professional and Enterprise plans include integration with your booking/ordering systems." },
  { question: "What chat platforms do you support?", answer: "We support Intercom, Drift, LiveChat, Zendesk, and custom chat widgets." },
  { question: "How quickly do agents respond?", answer: "Average first response time is under 30 seconds during coverage hours." },
];

export default function LiveChatSupport() {
  usePageMeta({ title: "Live Chat Support" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="live-chat-support"
        serviceTitle="Live Chat Support"
        serviceDescription="Real-time live chat support agents for your website, trained on your business processes."
        fields={FIELDS}
        estimatedPrice="From $299/month"
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
