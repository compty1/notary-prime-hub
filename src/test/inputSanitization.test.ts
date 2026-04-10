import { describe, it, expect } from "vitest";
import { sanitizeInput, sanitizeEmail, sanitizePhone, isValidUUID, sanitizeUrl } from "@/lib/inputSanitization";

describe("inputSanitization", () => {
  it("strips HTML tags", () => {
    expect(sanitizeInput("<script>alert('xss')</script>hello")).toBe("hello");
  });

  it("strips control characters", () => {
    expect(sanitizeInput("hello\x00world")).toBe("helloworld");
  });

  it("enforces max length", () => {
    expect(sanitizeInput("a".repeat(2000), 100).length).toBe(100);
  });

  it("strips javascript: protocol", () => {
    expect(sanitizeInput("javascript:alert(1)")).toBe("alert(1)");
  });

  it("strips event handlers", () => {
    expect(sanitizeInput('onerror=alert(1)')).toBe("alert(1)");
  });

  it("sanitizes email", () => {
    expect(sanitizeEmail("  USER@Example.COM  ")).toBe("user@example.com");
  });

  it("sanitizes phone", () => {
    expect(sanitizePhone("(614) 300-6890")).toBe("(614) 300-6890");
    expect(sanitizePhone("614<script>300")).toBe("614300");
  });

  it("validates UUID", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUUID("not-a-uuid")).toBe(false);
  });

  it("sanitizes URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("ftp://example.com")).toBe("");
  });
});
