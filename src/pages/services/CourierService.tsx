/**
 * Sprint 5: Courier Service intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "pickup_address", label: "Pickup Address", type: "textarea", required: true },
  { name: "dropoff_address", label: "Delivery Address", type: "textarea", required: true },
  { name: "package_description", label: "Package Description", type: "text", required: true, placeholder: "e.g., Legal documents, 3 envelopes" },
  { name: "requires_signature", label: "Signature Required on Delivery", type: "switch", placeholder: "Require recipient signature" },
  { name: "chain_of_custody", label: "Chain of Custody Tracking", type: "switch", placeholder: "Enable tracking log" },
  { name: "preferred_date", label: "Preferred Pickup Date", type: "date", required: true },
  { name: "urgency", label: "Urgency", type: "select", options: [
    { value: "standard", label: "Standard (Same Day)" },
    { value: "rush", label: "Rush (2-4 Hours)" },
    { value: "immediate", label: "Immediate (ASAP)" },
  ]},
  { name: "notes", label: "Special Instructions", type: "textarea" },
];

export default function CourierService() {
  usePageMeta({ title: "Courier Service" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="courier-service"
        serviceTitle="Document Courier Service"
        serviceDescription="Secure document pickup and delivery with optional chain-of-custody tracking."
        fields={FIELDS}
        estimatedPrice="From $35.00"
      />
    </div>
  );
}
