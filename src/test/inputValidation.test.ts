import { describe, it, expect } from "vitest";
import { validatePhone, validateZipCode, validateEmail, validateFutureDate, validatePaymentAmount, validateTextLength, roundCurrency } from "@/lib/inputValidation";

describe("inputValidation", () => {
  describe("validatePhone", () => {
    it("accepts valid US phone", () => {
      expect(validatePhone("(614) 300-6890").valid).toBe(true);
    });
    it("rejects short numbers", () => {
      expect(validatePhone("123").valid).toBe(false);
    });
    it("rejects empty", () => {
      expect(validatePhone("").valid).toBe(false);
    });
  });

  describe("validateZipCode", () => {
    it("accepts 5-digit zip", () => {
      expect(validateZipCode("43215").valid).toBe(true);
    });
    it("accepts zip+4", () => {
      expect(validateZipCode("43215-1234").valid).toBe(true);
    });
    it("rejects invalid", () => {
      expect(validateZipCode("abc").valid).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("accepts valid email", () => {
      expect(validateEmail("test@example.com").valid).toBe(true);
    });
    it("rejects missing @", () => {
      expect(validateEmail("testexample.com").valid).toBe(false);
    });
  });

  describe("validateFutureDate", () => {
    it("rejects past dates", () => {
      expect(validateFutureDate("2020-01-01").valid).toBe(false);
    });
    it("accepts future dates", () => {
      expect(validateFutureDate("2030-12-31").valid).toBe(true);
    });
  });

  describe("validatePaymentAmount", () => {
    it("accepts positive amounts", () => {
      expect(validatePaymentAmount(25).valid).toBe(true);
    });
    it("rejects zero", () => {
      expect(validatePaymentAmount(0).valid).toBe(false);
    });
    it("rejects negative", () => {
      expect(validatePaymentAmount(-5).valid).toBe(false);
    });
    it("rejects NaN", () => {
      expect(validatePaymentAmount(NaN).valid).toBe(false);
    });
  });

  describe("validateTextLength", () => {
    it("passes within limit", () => {
      expect(validateTextLength("hello", 10).valid).toBe(true);
    });
    it("fails over limit", () => {
      expect(validateTextLength("a".repeat(256), 255, "Name").valid).toBe(false);
    });
  });

  describe("roundCurrency", () => {
    it("rounds to 2 decimal places", () => {
      expect(roundCurrency(10.999)).toBe(11);
      expect(roundCurrency(5.555)).toBe(5.56);
      expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    });
  });
});
