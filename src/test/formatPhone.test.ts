import { describe, it, expect } from "vitest";
import { formatPhone } from "@/lib/formatPhone";

describe("formatPhone", () => {
  it("returns digits as-is for less than 4 digits", () => {
    expect(formatPhone("12")).toBe("12");
    expect(formatPhone("614")).toBe("614");
  });
  it("formats 4-6 digits with area code", () => {
    expect(formatPhone("6145")).toBe("(614) 5");
    expect(formatPhone("614555")).toBe("(614) 555");
  });
  it("formats 10 digits fully", () => {
    expect(formatPhone("6145551234")).toBe("(614) 555-1234");
  });
  it("strips non-digit characters", () => {
    expect(formatPhone("(614) 555-1234")).toBe("(614) 555-1234");
    expect(formatPhone("614.555.1234")).toBe("(614) 555-1234");
  });
  it("truncates beyond 10 digits", () => {
    expect(formatPhone("61455512349999")).toBe("(614) 555-1234");
  });
  it("handles empty string", () => {
    expect(formatPhone("")).toBe("");
  });
});
