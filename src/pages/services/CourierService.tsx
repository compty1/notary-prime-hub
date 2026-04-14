import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "pickup_address", label: "Pickup Address", type: "textarea", required: true },
  { name: "dropoff_address", label: "Delivery Address", type: "textarea", required: true },
  { name: "package_desc", label: "Package Description", type: "text", required: true, placeholder: "e.g. Legal documents, sealed envelope" },
  { name: "requires_signature", label: "Signature Required?", type: "switch", placeholder: "Require recipient signature on delivery" },
  { name: "chain_of_custody", label: "Chain of Custody Tracking?", type: "switch", placeholder: "Full chain of custody documentation" },
  { name: "pickup_date", label: "Preferred Pickup Date", type: "date", required: true },
  { name: "pickup_time", label: "Preferred Pickup Time", type: "text", placeholder: "e.g. 9:00 AM" },
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

const PACKAGES = [
  { id: "standard", name: "Standard Courier", price: "$35.00", description: "Same-day delivery within service area", features: ["Same-day delivery", "Photo proof of delivery", "Real-time tracking", "Up to 25 miles"] },
  { id: "legal", name: "Legal Courier", price: "$55.00", description: "Secure legal document delivery", features: ["Chain of custody log", "Signature confirmation", "Tamper-evident packaging", "Court filing available"], popular: true },
  { id: "rush", name: "Rush / Priority", price: "$75.00", description: "2-hour pickup and delivery guarantee", features: ["2-hour service window", "All Legal Courier features", "Real-time GPS tracking", "Priority dispatch"] },
];

const ADD_ONS = [
  { id: "court-filing", label: "Court Filing Service", price: "+$25.00", description: "File documents at courthouse on your behalf" },
  { id: "wait-return", label: "Wait & Return", price: "+$35.00/hr", description: "Courier waits for documents and returns them" },
  { id: "notarize", label: "Notarization at Pickup", price: "+$5.00", description: "Notarize documents before delivery" },
];

const FAQ = [
  { q: "What is chain of custody tracking?", a: "A detailed log documenting every person who handles the documents, with timestamps and signatures. Essential for legal documents." },
  { q: "What areas do you cover?", a: "We cover the entire Columbus metro area and surrounding counties. Extended service to all 88 Ohio counties available." },
  { q: "Can you file documents at the courthouse?", a: "Yes! Add our court filing service and we'll file your documents with the clerk and return file-stamped copies." },
  { q: "How fast can you pick up?", a: "Standard same-day service picks up within 4 hours. Rush service guarantees pickup within 2 hours." },
];

const TIMELINE = {
  steps: [
    { step: 1, label: "Request Submitted", description: "Provide pickup/delivery details" },
    { step: 2, label: "Courier Dispatched", description: "Driver assigned and en route" },
    { step: 3, label: "Package Picked Up", description: "Documents collected, chain of custody starts" },
    { step: 4, label: "Delivered", description: "Delivered with photo proof and/or signature" },
  ],
  turnaround: "Same day (rush: 2 hours)",
};

export default function CourierService() {
  usePageMeta({ title: "Courier Services" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="courier"
        serviceTitle="Legal Courier Services"
        serviceDescription="Secure, same-day document courier service with chain of custody tracking. Court filing available."
        fields={FIELDS}
        estimatedPrice="From $35.00"
        packages={PACKAGES}
        addOns={ADD_ONS}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
