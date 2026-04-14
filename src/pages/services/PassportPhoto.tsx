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

const PACKAGES = [
  { id: "digital", name: "Digital Only", price: "$15", description: "Digital passport photo", features: ["Compliant digital photo", "Multiple country formats", "Instant delivery", "1 retake included"] },
  { id: "standard", name: "Print + Digital", price: "$25", description: "2 printed photos + digital", features: ["2 printed photos", "Digital copy included", "Professional lighting", "Compliance guaranteed"], recommended: true },
  { id: "premium", name: "Premium Package", price: "$45", description: "6 prints + digital + visa photos", features: ["6 printed photos", "Digital copies", "Multiple country sizes", "Visa photo included", "Same-day service", "Unlimited retakes"] },
];

const FAQ = [
  { question: "Are your photos guaranteed to be accepted?", answer: "Yes, we guarantee compliance with the specified country's requirements. If rejected, we'll retake for free." },
  { question: "How long does it take?", answer: "Photos are taken and printed in about 10-15 minutes during your visit." },
  { question: "Do I need an appointment?", answer: "Walk-ins are welcome, but appointments are recommended for the fastest service." },
  { question: "What should I wear?", answer: "Wear everyday clothing. Avoid uniforms, hats, and head coverings (unless for religious purposes). White or off-white tops are discouraged for white-background photos." },
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
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
