/**
 * Sprint 10: Dashboard enhancement wrapper — adds AI workspace tab + category tools
 * to any existing admin service dashboard.
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
import type { ServiceAICategory } from "@/lib/serviceAIConfigs";
import { Sparkles, Wrench, LayoutList } from "lucide-react";

interface DashboardEnhancerProps {
  category: ServiceAICategory;
  children: React.ReactNode;
  showTools?: boolean;
}

const TOOL_COMPONENTS: Partial<Record<ServiceAICategory, React.ComponentType>> = {
  translation: TranslationTools,
  legal: LegalTools,
  notarization: LegalTools,
  content: ContentTools,
  business: BusinessTools,
  immigration: ImmigrationTools,
  research: ResearchTools,
};

export function DashboardEnhancer({ category, children, showTools = true }: DashboardEnhancerProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const ToolComponent = TOOL_COMPONENTS[category];

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
        <AIServiceWorkspace category={category} />
      </TabsContent>

      {showTools && ToolComponent && (
        <TabsContent value="tools" className="mt-0">
          <ToolComponent />
        </TabsContent>
      )}
    </Tabs>
  );
}
