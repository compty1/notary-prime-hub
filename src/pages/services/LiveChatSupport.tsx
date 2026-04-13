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

export default function LiveChatSupport() {
  usePageMeta({ title: "Live Chat Support" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="live-chat-support"
        serviceTitle="Live Chat Support"
        serviceDescription="Real-time live chat support agents for your website, trained on your business processes."
        fields={FIELDS}
        estimatedPrice="From $699.00/month"
      />
    </div>
  );
}
