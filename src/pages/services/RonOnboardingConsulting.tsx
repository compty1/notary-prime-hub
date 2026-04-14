import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "current_status", label: "Current Notary Status", type: "select", required: true, options: [
    { value: "not-commissioned", label: "Not yet commissioned" },
    { value: "traditional", label: "Traditional notary (no RON)" },
    { value: "ron-pending", label: "RON application pending" },
    { value: "ron-active", label: "RON active, need help" },
  ]},
  { name: "state", label: "Commission State", type: "text", required: true, placeholder: "e.g. Ohio" },
  { name: "goals", label: "Consulting Goals", type: "textarea", required: true, placeholder: "What do you need help with?" },
  { name: "preferred_schedule", label: "Preferred Schedule", type: "select", options: [
    { value: "weekday", label: "Weekday" },
    { value: "evening", label: "Evening" },
    { value: "weekend", label: "Weekend" },
  ]},
];

const PACKAGES = [
  { id: "starter", name: "Quick Start", price: "$199", description: "1-hour consultation", features: ["1-hour video call", "RON requirements review", "Technology recommendations", "Application checklist", "Follow-up email summary"] },
  { id: "full", name: "Full Onboarding", price: "$499", description: "Complete RON setup", features: ["3 consulting sessions", "Application assistance", "Platform setup guidance", "First session mentoring", "30-day email support", "Compliance checklist"], recommended: true },
  { id: "premium", name: "Premium Mentorship", price: "$999", description: "90-day mentorship", features: ["Unlimited sessions", "Complete application handling", "Platform configuration", "Marketing guidance", "90-day support", "Revenue strategy", "Ongoing mentorship"] },
];

const FAQ = [
  { question: "What are Ohio's RON requirements?", answer: "Ohio requires a traditional notary commission, completion of an approved RON course, passing an exam, and registration with an approved technology provider per ORC §147.66." },
  { question: "How long does RON setup take?", answer: "From start to first RON session, expect 2-4 weeks for application processing plus 1-2 weeks for technology setup." },
  { question: "Do I need special equipment?", answer: "You'll need a computer with webcam, stable internet, digital certificate, and an approved RON platform subscription." },
  { question: "Can you help with other states?", answer: "While we specialize in Ohio, we can provide guidance for any state that has adopted RON legislation." },
];

const TIMELINE = {
  steps: [
    { title: "Initial Assessment", description: "Review your current status and goals" },
    { title: "Requirements Roadmap", description: "Create your personalized RON certification plan" },
    { title: "Application Support", description: "Guide you through the state application process" },
    { title: "Technology Setup", description: "Help configure your RON platform and tools" },
    { title: "First Session Mentoring", description: "Walk through your first RON session together" },
  ],
  turnaround: "2-4 weeks to full certification",
};

export default function RonOnboardingConsulting() {
  usePageMeta({ title: "RON Onboarding Consulting" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="ron-onboarding-consulting"
        serviceTitle="RON Onboarding Consulting"
        serviceDescription="Expert guidance for notaries transitioning to Remote Online Notarization, covering Ohio ORC §147.66 requirements, technology setup, and best practices."
        fields={FIELDS}
        estimatedPrice="From $199/session"
        packages={PACKAGES}
        faq={FAQ}
        timeline={TIMELINE}
      />
    </div>
  );
}
