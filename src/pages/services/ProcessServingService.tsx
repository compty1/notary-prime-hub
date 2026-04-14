import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "serve_type", label: "Service Type", type: "select", required: true, options: [
    { value: "personal", label: "Personal Service" },
    { value: "substitute", label: "Substitute Service" },
    { value: "posting", label: "Posting/Nail & Mail" },
    { value: "skip_trace", label: "Skip Trace + Serve" },
  ]},
  { name: "recipient_name", label: "Recipient Name", type: "text", required: true },
  { name: "recipient_address", label: "Recipient Address", type: "textarea", required: true },
  { name: "case_number", label: "Case Number", type: "text" },
  { name: "court_name", label: "Court Name", type: "text" },
  { name: "deadline", label: "Service Deadline", type: "date" },
  { name: "attempts_requested", label: "Max Attempts", type: "number", placeholder: "3" },
  { name: "files", label: "Upload Documents to Serve", type: "file", required: true },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

const PACKAGES = [
  { id: "standard", name: "Standard Service", price: "$65.00", description: "Up to 3 attempts within 5 business days", features: ["3 service attempts", "Proof of service affidavit", "Status updates via email"], popular: true },
  { id: "rush", name: "Rush Service", price: "$95.00", description: "Priority same-day or next-day attempt", features: ["Same/next-day first attempt", "Up to 3 attempts", "Real-time status updates", "Proof of service affidavit"] },
  { id: "skip-serve", name: "Skip Trace + Serve", price: "$150.00", description: "Locate and serve hard-to-find individuals", features: ["Skip trace investigation", "Address verification", "Up to 5 service attempts", "Detailed attempt log"] },
];

const ADD_ONS = [
  { id: "skip-trace", label: "Skip Trace Add-On", price: "+$50.00", description: "Locate current address for evasive recipients" },
  { id: "stakeout", label: "Stakeout Service", price: "+$75.00/hr", description: "Surveillance at known location for service" },
  { id: "photo-proof", label: "Photo Documentation", price: "+$15.00", description: "Photographs of service location and attempt" },
  { id: "extra-attempts", label: "Additional Attempts (2)", price: "+$30.00", description: "Two extra service attempts beyond package" },
];

const FAQ = [
  { q: "What counts as valid service in Ohio?", a: "Ohio Civil Rule 4.1 allows personal service, certified mail, or residence service. Personal service means handing documents directly to the named party. Substitute service can be left at the usual place of residence with a competent adult." },
  { q: "How many attempts will you make?", a: "Standard packages include 3 attempts at different times of day. If all attempts fail, we provide a detailed log of each attempt for the court. Additional attempts can be added." },
  { q: "What is a proof of service affidavit?", a: "A sworn statement signed by the process server detailing when, where, and how service was completed (or attempted). This is filed with the court as proof." },
  { q: "Can you serve papers anywhere in Ohio?", a: "Yes, we serve papers throughout all 88 Ohio counties. Out-of-state service is also available — contact us for details." },
  { q: "What if the person is avoiding service?", a: "We offer skip tracing to locate evasive individuals and can pursue alternative service methods as permitted by Ohio law, including posting/nail & mail with court approval." },
];

const CHECKLIST = [
  { label: "Documents to be served (PDF)", required: true, description: "All legal documents requiring service" },
  { label: "Recipient's known address", required: true, description: "Last known address of the person to be served" },
  { label: "Case number and court name", required: false, description: "If already filed with the court" },
  { label: "Description or photo of recipient", required: false, description: "Helps identify the correct person" },
  { label: "Service deadline", required: false, description: "Court-imposed deadline for service" },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Submit Documents", description: "Upload documents and recipient details" },
    { step: 2, label: "Assignment", description: "Process server assigned within 24 hours" },
    { step: 3, label: "Service Attempts", description: "Attempts made at varied times of day" },
    { step: 4, label: "Proof of Service", description: "Affidavit provided upon completion" },
  ],
  turnaround: "1–5 business days per attempt",
};

export default function ProcessServingService() {
  usePageMeta({ title: "Process Serving" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="process-serving"
        serviceTitle="Process Serving"
        serviceDescription="Professional process serving with proof of service documentation. Licensed servers covering all 88 Ohio counties."
        fields={FIELDS}
        estimatedPrice="From $65.00"
        packages={PACKAGES}
        addOns={ADD_ONS}
        faq={FAQ}
        checklist={CHECKLIST}
        timeline={TIMELINE}
      />
    </div>
  );
}
