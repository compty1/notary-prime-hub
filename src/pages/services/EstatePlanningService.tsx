/**
 * Sprint 4: Estate Planning Support intake (with UPL guard)
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "service_type", label: "Service Needed", type: "select", required: true, options: [
    { value: "will_preparation", label: "Will Preparation Assistance" },
    { value: "trust_preparation", label: "Trust Document Preparation" },
    { value: "poa_preparation", label: "Power of Attorney Preparation" },
    { value: "healthcare_directive", label: "Healthcare Directive" },
    { value: "beneficiary_designation", label: "Beneficiary Designations" },
    { value: "document_review", label: "Document Organization/Review" },
  ]},
  { name: "signer_count", label: "Number of Signers", type: "number", required: true },
  { name: "witnesses_needed", label: "Witnesses Needed", type: "switch", placeholder: "Request witness services" },
  { name: "notarization_needed", label: "Notarization Needed", type: "switch", placeholder: "Include notarization" },
  { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Describe your estate planning needs..." },
  { name: "deadline", label: "Preferred Completion Date", type: "date" },
  { name: "files", label: "Upload Existing Documents", type: "file" },
];

export default function EstatePlanningService() {
  usePageMeta({ title: "Estate Planning Support" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Estate Planning Support">
        <ServiceIntakeForm
          serviceSlug="estate-planning"
          serviceTitle="Estate Planning Document Support"
          serviceDescription="Clerical assistance with estate planning documents. We prepare documents — we do not provide legal advice."
          fields={FIELDS}
          estimatedPrice="From $50.00"
          consentItems={[
            { id: "upl", label: "I understand this is document preparation only, not legal counsel.", required: true },
            { id: "attorney", label: "I have been advised to consult an attorney for legal guidance.", required: true },
          ]}
        />
      </UPLGuard>
    </div>
  );
}
