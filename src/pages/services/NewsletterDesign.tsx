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

const PACKAGES = [
  { id: "template", name: "Template Design", price: "$149.00", description: "One-time custom template", features: ["Custom HTML email template", "Mobile responsive", "Brand-matched design", "2 revision rounds"] },
  { id: "monthly", name: "Monthly Content", price: "$349.00/mo", description: "Template + monthly content creation", features: ["Custom template included", "Monthly content writing", "Image sourcing", "Email platform setup", "Performance tracking"], popular: true },
  { id: "full", name: "Full Service", price: "$599.00/mo", description: "Complete email marketing management", features: ["All Monthly features", "A/B testing", "List segmentation", "Automated sequences", "Monthly analytics report"] },
];

const FAQ = [
  { q: "Which email platforms do you support?", a: "We create templates compatible with Mailchimp, Constant Contact, HubSpot, SendGrid, and most major email marketing platforms." },
  { q: "Can you write the content too?", a: "Yes! Our Monthly and Full Service packages include professional content writing tailored to your brand voice and audience." },
  { q: "Do you handle the subscriber list?", a: "With the Full Service package, yes. We manage list growth, segmentation, and cleanup to maximize deliverability." },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Brand Discovery", description: "Review your brand guidelines and goals" },
    { step: 2, label: "Template Design", description: "Create custom email template" },
    { step: 3, label: "Content Creation", description: "Write and design newsletter content" },
    { step: 4, label: "Review & Send", description: "Your approval, then we schedule and send" },
  ],
  turnaround: "5–7 business days for initial template",
};

export default function NewsletterDesign() {
  usePageMeta({ title: "Newsletter Design" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="newsletter-design"
        serviceTitle="Newsletter Design & Content"
        serviceDescription="Custom newsletter templates and content creation for email marketing campaigns."
        fields={FIELDS}
        estimatedPrice="From $149.00"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
