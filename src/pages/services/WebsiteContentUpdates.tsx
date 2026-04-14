import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "website_url", label: "Website URL", type: "text", required: true },
  { name: "platform", label: "Website Platform", type: "select", options: [
    { value: "wordpress", label: "WordPress" },
    { value: "squarespace", label: "Squarespace" },
    { value: "wix", label: "Wix" },
    { value: "shopify", label: "Shopify" },
    { value: "custom", label: "Custom / Other" },
  ]},
  { name: "update_type", label: "Update Type", type: "select", required: true, options: [
    { value: "text", label: "Text / Copy Updates" },
    { value: "images", label: "Image Updates" },
    { value: "pages", label: "New Pages" },
    { value: "layout", label: "Layout Changes" },
    { value: "mixed", label: "Multiple Types" },
  ]},
  { name: "description", label: "Describe Updates Needed", type: "textarea", required: true },
  { name: "source_documents", label: "Upload Assets", type: "file" },
  { name: "deadline", label: "Deadline", type: "date" },
];

const PACKAGES = [
  { id: "single", name: "Single Update", price: "$50", description: "One content change", features: ["1 page update", "Text or image swap", "Same-day turnaround", "1 revision"] },
  { id: "bundle", name: "Update Bundle", price: "$149", description: "5 content updates", features: ["5 page updates", "Mixed update types", "24-hour turnaround", "2 revisions per update"], recommended: true },
  { id: "monthly", name: "Monthly Retainer", price: "$299/mo", description: "Ongoing content management", features: ["Up to 20 updates/month", "All update types", "Priority turnaround", "Unlimited revisions", "SEO optimization", "Monthly site health check"] },
];

const FAQ = [
  { q: "What CMS platforms do you support?", a: "We work with WordPress, Squarespace, Wix, Shopify, Webflow, and most custom-built websites." },
  { q: "How quickly can updates be made?", a: "Single updates are typically completed same-day. Complex layout changes may take 2-3 business days." },
  { q: "Do you need my login credentials?", a: "We use secure credential sharing. For WordPress sites, we can use a temporary admin account." },
  { q: "Can you optimize content for SEO?", a: "Yes, our Monthly Retainer includes SEO optimization for all content updates." },
];

export default function WebsiteContentUpdates() {
  usePageMeta({ title: "Website Content Updates" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="website-content-updates"
        serviceTitle="Website Content Updates"
        serviceDescription="Professional website content management — text updates, image swaps, new pages, and layout modifications."
        fields={FIELDS}
        estimatedPrice="From $50/update"
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
