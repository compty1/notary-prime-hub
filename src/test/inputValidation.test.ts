import { describe, it, expect } from "vitest";
import { sanitizeInput, validateLength, MAX_LENGTHS } from "@/lib/inputValidation";

describe("inputValidation", () => {
  describe("sanitizeInput", () => {
    it("trims whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });
    it("strips HTML tags", () => {
      expect(sanitizeInput("<script>alert(1)</script>hello")).toBe("alert(1)hello");
    });
    it("returns empty string for null/undefined", () => {
      expect(sanitizeInput(null as unknown as string)).toBe("");
      expect(sanitizeInput(undefined as unknown as string)).toBe("");
    });
  });

  describe("validateLength", () => {
    it("passes for strings within max length", () => {
      expect(validateLength("hello", 10)).toBe(true);
    });
    it("fails for strings exceeding max length", () => {
      expect(validateLength("a".repeat(256), 255)).toBe(false);
    });
    it("passes for exactly max length", () => {
      expect(validateLength("a".repeat(100), 100)).toBe(true);
    });
  });

  describe("MAX_LENGTHS", () => {
    it("has expected field limits", () => {
      expect(MAX_LENGTHS.name).toBeGreaterThan(0);
      expect(MAX_LENGTHS.email).toBe(255);
    });
  });
});
