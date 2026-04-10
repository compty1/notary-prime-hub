import { describe, it, expect } from "vitest";
import {
  isProhibitedForRon, isKbaLimitExceeded, validateOhioFeeCap,
  isCommissionValid, validateSignerInfo, validateSessionPrerequisites,
  MAX_KBA_ATTEMPTS, OHIO_FEE_CAP_PER_ACT
} from "@/lib/ohioRonCompliance";

describe("ohioRonCompliance", () => {
  it("identifies prohibited documents", () => {
    expect(isProhibitedForRon("will")).toBe(true);
    expect(isProhibitedForRon("Last Will and Testament")).toBe(true);
    expect(isProhibitedForRon("birth_certificate")).toBe(true);
    expect(isProhibitedForRon("power_of_attorney")).toBe(false);
    expect(isProhibitedForRon("deed")).toBe(false);
  });

  it("enforces KBA limits", () => {
    expect(isKbaLimitExceeded(1)).toBe(false);
    expect(isKbaLimitExceeded(2)).toBe(false);
    expect(isKbaLimitExceeded(3)).toBe(true);
    expect(MAX_KBA_ATTEMPTS).toBe(2);
  });

  it("validates Ohio fee cap", () => {
    expect(validateOhioFeeCap(5, 1).valid).toBe(true);
    expect(validateOhioFeeCap(10, 2).valid).toBe(true);
    expect(validateOhioFeeCap(6, 1).valid).toBe(false);
    expect(OHIO_FEE_CAP_PER_ACT).toBe(5);
  });

  it("checks commission validity", () => {
    expect(isCommissionValid("2030-01-01")).toBe(true);
    expect(isCommissionValid("2020-01-01")).toBe(false);
  });

  it("validates signer info", () => {
    expect(validateSignerInfo({ name: "John Doe", address: "123 Main St", idType: "DL", idNumber: "12345" })).toHaveLength(0);
    expect(validateSignerInfo({})).toContain("Signer name is required");
  });

  it("validates session prerequisites", () => {
    const errors = validateSessionPrerequisites({
      recordingConsent: false,
      esignConsent: false,
      kbaCompleted: false,
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain("Recording consent is required per ORC §147.63");

    const noErrors = validateSessionPrerequisites({
      recordingConsent: true,
      esignConsent: true,
      kbaCompleted: true,
      kbaAttempts: 1,
    });
    expect(noErrors).toHaveLength(0);
  });
});
