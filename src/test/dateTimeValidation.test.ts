import { describe, it, expect } from "vitest";
import {
  isWithinBusinessHours,
  isAfterHours,
  AFTER_HOURS_FEE,
} from "@/lib/dateTimeValidation";

describe("dateTimeValidation", () => {
  describe("isWithinBusinessHours", () => {
    it("returns true for weekday during hours", () => {
      // Wednesday
      const wed = new Date(2026, 3, 15); // April 15 2026 is a Wednesday
      expect(isWithinBusinessHours(wed, "10:00")).toBe(true);
      expect(isWithinBusinessHours(wed, "18:00")).toBe(true);
    });

    it("returns false for weekday outside hours", () => {
      const wed = new Date(2026, 3, 15);
      expect(isWithinBusinessHours(wed, "07:00")).toBe(false);
      expect(isWithinBusinessHours(wed, "19:00")).toBe(false);
    });

    it("returns false for Sunday", () => {
      const sun = new Date(2026, 3, 12); // April 12 2026 is a Sunday
      expect(isWithinBusinessHours(sun, "12:00")).toBe(false);
    });

    it("returns true for Saturday during hours", () => {
      const sat = new Date(2026, 3, 11);
      expect(isWithinBusinessHours(sat, "11:00")).toBe(true);
    });

    it("returns false for Saturday outside hours", () => {
      const sat = new Date(2026, 3, 11);
      expect(isWithinBusinessHours(sat, "16:00")).toBe(false);
    });
  });

  describe("isAfterHours", () => {
    it("returns true when outside business hours", () => {
      const sun = new Date(2026, 3, 12);
      expect(isAfterHours(sun, "12:00")).toBe(true);
    });

    it("returns false during business hours", () => {
      const wed = new Date(2026, 3, 15);
      expect(isAfterHours(wed, "12:00")).toBe(false);
    });
  });

  describe("AFTER_HOURS_FEE", () => {
    it("is $25", () => {
      expect(AFTER_HOURS_FEE).toBe(25);
    });
  });
});
