import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "destination_country", label: "Destination Country", type: "text", required: true, placeholder: "e.g., China, UAE, Saudi Arabia" },
  { name: "document_type", label: "Document Type", type: "select", required: true, options: [
    { value: "birth_certificate", label: "Birth Certificate" },
    { value: "marriage_certificate", label: "Marriage Certificate" },
    { value: "diploma", label: "Diploma/Degree" },
    { value: "power_of_attorney", label: "Power of Attorney" },
    { value: "business_document", label: "Business Document" },
    { value: "other", label: "Other" },
  ]},
  { name: "document_count", label: "Number of Documents", type: "number", required: true },
  { name: "urgency", label: "Urgency", type: "select", options: [
    { value: "standard", label: "Standard (2–4 weeks)" },
    { value: "expedited", label: "Expedited (1–2 weeks)" },
    { value: "rush", label: "Rush (3–5 days)" },
  ]},
  { name: "consulate_location", label: "Nearest Consulate", type: "text", placeholder: "e.g., Chicago, IL" },
  { name: "files", label: "Upload Documents", type: "file" },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

const PACKAGES = [
  { id: "standard", name: "Standard", price: "$75/doc", description: "2-4 week processing", features: ["Document review", "Consulate coordination", "Status updates", "Return shipping"] },
  { id: "expedited", name: "Expedited", price: "$125/doc", description: "1-2 week processing", features: ["Priority handling", "Consulate coordination", "Daily status updates", "Express shipping"], recommended: true },
  { id: "rush", name: "Rush", price: "$200/doc", description: "3-5 business days", features: ["Same-day submission", "Direct consulate liaison", "Real-time tracking", "Overnight shipping"] },
];

const ADDONS = [
  { id: "translation", name: "Certified Translation", price: "$45/page", description: "Translate documents before legalization" },
  { id: "apostille", name: "Apostille First", price: "$50", description: "Obtain apostille before consular legalization" },
  { id: "extra-copies", name: "Extra Certified Copies", price: "$10/copy", description: "Additional legalized copies" },
];

const FAQ = [
  { question: "What's the difference between apostille and consular legalization?", answer: "Apostille is for Hague Convention countries. Consular legalization is for non-Hague countries and requires authentication by the destination country's consulate." },
  { question: "Do I need a translation?", answer: "Many consulates require certified translations. We offer this as an add-on service." },
  { question: "How long does the process take?", answer: "Standard processing is 2-4 weeks. Expedited (1-2 weeks) and rush (3-5 days) options are available." },
  { question: "Which consulates do you work with?", answer: "We work with consulates across the US, including Chicago, New York, Los Angeles, Houston, and Washington DC." },
];

const CHECKLIST = [
  { id: "original", label: "Original document (or certified copy)", required: true },
  { id: "apostille", label: "Apostille (if already obtained)" },
  { id: "translation", label: "Certified translation (if applicable)" },
  { id: "passport", label: "Copy of passport or ID", required: true },
  { id: "consulate-form", label: "Consulate-specific forms (if known)" },
];

const TIMELINE = {
  steps: [
    { title: "Document Review", description: "We verify your documents meet consulate requirements" },
    { title: "Apostille (if needed)", description: "Obtain state apostille before consular submission" },
    { title: "Consulate Submission", description: "Documents submitted to the destination country's consulate" },
    { title: "Processing", description: "Consulate processes and authenticates documents" },
    { title: "Return Delivery", description: "Legalized documents shipped back to you" },
  ],
  turnaround: "2-4 weeks standard",
};

export default function ConsularLegalization() {
  usePageMeta({ title: "Consular Legalization Prep" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="consular-legalization"
        serviceTitle="Consular Legalization Preparation"
        serviceDescription="Prepare your documents for consular legalization. We handle the coordination — you provide the documents."
        fields={FIELDS}
        estimatedPrice="From $75.00"
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
