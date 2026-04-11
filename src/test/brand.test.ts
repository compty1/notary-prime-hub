import { describe, it, expect } from "vitest";
import { BRAND } from "@/lib/brand";

describe("BRAND constants", () => {
  it("has correct brand name", () => {
    expect(BRAND.name).toBe("Notar");
  });

  it("generates correct footer text", () => {
    expect(BRAND.footerText(2026)).toContain("2026");
    expect(BRAND.footerText(2026)).toContain("Notar");
  });

  it("generates correct calendar description for RON", () => {
    expect(BRAND.calendarDescription("ron")).toContain("Remote Online Notarization");
  });

  it("generates correct calendar description for in-person", () => {
    expect(BRAND.calendarDescription("in_person")).toContain("In-person notarization");
  });

  it("has valid contact info", () => {
    expect(BRAND.defaultEmail).toContain("@");
    expect(BRAND.defaultPhone).toMatch(/\(\d{3}\)\s\d{3}-\d{4}/);
  });

  it("has team lead info", () => {
    expect(BRAND.teamLead.name).toBeTruthy();
    expect(BRAND.teamLead.title).toBeTruthy();
  });
});
