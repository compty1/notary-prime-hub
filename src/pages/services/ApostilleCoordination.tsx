import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "doc_type", label: "Document Type", type: "select", required: true, options: [
    { value: "birth-cert", label: "Birth Certificate" },
    { value: "marriage-cert", label: "Marriage Certificate" },
    { value: "diploma", label: "Diploma / Degree" },
    { value: "corporate", label: "Corporate Document" },
    { value: "court-order", label: "Court Order" },
    { value: "power-of-attorney", label: "Power of Attorney" },
    { value: "other", label: "Other" },
  ]},
  { name: "destination_country", label: "Destination Country", type: "text", required: true },
  { name: "doc_count", label: "Number of Documents", type: "number", required: true, placeholder: "1" },
  { name: "needs_translation", label: "Need Certified Translation?", type: "switch", placeholder: "Add certified translation service" },
  { name: "needs_notarization", label: "Need Notarization First?", type: "switch", placeholder: "Document requires notarization before apostille" },
  { name: "files", label: "Upload Documents", type: "file", required: true },
  { name: "deadline", label: "Deadline (if any)", type: "date" },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

const PACKAGES = [
  { id: "standard", name: "Standard Processing", price: "$85.00", description: "Regular Ohio SOS processing", features: ["Document review & prep", "Ohio SOS submission", "Apostille certificate", "Return shipping included", "7–10 business days"] },
  { id: "rush", name: "Rush Processing", price: "$150.00", description: "Expedited Ohio SOS processing", features: ["All Standard features", "Priority SOS submission", "3–5 business day turnaround", "Tracking updates"], popular: true },
  { id: "full-service", name: "Full Service Package", price: "$225.00", description: "Apostille + translation + notarization", features: ["Certified translation included", "Notarization if needed", "Apostille processing", "Consular legalization guidance", "Document return shipping"] },
];

const ADD_ONS = [
  { id: "translation", label: "Certified Translation", price: "+$45.00/page", description: "ATA-certified translation for foreign use" },
  { id: "notarize", label: "Notarization", price: "+$5.00/act", description: "Ohio notarization per ORC §147.08" },
  { id: "consular", label: "Consular Legalization Guidance", price: "+$50.00", description: "Assistance with non-Hague countries" },
  { id: "copies", label: "Extra Certified Copies", price: "+$15.00/copy", description: "Additional apostilled copies" },
];

const FAQ = [
  { q: "What is an apostille?", a: "An apostille is a certificate issued by the Ohio Secretary of State that authenticates a document for use in Hague Convention member countries." },
  { q: "Does my document need notarization before apostille?", a: "Government-issued documents (birth certificates, court orders) generally don't need notarization. Private documents (affidavits, POAs) typically do." },
  { q: "What if my destination country isn't in the Hague Convention?", a: "Non-Hague countries require embassy or consular legalization instead. We can guide you through this process." },
  { q: "How long does Ohio SOS apostille processing take?", a: "Standard processing is 7–10 business days. Rush processing can reduce this to 3–5 business days." },
];

const CHECKLIST = [
  { label: "Original or certified copy of document", required: true },
  { label: "Destination country", required: true, description: "Must be a Hague Convention member for apostille" },
  { label: "Notarization (if needed)", required: false },
  { label: "Translation (if needed)", required: false },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Document Review", description: "We verify document eligibility for apostille" },
    { step: 2, label: "Notarize if Needed", description: "Notarization for private documents" },
    { step: 3, label: "Submit to Ohio SOS", description: "Document submitted for apostille certification" },
    { step: 4, label: "Return to Client", description: "Apostilled document shipped or available for pickup" },
  ],
  turnaround: "5–10 business days (rush available)",
};

export default function ApostilleCoordination() {
  usePageMeta({ title: "Apostille Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="apostille"
        serviceTitle="Apostille & Document Authentication"
        serviceDescription="Ohio Secretary of State apostille processing for international document authentication. Hague Convention compliant."
        fields={FIELDS}
        estimatedPrice="From $85.00"
        pricingConfig={{ serviceId: "apostille", fieldMapping: { documentCount: "document_count", isRush: "rush" } }}
        packages={PACKAGES}
        addOns={ADD_ONS}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
