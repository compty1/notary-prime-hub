import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "print_type", label: "Fingerprint Type", type: "select", required: true, options: [
    { value: "fd258", label: "FD-258 (FBI Standard)" },
    { value: "bci", label: "Ohio BCI" },
    { value: "live-scan", label: "Live Scan (Electronic)" },
    { value: "ink-card", label: "Ink Card (Standard)" },
  ]},
  { name: "purpose", label: "Purpose", type: "select", required: true, options: [
    { value: "employment", label: "Employment" },
    { value: "licensing", label: "Professional Licensing" },
    { value: "adoption", label: "Adoption" },
    { value: "immigration", label: "Immigration (USCIS)" },
    { value: "volunteer", label: "Volunteer Screening" },
    { value: "firearm", label: "Concealed Carry Permit" },
    { value: "other", label: "Other" },
  ]},
  { name: "agency_ori", label: "Agency ORI Number (if applicable)", type: "text", placeholder: "e.g. OHXXXXXXX" },
  { name: "num_cards", label: "Number of Cards Needed", type: "number", placeholder: "2" },
  { name: "preferred_date", label: "Preferred Date", type: "date" },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

const PACKAGES = [
  { id: "standard", name: "Standard Ink Cards", price: "$25.00", description: "Traditional ink fingerprint cards", features: ["2 ink fingerprint cards", "FD-258 or BCI format", "Same-day completion"] },
  { id: "livescan", name: "Live Scan", price: "$45.00", description: "Electronic fingerprinting with digital submission", features: ["Electronic capture", "Direct submission to agency", "Higher accuracy rate", "Results in 24–72 hours"], popular: true },
  { id: "mobile", name: "Mobile Fingerprinting", price: "$75.00", description: "We come to your location", features: ["On-site service", "All card types available", "Groups of 5+ discounted", "Same-day completion"] },
];

const ADD_ONS = [
  { id: "extra-cards", label: "Additional Cards (per card)", price: "+$10.00", description: "Extra copies for multiple agencies" },
  { id: "notarization", label: "Notarize Related Documents", price: "+$5.00", description: "Notarize background check authorization forms" },
  { id: "rush-results", label: "Rush Processing", price: "+$15.00", description: "Expedited agency submission and tracking" },
];

const FAQ = [
  { q: "What is an FD-258 fingerprint card?", a: "The FD-258 is the standard fingerprint card used by the FBI for background checks. It's required for federal employment, immigration (USCIS), and many licensing applications." },
  { q: "Do I need to bring anything?", a: "Bring a valid government-issued photo ID. If your agency provided an ORI number or specific forms, bring those as well." },
  { q: "How long does it take?", a: "In-office fingerprinting takes about 15 minutes. Live scan results are typically available from the agency within 24–72 hours." },
  { q: "Can you fingerprint children?", a: "Yes, we can fingerprint minors for adoption, immigration, and other lawful purposes. A parent or legal guardian must be present." },
  { q: "What if my prints are rejected?", a: "We offer one free re-roll if your fingerprints are rejected by the processing agency. Poor quality prints are rare with our FBI-certified equipment." },
];

const CHECKLIST = [
  { label: "Valid government-issued photo ID", required: true },
  { label: "Agency ORI number (if required)", required: false, description: "Check with the requesting agency" },
  { label: "Completed authorization forms", required: false, description: "If provided by your employer or agency" },
  { label: "Payment method", required: true },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Book Appointment", description: "Schedule or walk in during business hours" },
    { step: 2, label: "Fingerprint Capture", description: "15-minute session with certified technician" },
    { step: 3, label: "Submission", description: "Cards mailed or electronically submitted" },
    { step: 4, label: "Results", description: "Agency processes and returns results" },
  ],
  turnaround: "Same day (walk-in available)",
};

export default function Fingerprinting() {
  usePageMeta({ title: "Fingerprinting Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="fingerprinting"
        serviceTitle="Fingerprinting Services"
        serviceDescription="FBI-certified fingerprinting for employment, licensing, immigration, and background checks. FD-258, Ohio BCI, and live scan available."
        fields={FIELDS}
        estimatedPrice="From $25.00"
        pricingConfig={{ serviceId: "fingerprinting", fieldMapping: { signerCount: "num_applicants" } }}
        packages={PACKAGES}
        addOns={ADD_ONS}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
