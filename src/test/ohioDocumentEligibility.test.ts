import { describe, it, expect } from "vitest";
import { checkDocumentEligibility, getSessionGuide } from "@/lib/ohioDocumentEligibility";

describe("checkDocumentEligibility", () => {
  it("blocks birth certificates as vital records", () => {
    const result = checkDocumentEligibility("Birth Certificate");
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("vital records");
  });

  it("blocks death certificates", () => {
    const result = checkDocumentEligibility("Death Certificate");
    expect(result.eligible).toBe(false);
  });

  it("blocks court orders", () => {
    const result = checkDocumentEligibility("Court Order");
    expect(result.eligible).toBe(false);
  });

  it("allows standard affidavit", () => {
    const result = checkDocumentEligibility("Affidavit of Identity");
    expect(result.eligible).toBe(true);
    expect(result.oathType).toBe("jurat");
  });

  it("allows power of attorney with warning", () => {
    const result = checkDocumentEligibility("Power of Attorney");
    expect(result.eligible).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("requires 2 witnesses for wills", () => {
    const result = checkDocumentEligibility("Last Will and Testament");
    expect(result.witnessCount).toBe(2);
    expect(result.ronEligible).toBe(false);
  });

  it("requires 2 witnesses for living wills", () => {
    const result = checkDocumentEligibility("Living Will");
    expect(result.witnessCount).toBe(2);
  });

  it("requires 1 witness for healthcare POA", () => {
    const result = checkDocumentEligibility("Healthcare Power of Attorney");
    expect(result.witnessCount).toBe(1);
  });

  it("sets acknowledgment as default oath type", () => {
    const result = checkDocumentEligibility("Deed");
    expect(result.oathType).toBe("acknowledgment");
  });

  it("handles empty input gracefully", () => {
    const result = checkDocumentEligibility("");
    expect(result.eligible).toBe(true);
    expect(result.oathType).toBe("acknowledgment");
  });
});

describe("getSessionGuide", () => {
  it("includes recording disclosure for RON sessions", () => {
    const guide = getSessionGuide({
      documentType: "Deed",
      notarizationType: "ron",
      signerCount: 1,
      hasWitnesses: false,
      witnessCount: 0,
    });
    expect(guide.steps.some(s => s.label === "Recording Disclosure")).toBe(true);
  });

  it("omits recording disclosure for in-person sessions", () => {
    const guide = getSessionGuide({
      documentType: "Deed",
      notarizationType: "in_person",
      signerCount: 1,
      hasWitnesses: false,
      witnessCount: 0,
    });
    expect(guide.steps.some(s => s.label === "Recording Disclosure")).toBe(false);
  });

  it("adds multi-signer step when signerCount > 1", () => {
    const guide = getSessionGuide({
      documentType: "Deed",
      notarizationType: "in_person",
      signerCount: 3,
      hasWitnesses: false,
      witnessCount: 0,
    });
    expect(guide.steps.some(s => s.label.includes("3 Signers"))).toBe(true);
  });

  it("adds capacity verification step for representative signing", () => {
    const guide = getSessionGuide({
      documentType: "Trust Agreement",
      notarizationType: "in_person",
      signerCount: 1,
      signingCapacity: "trustee",
      hasWitnesses: false,
      witnessCount: 0,
    });
    expect(guide.steps.some(s => s.label.includes("Signing Capacity"))).toBe(true);
  });
});
