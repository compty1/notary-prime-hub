/**
 * Sprint 4: Court Form Preparation intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "form_category", label: "Court Form Category", type: "select", required: true, options: [
    { value: "probate", label: "Probate" },
    { value: "domestic", label: "Domestic Relations" },
    { value: "civil", label: "Civil" },
    { value: "criminal", label: "Criminal" },
    { value: "juvenile", label: "Juvenile" },
    { value: "small_claims", label: "Small Claims" },
    { value: "appeals", label: "Appeals" },
  ]},
  { name: "county", label: "Ohio County", type: "text", required: true, placeholder: "e.g., Franklin, Cuyahoga" },
  { name: "form_name", label: "Form Name/Number", type: "text", required: true, placeholder: "e.g., Probate Form 4.0" },
  { name: "case_number", label: "Case Number (if existing)", type: "text" },
  { name: "description", label: "Details", type: "textarea", required: true, placeholder: "Provide the information to be entered on the form..." },
  { name: "deadline", label: "Filing Deadline", type: "date" },
  { name: "filing_needed", label: "Filing Coordination Needed", type: "switch", placeholder: "We can coordinate filing" },
  { name: "files", label: "Upload Supporting Documents", type: "file" },
];

export default function CourtFormPreparation() {
  usePageMeta({ title: "Court Form Preparation" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Court Form Preparation">
        <ServiceIntakeForm
          serviceSlug="court-form-preparation"
          serviceTitle="Court Form Preparation"
          serviceDescription="Clerical assistance filling out Ohio court forms. We transcribe your information — we do not provide legal advice."
          fields={FIELDS}
          estimatedPrice="From $25.00"
          consentItems={[
            { id: "upl", label: "I understand this is a clerical form-filling service per ORC §4705.07.", required: true },
          ]}
        />
      </UPLGuard>
    </div>
  );
}
