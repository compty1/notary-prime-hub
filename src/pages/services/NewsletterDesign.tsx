import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "frequency", label: "Newsletter Frequency", type: "select", required: true, options: [
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "one-time", label: "One-time design" },
  ]},
  { name: "audience", label: "Target Audience", type: "text", required: true, placeholder: "e.g. existing clients, prospects" },
  { name: "content_topics", label: "Content Topics", type: "textarea", required: true, placeholder: "What should the newsletter cover?" },
  { name: "brand_guidelines", label: "Brand Assets", type: "file", description: "Upload logo, colors, or existing newsletter examples" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

export default function NewsletterDesign() {
  usePageMeta({ title: "Newsletter Design" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="newsletter-design"
        serviceTitle="Newsletter Design & Content"
        serviceDescription="Custom newsletter templates and content creation for email marketing campaigns."
        fields={FIELDS}
        estimatedPrice="From $149.00/issue"
      />
    </div>
  );
}
