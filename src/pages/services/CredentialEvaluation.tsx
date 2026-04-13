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

export default function CredentialEvaluation() {
  usePageMeta({ title: "Credential Evaluation" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="credential-evaluation"
        serviceTitle="Foreign Credential Evaluation"
        serviceDescription="NACES-standard evaluation of foreign academic and professional credentials for US equivalency."
        fields={FIELDS}
        estimatedPrice="From $150.00"
      />
    </div>
  );
}
