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
      />
    </div>
  );
}
