/**
 * Sprint 3: Form Filling Assistance intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "form_type", label: "Form Type", type: "select", required: true, options: [
    { value: "government", label: "Government Form" },
    { value: "court", label: "Court Form" },
    { value: "business", label: "Business Form" },
    { value: "medical", label: "Medical Form" },
    { value: "financial", label: "Financial Form" },
    { value: "other", label: "Other" },
  ]},
  { name: "form_name", label: "Form Name/Number", type: "text", required: true, placeholder: "e.g., SS-5, I-130, Ohio Probate Form 4.0" },
  { name: "description", label: "Additional Details", type: "textarea", placeholder: "Any specific instructions..." },
  { name: "deadline", label: "Deadline", type: "date" },
  { name: "files", label: "Upload Blank Form (if available)", type: "file" },
];

export default function FormFilling() {
  usePageMeta({ title: "Form Filling Assistance" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Form Filling Assistance">
        <ServiceIntakeForm
          serviceSlug="form-filling"
          serviceTitle="Form Filling Assistance"
          serviceDescription="We help fill out forms accurately based on information you provide. This is a clerical service."
          fields={FIELDS}
          estimatedPrice="From $20.00"
          consentItems={[{ id: "upl", label: "I understand this is a clerical form-filling service, not legal advice.", required: true }]}
        />
      </UPLGuard>
    </div>
  );
}
