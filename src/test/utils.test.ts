import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/formatPhone";

// Item 602: Unit tests for utility functions

describe("cn (className merger)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
  it("handles tailwind merge conflicts", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
  it("handles undefined and null", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });
  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});

describe("formatPhone", () => {
  it("formats 10-digit number", () => {
    expect(formatPhone("6145551234")).toBe("(614) 555-1234");
  });
  it("strips non-digits", () => {
    expect(formatPhone("(614) 555-1234")).toBe("(614) 555-1234");
  });
  it("handles partial numbers", () => {
    expect(formatPhone("614")).toBe("614");
    expect(formatPhone("6145")).toBe("(614) 5");
    expect(formatPhone("614555")).toBe("(614) 555");
    expect(formatPhone("6145551")).toBe("(614) 555-1");
  });
  it("truncates at 10 digits", () => {
    expect(formatPhone("61455512345678")).toBe("(614) 555-1234");
  });
  it("handles empty string", () => {
    expect(formatPhone("")).toBe("");
  });
  it("handles letters mixed with digits", () => {
    expect(formatPhone("abc614def555ghi1234")).toBe("(614) 555-1234");
  });
});
