import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "agency_name", label: "Agency / Firm Name", type: "text", required: true },
  { name: "document_types", label: "Document Types", type: "textarea", required: true, placeholder: "List the document types you need prepared..." },
  { name: "volume", label: "Monthly Volume", type: "select", required: true, options: [
    { value: "1-10", label: "1-10 documents" },
    { value: "11-50", label: "11-50 documents" },
    { value: "51-100", label: "51-100 documents" },
    { value: "100+", label: "100+ documents" },
  ]},
  { name: "turnaround", label: "Standard Turnaround", type: "select", options: [
    { value: "24h", label: "24 hours" },
    { value: "48h", label: "48 hours" },
    { value: "1week", label: "1 week" },
  ]},
  { name: "notes", label: "Special Requirements", type: "textarea" },
];

export default function CertifiedDocPrepAgencies() {
  usePageMeta({ title: "Certified Document Prep for Agencies" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Certified Document Preparation">
        <ServiceIntakeForm
          serviceSlug="certified-doc-prep-agencies"
          serviceTitle="Certified Document Preparation for Agencies"
          serviceDescription="Bulk document preparation services for agencies, law firms, and organizations. Clerical service only."
          fields={FIELDS}
          estimatedPrice="Custom pricing"
          consentItems={[{ id: "upl", label: "I understand this is a clerical service and does not constitute legal advice.", required: true }]}
        />
      </UPLGuard>
    </div>
  );
}
