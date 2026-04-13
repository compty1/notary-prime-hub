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

export default function WebsiteContentUpdates() {
  usePageMeta({ title: "Website Content Updates" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="website-content-updates"
        serviceTitle="Website Content Updates"
        serviceDescription="Professional website content management — text updates, image swaps, new pages, and layout modifications."
        fields={FIELDS}
        estimatedPrice="From $50.00/update"
      />
    </div>
  );
}
