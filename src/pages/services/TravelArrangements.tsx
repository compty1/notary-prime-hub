import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "travel_type", label: "Travel Type", type: "select", required: true, options: [
    { value: "domestic", label: "Domestic" },
    { value: "international", label: "International" },
  ]},
  { name: "destination", label: "Destination", type: "text", required: true },
  { name: "travel_dates", label: "Travel Dates", type: "text", required: true, placeholder: "e.g. June 15-20, 2026" },
  { name: "travelers", label: "Number of Travelers", type: "number", placeholder: "1" },
  { name: "services_needed", label: "Services Needed", type: "textarea", required: true, placeholder: "e.g. flights, hotels, car rental, itinerary planning..." },
  { name: "budget", label: "Budget Range", type: "text", placeholder: "e.g. $2,000-$3,000" },
  { name: "notes", label: "Special Requirements", type: "textarea" },
];

export default function TravelArrangements() {
  usePageMeta({ title: "Travel Arrangements" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="travel-arrangements"
        serviceTitle="Travel Arrangements"
        serviceDescription="Full-service travel planning and booking for business and personal trips."
        fields={FIELDS}
        estimatedPrice="From $75.00/booking"
      />
    </div>
  );
}
