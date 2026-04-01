import { describe, it, expect } from "vitest";
import { NOTARY_CATEGORIES, INTAKE_ONLY_SERVICES, SAAS_LINKS, SUBSCRIPTION_SERVICES } from "@/lib/serviceConstants";

describe("serviceConstants", () => {
  it("NOTARY_CATEGORIES includes notarization", () => {
    expect(NOTARY_CATEGORIES.has("notarization")).toBe(true);
    expect(NOTARY_CATEGORIES.has("authentication")).toBe(true);
  });

  it("INTAKE_ONLY_SERVICES is a non-empty Set", () => {
    expect(INTAKE_ONLY_SERVICES.size).toBeGreaterThan(0);
    expect(INTAKE_ONLY_SERVICES.has("Apostille Facilitation")).toBe(true);
  });

  it("SAAS_LINKS maps to valid routes", () => {
    Object.values(SAAS_LINKS).forEach(route => {
      expect(route).toMatch(/^\//);
    });
  });

  it("SUBSCRIPTION_SERVICES is a Set", () => {
    expect(SUBSCRIPTION_SERVICES).toBeInstanceOf(Set);
  });
});
