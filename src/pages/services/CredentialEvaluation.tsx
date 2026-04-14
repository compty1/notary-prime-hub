import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "credential_type", label: "Credential Type", type: "select", required: true, options: [
    { value: "degree", label: "University Degree" },
    { value: "diploma", label: "High School Diploma" },
    { value: "professional", label: "Professional Certification" },
    { value: "vocational", label: "Vocational Training" },
  ]},
  { name: "country_of_issue", label: "Country of Issue", type: "text", required: true },
  { name: "purpose", label: "Purpose", type: "select", required: true, options: [
    { value: "employment", label: "Employment" },
    { value: "education", label: "Further Education" },
    { value: "immigration", label: "Immigration (USCIS)" },
    { value: "licensing", label: "Professional Licensing" },
  ]},
  { name: "source_documents", label: "Upload Credentials", type: "file", required: true },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

const PACKAGES = [
  { id: "document", name: "Document-by-Document", price: "$150", description: "Course-by-course evaluation", features: ["Detailed course listing", "US credit equivalency", "GPA calculation", "Official sealed report"] },
  { id: "general", name: "General Evaluation", price: "$100", description: "Degree equivalency only", features: ["Degree level equivalency", "Institution verification", "Official sealed report", "Digital + hard copy"], recommended: true },
  { id: "expert", name: "Expert Opinion", price: "$250", description: "For licensing boards & USCIS", features: ["Detailed analysis letter", "Board-specific formatting", "Expert credentials stated", "Rush available", "Unlimited revisions"] },
];

const ADDONS = [
  { id: "rush", name: "Rush Processing", price: "$75", description: "3-day turnaround instead of 10-15 days" },
  { id: "translation", name: "Document Translation", price: "$45/page", description: "Certified translation of credentials" },
  { id: "extra-copy", name: "Extra Report Copy", price: "$25", description: "Additional sealed copy for another institution" },
];

const FAQ = [
  { question: "Is this evaluation NACES-recognized?", answer: "We coordinate with NACES and AICE member agencies to ensure your evaluation is widely accepted." },
  { question: "What documents do I need?", answer: "You'll need your diploma/degree certificate, official transcripts, and certified translations if not in English." },
  { question: "How long does evaluation take?", answer: "Standard processing is 10-15 business days. Rush processing (3 days) is available for an additional fee." },
  { question: "Will USCIS accept this evaluation?", answer: "Yes, our Expert Opinion evaluations are formatted specifically for USCIS immigration petitions." },
];

const CHECKLIST = [
  { id: "diploma", label: "Diploma or degree certificate (scan or original)", required: true },
  { id: "transcripts", label: "Official transcripts with grades", required: true },
  { id: "translation", label: "Certified English translation (if not in English)", required: true },
  { id: "id", label: "Government-issued photo ID" },
  { id: "purpose-doc", label: "Letter from requesting institution (if applicable)" },
];

const TIMELINE = {
  steps: [
    { title: "Document Submission", description: "Upload credentials and supporting documents" },
    { title: "Verification", description: "We verify institution accreditation and authenticity" },
    { title: "Analysis", description: "Credentials evaluated against US standards" },
    { title: "Report Preparation", description: "Official evaluation report drafted" },
    { title: "Delivery", description: "Sealed report mailed and digital copy provided" },
  ],
  turnaround: "10-15 business days",
};

export default function CredentialEvaluation() {
  usePageMeta({ title: "Credential Evaluation" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="credential-evaluation"
        serviceTitle="Foreign Credential Evaluation"
        serviceDescription="NACES-standard evaluation of foreign academic and professional credentials for US equivalency."
        fields={FIELDS}
        estimatedPrice="From $100.00"
        packages={PACKAGES}
        addOns={ADDONS}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
