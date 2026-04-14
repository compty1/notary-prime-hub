import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "industry", label: "Industry / Market", type: "text", required: true },
  { name: "research_scope", label: "Research Scope", type: "select", required: true, options: [
    { value: "competitor", label: "Competitor Analysis" },
    { value: "market-size", label: "Market Size & Trends" },
    { value: "customer", label: "Customer Research" },
    { value: "comprehensive", label: "Comprehensive Report" },
  ]},
  { name: "geography", label: "Geographic Focus", type: "text", placeholder: "e.g. Central Ohio, Nationwide" },
  { name: "deadline", label: "Deadline", type: "date" },
  { name: "notes", label: "Specific Questions to Answer", type: "textarea" },
];

const PACKAGES = [
  { id: "snapshot", name: "Market Snapshot", price: "$299.00", description: "Quick overview of market landscape", features: ["5-page executive summary", "Top 5 competitor profiles", "Market size estimate", "Key trends identified", "Delivered in 5 business days"] },
  { id: "standard", name: "Standard Report", price: "$599.00", description: "Detailed market analysis", features: ["15–20 page report", "10+ competitor analysis", "SWOT analysis", "Customer segments", "Opportunity identification"], popular: true },
  { id: "comprehensive", name: "Comprehensive Study", price: "$1,299.00", description: "Full market intelligence package", features: ["30+ page report", "Complete competitive landscape", "Customer surveys (50+)", "Financial analysis", "Strategic recommendations", "Presentation deck included"] },
];

const FAQ = [
  { q: "What sources do you use?", a: "We use a combination of industry databases, public filings, trade publications, social media analysis, web scraping, and primary research (interviews/surveys for comprehensive packages)." },
  { q: "Can you focus on a specific competitor?", a: "Yes — our competitor analysis packages can deep-dive into specific companies including their pricing, marketing strategies, online presence, and customer reviews." },
  { q: "Do you provide ongoing market monitoring?", a: "Yes, we offer monthly market monitoring subscriptions that track competitor changes, industry news, and market shifts. Contact us for pricing." },
  { q: "How is the report delivered?", a: "Reports are delivered as professional PDF documents with charts and visualizations. Comprehensive packages include an editable presentation deck." },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Scope Definition", description: "Define research questions and market focus" },
    { step: 2, label: "Data Collection", description: "Gather data from multiple sources" },
    { step: 3, label: "Analysis", description: "Analyze findings and identify insights" },
    { step: 4, label: "Report Delivery", description: "Professional report with actionable recommendations" },
  ],
  turnaround: "5–14 business days depending on scope",
};

export default function MarketResearch() {
  usePageMeta({ title: "Market Research" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="market-research-report"
        serviceTitle="Market Research Report"
        serviceDescription="Custom market research and competitive analysis to inform your business strategy."
        fields={FIELDS}
        estimatedPrice="From $299.00"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
