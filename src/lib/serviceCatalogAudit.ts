/**
 * Sprint F — Service Catalog Reconciliation Utility
 * Compares serviceRegistry.ts entries vs DB `services` table vs App.tsx routes
 * to identify orphans (DB row with no page, page with no registry entry, etc.)
 */
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_REGISTRY } from "@/lib/serviceRegistry";

export interface CatalogAuditReport {
  registryCount: number;
  dbCount: number;
  orphanedDbServices: Array<{ id: string; name: string; slug: string | null }>;
  registryWithoutDb: Array<{ id: string; name: string; slug: string }>;
  missingPricingRules: Array<{ id: string; name: string }>;
  generatedAt: string;
}

export async function auditServiceCatalog(): Promise<CatalogAuditReport> {
  const [{ data: dbServices }, { data: pricingRules }] = await Promise.all([
    supabase.from("services" as any).select("id, name, slug"),
    supabase.from("pricing_rules" as any).select("service_id, service_name"),
  ]);

  const dbList = (dbServices as any[]) || [];
  const priceList = (pricingRules as any[]) || [];
  const registrySlugs = new Set(SERVICE_REGISTRY.map((s) => s.slug));
  const dbSlugs = new Set(dbList.map((s) => s.slug).filter(Boolean));
  const pricedIds = new Set(priceList.map((p) => p.service_id).filter(Boolean));
  const pricedNames = new Set(priceList.map((p) => p.service_name?.toLowerCase()).filter(Boolean));

  const orphanedDbServices = dbList
    .filter((s) => s.slug && !registrySlugs.has(s.slug))
    .map((s) => ({ id: s.id, name: s.name, slug: s.slug }));

  const registryWithoutDb = SERVICE_REGISTRY
    .filter((r) => !dbSlugs.has(r.slug))
    .map((r) => ({ id: r.id, name: r.name, slug: r.slug }));

  const missingPricingRules = dbList
    .filter((s) => !pricedIds.has(s.id) && !pricedNames.has(s.name?.toLowerCase()))
    .map((s) => ({ id: s.id, name: s.name }));

  return {
    registryCount: SERVICE_REGISTRY.length,
    dbCount: dbList.length,
    orphanedDbServices,
    registryWithoutDb,
    missingPricingRules,
    generatedAt: new Date().toISOString(),
  };
}
