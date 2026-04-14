import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "email_volume", label: "Daily Email Volume", type: "select", required: true, options: [
    { value: "under-25", label: "Under 25 emails" },
    { value: "25-50", label: "25-50 emails" },
    { value: "50-100", label: "50-100 emails" },
    { value: "100+", label: "100+ emails" },
  ]},
  { name: "services_needed", label: "Services Needed", type: "textarea", required: true, placeholder: "e.g. inbox management, response drafting, scheduling..." },
  { name: "hours_per_week", label: "Hours Per Week", type: "select", options: [
    { value: "5", label: "5 hours" },
    { value: "10", label: "10 hours" },
    { value: "20", label: "20 hours" },
    { value: "40", label: "Full-time (40 hours)" },
  ]},
  { name: "notes", label: "Additional Notes", type: "textarea" },
];

const PACKAGES = [
  { id: "basic", name: "Basic Inbox", price: "$199/mo", description: "5 hours/week", features: ["Inbox triage & sorting", "Spam management", "Priority flagging", "Weekly summary report"] },
  { id: "professional", name: "Professional", price: "$499/mo", description: "15 hours/week", features: ["Full inbox management", "Response drafting", "Calendar scheduling", "Follow-up tracking", "Daily summary"], recommended: true },
  { id: "executive", name: "Executive", price: "$999/mo", description: "Full-time coverage", features: ["24/7 inbox monitoring", "Response on your behalf", "Meeting coordination", "Travel booking", "Client communication", "Dedicated assistant"] },
];

const FAQ = [
  { q: "How do you access my email?", a: "We use secure delegated access (Google Workspace, Outlook) — your password is never shared." },
  { q: "Can you draft responses in my voice?", a: "Yes, we study your communication style and create a tone guide during onboarding to match your voice." },
  { q: "What about confidential emails?", a: "We follow strict confidentiality protocols. You can tag emails or senders as off-limits during setup." },
  { q: "How quickly will emails be handled?", a: "Professional plan: within 2 hours during business hours. Executive plan: within 30 minutes 24/7." },
];

export default function EmailManagement() {
  usePageMeta({ title: "Email Management" });
  return (
    <div className="container max-w-5xl py-8">
      <ServiceIntakeForm
        serviceSlug="email-management"
        serviceTitle="Email Management"
        serviceDescription="Professional email inbox management, response handling, and organization services."
        fields={FIELDS}
        estimatedPrice="From $199/month"
        packages={PACKAGES}
        faq={FAQ}
      />
    </div>
  );
}
