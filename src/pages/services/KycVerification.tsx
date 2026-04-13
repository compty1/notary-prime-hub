/**
 * Sprint 3: KYC/ID Verification
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "verification_type", label: "Verification Type", type: "select", required: true, options: [
    { value: "identity", label: "Identity Verification" },
    { value: "address", label: "Address Verification" },
    { value: "full_kyc", label: "Full KYC Package" },
    { value: "business", label: "Business Entity Verification" },
  ]},
  { name: "full_name", label: "Full Legal Name", type: "text", required: true },
  { name: "id_type", label: "ID Type", type: "select", required: true, options: [
    { value: "drivers_license", label: "Driver's License" },
    { value: "passport", label: "Passport" },
    { value: "state_id", label: "State ID" },
    { value: "military_id", label: "Military ID" },
  ]},
  { name: "id_number_last4", label: "ID Number (Last 4 digits)", type: "text", placeholder: "Last 4 only for security" },
  { name: "purpose", label: "Purpose of Verification", type: "textarea", required: true },
  { name: "files", label: "Upload ID (front & back)", type: "file" },
];

export default function KycVerification() {
  usePageMeta({ title: "KYC/ID Verification" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="kyc-verification"
        serviceTitle="KYC / Identity Verification"
        serviceDescription="Professional identity and know-your-customer verification services."
        fields={FIELDS}
        estimatedPrice="From $25.00"
        consentItems={[
          { id: "consent_id", label: "I consent to having my identity documents verified for this service.", required: true },
          { id: "consent_data", label: "I understand my data will be handled per the privacy policy.", required: true },
        ]}
      />
    </div>
  );
}
