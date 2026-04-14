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

const PACKAGES = [
  { id: "starter", name: "Starter", price: "$199/mo", description: "4 posts/month", features: ["4 posts/month", "1 platform", "Stock graphics", "Caption writing", "Hashtag research"] },
  { id: "growth", name: "Growth", price: "$399/mo", description: "12 posts/month", features: ["12 posts/month", "Up to 3 platforms", "Custom graphics", "Content calendar", "Engagement monitoring", "Monthly analytics"], recommended: true },
  { id: "premium", name: "Premium", price: "$799/mo", description: "20+ posts/month", features: ["20+ posts/month", "All platforms", "Video content", "Story/Reel creation", "Community management", "Ad creative", "Weekly analytics", "Strategy calls"] },
];

const ADDONS = [
  { id: "video", name: "Video Content", price: "$50/video", description: "Short-form video for Reels/TikTok" },
  { id: "ads", name: "Ad Creative", price: "$75/set", description: "5 ad variations for paid campaigns" },
  { id: "strategy", name: "Strategy Session", price: "$150", description: "1-hour social media strategy consultation" },
];

const FAQ = [
  { question: "Do you post directly to our accounts?", answer: "Yes, with your authorization we schedule and publish directly. You can also approve posts before they go live." },
  { question: "Can you match our brand voice?", answer: "Yes, we create a brand voice guide during onboarding and tailor all content to match your style." },
  { question: "Do you handle comments and messages?", answer: "Community management (responding to comments/messages) is included in the Premium plan." },
  { question: "What industries do you specialize in?", answer: "We specialize in notary, legal services, real estate, and professional services content." },
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
        estimatedPrice="From $199/month"
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
      />
    </div>
  );
}
