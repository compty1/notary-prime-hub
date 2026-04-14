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

const PACKAGES = [
  { id: "identity", name: "ID Verification", price: "$25", description: "Basic identity check", features: ["Government ID verification", "Facial match check", "Same-day results", "Digital report"] },
  { id: "full", name: "Full KYC", price: "$75", description: "Comprehensive verification", features: ["ID + address verification", "Background screening", "Sanctions list check", "Detailed compliance report"], recommended: true },
  { id: "business", name: "Business KYC", price: "$150", description: "Entity verification", features: ["Business registration check", "Beneficial ownership", "Officer verification", "Good standing confirmation", "Full compliance package"] },
];

const FAQ = [
  { q: "How is my data protected?", a: "All data is encrypted in transit and at rest. We follow SOC 2 standards and delete verification data after 30 days unless retention is required." },
  { q: "How quickly do I get results?", a: "Identity verification results are typically available within 1 hour. Full KYC takes 1-2 business days." },
  { q: "What ID types do you accept?", a: "We accept driver's licenses, passports, state IDs, and military IDs from the US and 200+ countries." },
  { q: "Can this be used for notarization compliance?", a: "Yes, our KYC verification meets Ohio RON identity proofing requirements under ORC §147.66." },
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
        packages={PACKAGES}
        faq={FAQ}
        consentItems={[
          { id: "consent_id", label: "I consent to having my identity documents verified for this service.", required: true },
          { id: "consent_data", label: "I understand my data will be handled per the privacy policy.", required: true },
        ]}
      />
    </div>
  );
}
