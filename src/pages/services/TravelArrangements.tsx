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

const PACKAGES = [
  { id: "basic", name: "Booking Only", price: "$75", description: "Flight + hotel booking", features: ["Flight booking", "Hotel reservation", "Confirmation docs", "Basic itinerary"] },
  { id: "full", name: "Full Planning", price: "$199", description: "Complete trip planning", features: ["Flight + hotel", "Car rental", "Day-by-day itinerary", "Restaurant recommendations", "Activity bookings", "Travel documents checklist"], recommended: true },
  { id: "concierge", name: "Concierge", price: "$499", description: "VIP travel service", features: ["Everything in Full Planning", "24/7 trip support", "Real-time itinerary changes", "Airport transfers", "Special requests handling", "Emergency assistance"] },
];

const FAQ = [
  { q: "Do you book flights directly?", a: "We research and recommend the best options, then book on your behalf through trusted travel partners." },
  { q: "Can you help with travel documents?", a: "Yes, we provide checklists for passports, visas, and travel-related notarization needs." },
  { q: "Is there a cancellation policy?", a: "Our planning fee is non-refundable. Flight/hotel cancellation policies depend on the providers' terms." },
  { q: "Do you handle group travel?", a: "Yes, we handle corporate and group travel with special group rates and coordinated logistics." },
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
        estimatedPrice="From $75/booking"
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
