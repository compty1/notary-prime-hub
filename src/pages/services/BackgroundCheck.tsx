import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "check_type", label: "Background Check Type", type: "select", required: true, options: [
    { value: "criminal", label: "Criminal History" },
    { value: "employment", label: "Employment Verification" },
    { value: "education", label: "Education Verification" },
    { value: "comprehensive", label: "Comprehensive (All)" },
    { value: "tenant", label: "Tenant Screening" },
  ]},
  { name: "subject_name", label: "Subject Full Legal Name", type: "text", required: true },
  { name: "subject_dob", label: "Subject Date of Birth", type: "date", required: true },
  { name: "subject_ssn_last4", label: "Last 4 of SSN (optional)", type: "text", placeholder: "XXXX" },
  { name: "purpose", label: "Purpose of Check", type: "text", required: true, placeholder: "e.g. Pre-employment, Tenant screening" },
  { name: "consent_form", label: "Upload Signed Consent Form", type: "file", required: true },
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

const PACKAGES = [
  { id: "basic", name: "Basic Criminal", price: "$35.00", description: "County and state criminal records search", features: ["Ohio BCI criminal records", "Sex offender registry", "County court records", "7-year search"] },
  { id: "standard", name: "Standard Check", price: "$75.00", description: "Criminal + identity verification", features: ["All Basic features", "SSN trace & address history", "National criminal database", "Alias name search"], popular: true },
  { id: "comprehensive", name: "Comprehensive", price: "$125.00", description: "Full background investigation", features: ["All Standard features", "Employment verification", "Education verification", "Professional license check", "Credit report (with consent)"] },
];

const ADD_ONS = [
  { id: "fingerprint", label: "Add Fingerprinting", price: "+$25.00", description: "FBI fingerprint-based background check" },
  { id: "drug-test", label: "Drug Test Coordination", price: "+$45.00", description: "Schedule and coordinate drug testing" },
  { id: "intl-check", label: "International Records", price: "+$75.00", description: "Search international criminal databases" },
  { id: "continuous", label: "Continuous Monitoring (annual)", price: "+$99.00/yr", description: "Ongoing alerts for new criminal records" },
];

const FAQ = [
  { q: "Is subject consent required?", a: "Yes. Under the Fair Credit Reporting Act (FCRA), written consent from the subject is required before conducting a background check for employment or tenant screening purposes." },
  { q: "How far back does a criminal search go?", a: "Ohio follows the 7-year rule for most employment-related criminal background checks, though some positions (financial, healthcare) may search further." },
  { q: "Can I run a background check on myself?", a: "Yes! Self-checks are a great way to review your own records before applying for jobs or housing." },
  { q: "How long do results take?", a: "Basic criminal checks return in 1–3 business days. Comprehensive checks with verifications typically take 5–7 business days." },
];

const CHECKLIST = [
  { label: "Signed consent/authorization form", required: true, description: "FCRA-compliant authorization from the subject" },
  { label: "Subject's full legal name and DOB", required: true },
  { label: "Subject's current address", required: true },
  { label: "SSN (last 4 or full, if available)", required: false },
  { label: "Purpose/permissible use statement", required: true },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Submit Request", description: "Provide subject info and signed consent" },
    { step: 2, label: "Verification", description: "We verify consent and initiate search" },
    { step: 3, label: "Processing", description: "Records searched across databases" },
    { step: 4, label: "Report Delivery", description: "Secure report delivered to you" },
  ],
  turnaround: "3–7 business days",
};

export default function BackgroundCheck() {
  usePageMeta({ title: "Background Check Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="background-check"
        serviceTitle="Background Check Services"
        serviceDescription="FCRA-compliant background checks for employment, tenant screening, and personal use."
        fields={FIELDS}
        estimatedPrice="From $35.00"
        packages={PACKAGES}
        addOns={ADD_ONS}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
