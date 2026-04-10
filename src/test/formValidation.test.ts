import { describe, it, expect } from "vitest";
import { isValidEmail, isValidPhone, isValidName, isOhioZipCode, isValidConfirmationNumber, isValidDate, isValidTime } from "@/lib/formValidation";

describe("formValidation", () => {
  it("validates emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("bad@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("validates US phone numbers", () => {
    expect(isValidPhone("(614) 300-6890")).toBe(true);
    expect(isValidPhone("6143006890")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });

  it("validates names", () => {
    expect(isValidName("John Doe")).toBe(true);
    expect(isValidName("O'Brien")).toBe(true);
    expect(isValidName("Smith-Jones")).toBe(true);
    expect(isValidName("A")).toBe(false);
  });

  it("validates Ohio zip codes", () => {
    expect(isOhioZipCode("43215")).toBe(true);
    expect(isOhioZipCode("10001")).toBe(false);
  });

  it("validates confirmation numbers", () => {
    expect(isValidConfirmationNumber("NTR-20260410-a1b2c3")).toBe(true);
    expect(isValidConfirmationNumber("ABC-123")).toBe(false);
  });

  it("validates dates", () => {
    expect(isValidDate("2026-04-10")).toBe(true);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("not-a-date")).toBe(false);
  });

  it("validates times", () => {
    expect(isValidTime("09:30")).toBe(true);
    expect(isValidTime("25:00")).toBe(false);
  });
});
