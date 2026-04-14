import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "language_from", label: "From Language", type: "select", required: true, options: [
    { value: "English", label: "English" }, { value: "Spanish", label: "Spanish" },
    { value: "Mandarin", label: "Mandarin" }, { value: "Arabic", label: "Arabic" },
    { value: "French", label: "French" }, { value: "other", label: "Other" },
  ]},
  { name: "language_to", label: "To Language", type: "select", required: true, options: [
    { value: "English", label: "English" }, { value: "Spanish", label: "Spanish" },
    { value: "Mandarin", label: "Mandarin" }, { value: "Arabic", label: "Arabic" },
    { value: "French", label: "French" }, { value: "other", label: "Other" },
  ]},
  { name: "session_type", label: "Session Type", type: "select", required: true, options: [
    { value: "in_person", label: "In-Person" },
    { value: "phone", label: "Phone" },
    { value: "video", label: "Video Call" },
  ]},
  { name: "preferred_date", label: "Preferred Date", type: "date", required: true },
  { name: "duration_estimate", label: "Estimated Duration (minutes)", type: "number" },
  { name: "context", label: "Context/Purpose", type: "textarea", required: true, placeholder: "e.g., Notarization session, legal meeting..." },
];

const PACKAGES = [
  { id: "basic", name: "Phone/Video", price: "$50/hr", description: "Remote interpretation", features: ["Phone or video call", "Real-time interpretation", "Common languages", "1-hour minimum"] },
  { id: "professional", name: "In-Person", price: "$75/hr", description: "On-site interpretation", features: ["In-person attendance", "Professional attire", "All languages", "Travel within service area", "2-hour minimum"], recommended: true },
  { id: "specialized", name: "Specialized", price: "$100/hr", description: "Legal/medical interpretation", features: ["Court-certified interpreters", "Medical terminology", "Legal proceedings", "Oath administration", "Written summary available"] },
];

const FAQ = [
  { q: "Are your interpreters certified?", a: "Yes, our interpreters hold professional certifications. Court and medical interpreters have specialized credentials." },
  { q: "How far in advance should I book?", a: "We recommend 48 hours notice for common languages. Rare languages may require 1-2 weeks." },
  { q: "Can interpreters assist during notarization?", a: "Yes, we frequently provide interpreters for notarization sessions to ensure signers understand the documents." },
  { q: "What languages do you cover?", a: "We cover 50+ languages including Spanish, Mandarin, Arabic, French, Portuguese, Korean, Somali, and ASL." },
];

export default function InterpreterServices() {
  usePageMeta({ title: "Interpreter Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="interpreter"
        serviceTitle="Interpreter Services"
        serviceDescription="Professional interpretation services for notarizations, legal meetings, and more."
        fields={FIELDS}
        estimatedPrice="From $50.00/hour"
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
