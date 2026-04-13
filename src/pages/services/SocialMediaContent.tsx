import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "platforms", label: "Platforms", type: "textarea", required: true, placeholder: "e.g. Facebook, Instagram, LinkedIn" },
  { name: "posts_per_month", label: "Posts Per Month", type: "select", required: true, options: [
    { value: "4", label: "4 posts (1/week)" },
    { value: "8", label: "8 posts (2/week)" },
    { value: "12", label: "12 posts (3/week)" },
    { value: "20", label: "20 posts (daily weekdays)" },
  ]},
  { name: "content_type", label: "Content Types", type: "textarea", placeholder: "e.g. promotional, educational, tips, testimonials..." },
  { name: "brand_guidelines", label: "Brand Guidelines", type: "file", description: "Upload logo, color palette, or brand guide" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

export default function SocialMediaContent() {
  usePageMeta({ title: "Social Media Content" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="social-media-content"
        serviceTitle="Social Media Content Creation"
        serviceDescription="Engaging social media posts and graphics tailored to your business and audience."
        fields={FIELDS}
        estimatedPrice="From $199.00/month"
      />
    </div>
  );
}
