/**
 * Sprint 9: Category Tool Panels barrel export
 */
export { TranslationTools } from "./TranslationTools";
export { LegalTools } from "./LegalTools";
export { ContentTools } from "./ContentTools";
export { BusinessTools } from "./BusinessTools";
export { ImmigrationTools } from "./ImmigrationTools";
export { ResearchTools } from "./ResearchTools";

import type { ServiceAICategory } from "@/lib/serviceAIConfigs";

export function getCategoryToolPanel(category: ServiceAICategory): React.ComponentType | null {
  const map: Partial<Record<ServiceAICategory, () => Promise<{ default?: React.ComponentType; [key: string]: any }>>> = {
    translation: () => import("./TranslationTools").then(m => ({ default: m.TranslationTools })),
    legal: () => import("./LegalTools").then(m => ({ default: m.LegalTools })),
    notarization: () => import("./LegalTools").then(m => ({ default: m.LegalTools })),
    content: () => import("./ContentTools").then(m => ({ default: m.ContentTools })),
    business: () => import("./BusinessTools").then(m => ({ default: m.BusinessTools })),
    immigration: () => import("./ImmigrationTools").then(m => ({ default: m.ImmigrationTools })),
    research: () => import("./ResearchTools").then(m => ({ default: m.ResearchTools })),
  };
  return null; // Use the map via lazy loading if needed
}

/** Static map for direct rendering */
export const CATEGORY_TOOL_COMPONENTS: Partial<Record<ServiceAICategory, React.ComponentType>> = {};

// Will be populated at import time via the individual exports above
