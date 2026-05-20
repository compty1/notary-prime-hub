import { describe, it, expect } from "vitest";
import { isValidUSPhone, formatUSPhone, getPhoneError } from "@/lib/phoneValidation";

describe("phoneValidation", () => {
  it("validates US phone formats", () => {
    expect(isValidUSPhone("(614) 555-1234")).toBe(true);
    expect(isValidUSPhone("614-555-1234")).toBe(true);
    expect(isValidUSPhone("6145551234")).toBe(true);
    expect(isValidUSPhone("+1 614 555 1234")).toBe(true);
  });
  it("rejects invalid phones", () => {
    expect(isValidUSPhone("123")).toBe(false);
    expect(isValidUSPhone("1145551234")).toBe(false); // area starts with 1
    expect(isValidUSPhone("abcdefghij")).toBe(false);
  });
  it("normalizes via formatUSPhone", () => {
    expect(formatUSPhone("6145551234")).toBe("(614) 555-1234");
    expect(formatUSPhone("not-a-phone")).toBe("not-a-phone");
  });
  it("getPhoneError returns null for empty/valid", () => {
    expect(getPhoneError("")).toBeNull();
    expect(getPhoneError("(614) 555-1234")).toBeNull();
  });
  it("getPhoneError returns message for invalid", () => {
    expect(getPhoneError("bad")).toMatch(/valid US phone/i);
  });
});
