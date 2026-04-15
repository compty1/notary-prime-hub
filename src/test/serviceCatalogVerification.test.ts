/**
 * Sprint 11: Service Catalog Verification
 * Ensures all services in both registries have:
 * - Valid routing paths
 * - Required fields defined
 * - Matching flow configs where applicable
 * - No duplicate IDs or slugs
 */
import { describe, it, expect } from "vitest";
import { SERVICE_REGISTRY } from "@/lib/serviceRegistry";
import { EXTENDED_SERVICES } from "@/lib/extendedServiceRegistry";
import { SERVICE_FLOWS } from "@/lib/serviceFlowConfig";
import { CATEGORY_LABELS } from "@/lib/serviceConstants";

const ALL_SERVICES = [...SERVICE_REGISTRY, ...EXTENDED_SERVICES];

describe("Service Catalog Verification (Sprint 11)", () => {
  it("has at least 57 total services", () => {
    expect(ALL_SERVICES.length).toBeGreaterThanOrEqual(57);
  });

  it("has no duplicate service IDs", () => {
    const ids = ALL_SERVICES.map(s => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("has no duplicate slugs", () => {
    const slugs = ALL_SERVICES.map(s => s.slug);
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(dupes).toEqual([]);
  });

  it("every service has a valid path starting with /", () => {
    ALL_SERVICES.forEach(s => {
      expect(s.path).toMatch(/^\//);
    });
  });

  it("every service has a non-empty name and description", () => {
    ALL_SERVICES.forEach(s => {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    });
  });

  it("every service category has a label in CATEGORY_LABELS", () => {
    const categories = new Set(ALL_SERVICES.map(s => s.category));
    categories.forEach(cat => {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
    });
  });

  it("notary-required services have idRequired=true", () => {
    ALL_SERVICES.filter(s => s.requiresNotary).forEach(s => {
      expect(s.idRequired).toBe(true);
    });
  });

  it("RON-available services have notary required", () => {
    ALL_SERVICES.filter(s => s.ronAvailable).forEach(s => {
      expect(s.requiresNotary).toBe(true);
    });
  });

  it("core booking services have flow configs", () => {
    const bookingServices = SERVICE_REGISTRY.filter(s => s.path === "/book");
    bookingServices.forEach(s => {
      expect(SERVICE_FLOWS[s.id]).toBeDefined();
    });
  });
});
