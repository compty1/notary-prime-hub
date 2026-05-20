import { describe, it, expect } from "vitest";
import { maskPII, maskEmail, maskPhone, maskSSN } from "@/lib/piiMasking";

describe("piiMasking", () => {
  it("maskPII shows last 4 by default", () => {
    expect(maskPII("123456789")).toBe("•••••6789");
  });
  it("maskPII handles short / empty values", () => {
    expect(maskPII("12")).toBe("12");
    expect(maskPII(null)).toBe("");
    expect(maskPII(undefined)).toBe("");
  });
  it("maskEmail preserves domain and first two chars", () => {
    expect(maskEmail("johndoe@example.com")).toBe("jo•••••@example.com");
  });
  it("maskEmail falls back for malformed", () => {
    expect(maskEmail("noatsign")).toBe("••••sign");
  });
  it("maskPhone shows last 4 digits", () => {
    expect(maskPhone("(614) 555-1234")).toBe("(•••) •••-1234");
    expect(maskPhone("")).toBe("");
  });
  it("maskSSN formats with last 4", () => {
    expect(maskSSN("123-45-6789")).toBe("•••-••-6789");
    expect(maskSSN("")).toBe("");
  });
});
