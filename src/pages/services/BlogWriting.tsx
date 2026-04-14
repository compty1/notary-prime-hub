import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "topic", label: "Blog Topic / Title", type: "text", required: true },
  { name: "word_count", label: "Target Word Count", type: "select", required: true, options: [
    { value: "500", label: "~500 words (Short)" },
    { value: "1000", label: "~1,000 words (Standard)" },
    { value: "1500", label: "~1,500 words (Long-form)" },
    { value: "2000+", label: "2,000+ words (Deep-dive)" },
  ]},
  { name: "audience", label: "Target Audience", type: "text", placeholder: "e.g. notaries, small business owners" },
  { name: "tone", label: "Tone", type: "select", options: [
    { value: "professional", label: "Professional" },
    { value: "conversational", label: "Conversational" },
    { value: "educational", label: "Educational" },
    { value: "persuasive", label: "Persuasive" },
  ]},
  { name: "seo_keywords", label: "SEO Keywords", type: "text", placeholder: "Comma-separated keywords" },
  { name: "notes", label: "Additional Instructions", type: "textarea" },
];

const PACKAGES = [
  { id: "single", name: "Single Post", price: "$75", description: "One SEO-optimized blog post", features: ["Up to 1,000 words", "1 revision round", "SEO meta tags", "Stock image sourcing"] },
  { id: "monthly", name: "Monthly Bundle", price: "$249/mo", description: "4 posts per month", features: ["4 posts/month", "Up to 1,500 words each", "2 revision rounds", "Content calendar", "SEO keyword research"], recommended: true },
  { id: "premium", name: "Content Strategy", price: "$599/mo", description: "8 posts + strategy", features: ["8 posts/month", "Deep-dive articles", "Unlimited revisions", "Content strategy call", "Analytics reporting", "Social media snippets"] },
];

const ADDONS = [
  { id: "seo-audit", name: "SEO Keyword Research", price: "$35", description: "Deep keyword analysis for your niche" },
  { id: "social-snippets", name: "Social Media Snippets", price: "$15/post", description: "3 social posts to promote each blog" },
  { id: "featured-image", name: "Custom Featured Image", price: "$25", description: "Branded graphic designed for the post" },
];

const FAQ = [
  { q: "What industries do you write for?", a: "We specialize in legal services, notary, real estate, and small business content but can write for any industry." },
  { q: "How many revisions are included?", a: "Single posts include 1 revision round. Monthly bundles include 2 rounds. Premium plans have unlimited revisions." },
  { q: "Do you provide SEO optimization?", a: "Yes, all posts include meta titles, descriptions, header optimization, and internal linking suggestions." },
  { q: "What's the typical turnaround?", a: "Standard turnaround is 5 business days. Rush delivery (2-3 days) is available for an additional fee." },
];

const TIMELINE = {
  steps: [
    { title: "Brief & Research", description: "We gather your topic, audience, and keyword targets" },
    { title: "Outline Approval", description: "Review and approve the post outline before writing" },
    { title: "Draft Delivery", description: "Receive the first draft for review" },
    { title: "Revisions", description: "Submit feedback for final revisions" },
    { title: "Publication-Ready", description: "Final post delivered with SEO tags and images" },
  ],
  turnaround: "5 business days",
};

export default function BlogWriting() {
  usePageMeta({ title: "Blog Post Writing" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="blog-post-writing"
        serviceTitle="Blog Post Writing"
        serviceDescription="SEO-optimized blog content for your notary or business website, written by professional content writers."
        fields={FIELDS}
        estimatedPrice="From $75.00/post"
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
