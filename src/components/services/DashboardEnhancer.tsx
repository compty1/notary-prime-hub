/**
 * Dashboard enhancement wrapper — adds AI workspace tab + category tools
 * to any existing admin service dashboard. Covers ALL service categories.
 */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIServiceWorkspace } from "@/components/services/AIServiceWorkspace";
import { TranslationTools } from "@/components/services/tools/TranslationTools";
import { LegalTools } from "@/components/services/tools/LegalTools";
import { ContentTools } from "@/components/services/tools/ContentTools";
import { BusinessTools } from "@/components/services/tools/BusinessTools";
import { ImmigrationTools } from "@/components/services/tools/ImmigrationTools";
import { ResearchTools } from "@/components/services/tools/ResearchTools";
import { ApostilleTools } from "@/components/services/tools/ApostilleTools";
import { FingerprintingTools } from "@/components/services/tools/FingerprintingTools";
import { RealEstateTools } from "@/components/services/tools/RealEstateTools";
import { CourtFormsTools } from "@/components/services/tools/CourtFormsTools";
import { ProcessServingTools } from "@/components/services/tools/ProcessServingTools";
import { NotaryTools } from "@/components/services/tools/NotaryTools";
import { InsuranceTools } from "@/components/services/tools/InsuranceTools";
import { EstatePlanningTools } from "@/components/services/tools/EstatePlanningTools";
import { LoanSigningTools } from "@/components/services/tools/LoanSigningTools";
import { BackgroundCheckTools } from "@/components/services/tools/BackgroundCheckTools";
import { MediationTools } from "@/components/services/tools/MediationTools";
import { PhotographyTools } from "@/components/services/tools/PhotographyTools";
import { CourierTools } from "@/components/services/tools/CourierTools";
import { ScrivenerTools } from "@/components/services/tools/ScrivenerTools";
import { SkipTracingTools } from "@/components/services/tools/SkipTracingTools";
import { TaxReferralTools } from "@/components/services/tools/TaxReferralTools";
import { VATasksTools } from "@/components/services/tools/VATasksTools";
import { VitalRecordsTools } from "@/components/services/tools/VitalRecordsTools";
import { IdentityCertificateTools } from "@/components/services/tools/IdentityCertificateTools";
import { I9VerificationTools } from "@/components/services/tools/I9VerificationTools";
import { PowerOfAttorneyTools } from "@/components/services/tools/PowerOfAttorneyTools";
import { OathAdministrationTools } from "@/components/services/tools/OathAdministrationTools";
import type { ServiceAICategory } from "@/lib/serviceAIConfigs";
import { Sparkles, Wrench, LayoutList } from "lucide-react";

export type ExtendedCategory = ServiceAICategory
  | "apostille" | "fingerprinting" | "estate-planning" | "loan-signing"
  | "background-check" | "mediation" | "photography" | "courier"
  | "insurance" | "oath" | "training" | "vital-records"
  | "scrivener" | "skip-tracing" | "tax-referral" | "va-tasks"
  | "permit-filings" | "recorder-filings" | "sos-filings"
  | "identity-certificates" | "certified-copies" | "i9-verification"
  | "power-of-attorney" | "witnesses";

interface DashboardEnhancerProps {
  category: ExtendedCategory;
  children: React.ReactNode;
  showTools?: boolean;
}

const TOOL_COMPONENTS: Partial<Record<ExtendedCategory, React.ComponentType>> = {
  translation: TranslationTools,
  legal: LegalTools,
  notarization: LegalTools,
  content: ContentTools,
  business: BusinessTools,
  immigration: ImmigrationTools,
  research: ResearchTools,
  apostille: ApostilleTools,
  fingerprinting: FingerprintingTools,
  "real-estate": RealEstateTools,
  "court-forms": CourtFormsTools,
  "process-serving": ProcessServingTools,
  insurance: InsuranceTools,
  "estate-planning": EstatePlanningTools,
  "loan-signing": LoanSigningTools,
  "background-check": BackgroundCheckTools,
  mediation: MediationTools,
  photography: PhotographyTools,
  courier: CourierTools,
  // Dedicated tool panels:
  oath: OathAdministrationTools,
  training: NotaryTools,
  "vital-records": VitalRecordsTools,
  scrivener: ScrivenerTools,
  "skip-tracing": SkipTracingTools,
  "tax-referral": TaxReferralTools,
  "va-tasks": VATasksTools,
  "permit-filings": LegalTools,
  "recorder-filings": LegalTools,
  "sos-filings": BusinessTools,
  "identity-certificates": IdentityCertificateTools,
  "certified-copies": NotaryTools,
  "i9-verification": I9VerificationTools,
  "power-of-attorney": PowerOfAttorneyTools,
  witnesses: NotaryTools,
};

/** Map extended categories to AI config categories */
function mapToAICategory(cat: ExtendedCategory): ServiceAICategory {
  const map: Partial<Record<ExtendedCategory, ServiceAICategory>> = {
    apostille: "legal",
    fingerprinting: "verification",
    "estate-planning": "legal",
    "loan-signing": "real-estate",
    "background-check": "verification",
    mediation: "legal",
    photography: "default",
    courier: "default",
    insurance: "business",
    oath: "notarization",
    training: "notarization",
    "vital-records": "notarization",
    scrivener: "legal",
    "skip-tracing": "process-serving",
    "tax-referral": "business",
    "va-tasks": "business",
    "permit-filings": "legal",
    "recorder-filings": "legal",
    "sos-filings": "business",
    "identity-certificates": "notarization",
    "certified-copies": "notarization",
    "i9-verification": "immigration",
    "power-of-attorney": "legal",
    witnesses: "notarization",
  };
  return map[cat] || (cat as ServiceAICategory);
}

export function DashboardEnhancer({ category, children, showTools = true }: DashboardEnhancerProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const ToolComponent = TOOL_COMPONENTS[category];
  const aiCategory = mapToAICategory(category);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="dashboard" className="gap-1.5">
          <LayoutList className="h-3.5 w-3.5" /> Dashboard
        </TabsTrigger>
        <TabsTrigger value="ai-workspace" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> AI Workspace
        </TabsTrigger>
        {showTools && ToolComponent && (
          <TabsTrigger value="tools" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" /> Tools
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="dashboard" className="mt-0">
        {children}
      </TabsContent>

      <TabsContent value="ai-workspace" className="mt-0">
        <AIServiceWorkspace category={aiCategory} />
      </TabsContent>

      {showTools && ToolComponent && (
        <TabsContent value="tools" className="mt-0">
          <ToolComponent />
        </TabsContent>
      )}
    </Tabs>
  );
}
