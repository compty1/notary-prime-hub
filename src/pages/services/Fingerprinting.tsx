/**
 * Sprint 3: Fingerprinting intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "fingerprint_type", label: "Fingerprinting Type", type: "select", required: true, options: [
    { value: "ink_card", label: "Ink Card (FD-258)" },
    { value: "livescan", label: "Live Scan (Electronic)" },
    { value: "mobile", label: "Mobile Fingerprinting" },
  ]},
  { name: "purpose", label: "Purpose", type: "select", required: true, options: [
    { value: "fbi", label: "FBI Background Check" },
    { value: "bci", label: "Ohio BCI Check" },
    { value: "employment", label: "Employment" },
    { value: "licensing", label: "Professional Licensing" },
    { value: "adoption", label: "Adoption" },
    { value: "immigration", label: "Immigration" },
    { value: "other", label: "Other" },
  ]},
  { name: "card_count", label: "Number of Cards", type: "number", required: true },
  { name: "agency_name", label: "Requesting Agency (if applicable)", type: "text" },
  { name: "preferred_date", label: "Preferred Date", type: "date" },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

export default function Fingerprinting() {
  usePageMeta({ title: "Ink Fingerprinting" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="fingerprinting"
        serviceTitle="Ink Fingerprinting Services"
        serviceDescription="Professional ink fingerprinting for FBI, BCI, employment, and licensing purposes."
        fields={FIELDS}
        estimatedPrice="From $25.00"
      />
    </div>
  );
}
