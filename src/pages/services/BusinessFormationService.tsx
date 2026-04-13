/**
 * Sprint 4: Business Formation Wizard intake
 */
import { ServiceIntakeForm, IntakeField } from "@/components/services/ServiceIntakeForm";
import { UPLGuard } from "@/components/services/UPLGuard";
import { usePageMeta } from "@/hooks/usePageMeta";

const FIELDS: IntakeField[] = [
  { name: "formation_type", label: "Entity Type", type: "select", required: true, options: [
    { value: "llc", label: "LLC" },
    { value: "corporation", label: "Corporation (Inc.)" },
    { value: "dba", label: "DBA / Trade Name" },
    { value: "nonprofit", label: "Nonprofit" },
    { value: "partnership", label: "Partnership" },
  ]},
  { name: "business_name", label: "Proposed Business Name", type: "text", required: true },
  { name: "state", label: "Formation State", type: "text", required: true, placeholder: "Ohio" },
  { name: "member_count", label: "Number of Members/Owners", type: "number", required: true },
  { name: "registered_agent", label: "Registered Agent Service Needed", type: "switch", placeholder: "We can serve as registered agent" },
  { name: "ein_needed", label: "EIN Application Needed", type: "switch", placeholder: "Apply for Employer ID Number" },
  { name: "sos_filing", label: "SOS Filing Coordination", type: "switch", placeholder: "File with Secretary of State" },
  { name: "description", label: "Business Description", type: "textarea", placeholder: "Brief description of your business..." },
  { name: "deadline", label: "Target Start Date", type: "date" },
];

export default function BusinessFormationService() {
  usePageMeta({ title: "Business Formation" });
  return (
    <div className="container max-w-5xl py-8">
      <UPLGuard serviceName="Business Formation">
        <ServiceIntakeForm
          serviceSlug="business-formation"
          serviceTitle="Business Formation & Filing"
          serviceDescription="LLC, Corporation, DBA formation document preparation and SOS filing coordination."
          fields={FIELDS}
          estimatedPrice="From $99.00"
          consentItems={[
            { id: "upl", label: "I understand this is document preparation and filing coordination, not legal advice.", required: true },
          ]}
        />
      </UPLGuard>
    </div>
  );
}
