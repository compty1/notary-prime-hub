/**
 * Sprint 3: Background Check intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "check_type", label: "Check Type", type: "select", required: true, options: [
    { value: "standard", label: "Standard Background Check" },
    { value: "employment", label: "Employment Verification" },
    { value: "criminal", label: "Criminal History" },
    { value: "comprehensive", label: "Comprehensive (All-in-One)" },
  ]},
  { name: "subject_name", label: "Subject Full Name", type: "text", required: true },
  { name: "purpose", label: "Purpose", type: "select", required: true, options: [
    { value: "employment", label: "Employment" },
    { value: "tenant", label: "Tenant Screening" },
    { value: "licensing", label: "Professional Licensing" },
    { value: "personal", label: "Personal" },
    { value: "other", label: "Other" },
  ]},
  { name: "fingerprints_needed", label: "Fingerprinting Required", type: "switch", placeholder: "Include ink fingerprinting" },
  { name: "notes", label: "Additional Details", type: "textarea" },
];

export default function BackgroundCheck() {
  usePageMeta({ title: "Background Check Coordination" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="background-check"
        serviceTitle="Background Check Coordination"
        serviceDescription="Coordinated background check services for employment, licensing, and personal needs."
        fields={FIELDS}
        estimatedPrice="From $35.00"
        consentItems={[
          { id: "consent_check", label: "I authorize this background check and certify the information provided is accurate.", required: true },
        ]}
      />
    </div>
  );
}
