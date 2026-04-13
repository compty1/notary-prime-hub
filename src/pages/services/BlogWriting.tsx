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
      />
    </div>
  );
}
