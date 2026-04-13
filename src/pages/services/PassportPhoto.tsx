/**
 * Sprint 3: Passport Photo Service
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "country_standard", label: "Country Standard", type: "select", required: true, options: [
    { value: "US", label: "United States (2x2 in)" },
    { value: "UK", label: "United Kingdom (35x45 mm)" },
    { value: "EU", label: "European Union (35x45 mm)" },
    { value: "CA", label: "Canada (50x70 mm)" },
    { value: "IN", label: "India (2x2 in)" },
    { value: "CN", label: "China (33x48 mm)" },
    { value: "other", label: "Other (specify in notes)" },
  ]},
  { name: "photo_count", label: "Number of Photos", type: "number", required: true },
  { name: "digital_delivery", label: "Digital Delivery", type: "switch", placeholder: "Receive digital copies" },
  { name: "print_delivery", label: "Printed Photos", type: "switch", placeholder: "Receive printed copies" },
  { name: "notes", label: "Special Requirements", type: "textarea", placeholder: "e.g., specific background color..." },
];

export default function PassportPhoto() {
  usePageMeta({ title: "Passport Photo Service" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="passport-photo"
        serviceTitle="Passport Photo Service"
        serviceDescription="Compliant passport and visa photos meeting international standards."
        fields={FIELDS}
        estimatedPrice="From $15.00"
      />
    </div>
  );
}
