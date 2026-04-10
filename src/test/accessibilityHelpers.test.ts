import { describe, it, expect } from "vitest";
import { getErrorId, phoneForScreenReader, prefersReducedMotion, MAIN_CONTENT_ID } from "@/lib/accessibilityHelpers";

describe("accessibilityHelpers", () => {
  it("generates correct error IDs for form fields", () => {
    expect(getErrorId("email")).toBe("email-error");
    expect(getErrorId("full_name")).toBe("full_name-error");
    expect(getErrorId("")).toBe("-error");
  });

  it("MAIN_CONTENT_ID is the expected value", () => {
    expect(MAIN_CONTENT_ID).toBe("main-content");
  });

  it("formats phone numbers for screen readers", () => {
    expect(phoneForScreenReader("(614) 300-6890")).toBe("6 1 4 3 0 0 6 8 9 0");
    expect(phoneForScreenReader("555-1234")).toBe("5 5 5 1 2 3 4");
    expect(phoneForScreenReader("")).toBe("");
  });

  it("prefersReducedMotion returns boolean", () => {
    const result = prefersReducedMotion();
    expect(typeof result).toBe("boolean");
  });
});
