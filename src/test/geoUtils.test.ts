import { describe, it, expect } from "vitest";
import { haversineDistance, isAfterHours, getAfterHoursFee, DEFAULT_OFFICE_LAT, DEFAULT_OFFICE_LON } from "@/lib/geoUtils";

describe("haversineDistance", () => {
  it("returns 0 for same point", () => {
    expect(haversineDistance(40, -83, 40, -83)).toBe(0);
  });

  it("calculates Columbus to Cleveland correctly (~130 mi)", () => {
    const dist = haversineDistance(39.9612, -82.9988, 41.4993, -81.6944);
    expect(dist).toBeGreaterThan(120);
    expect(dist).toBeLessThan(140);
  });

  it("calculates short distance accurately", () => {
    // ~10 miles offset
    const dist = haversineDistance(DEFAULT_OFFICE_LAT, DEFAULT_OFFICE_LON, DEFAULT_OFFICE_LAT + 0.145, DEFAULT_OFFICE_LON);
    expect(dist).toBeGreaterThan(9);
    expect(dist).toBeLessThan(11);
  });
});

describe("isAfterHours", () => {
  it("returns false for business hours (9am-6pm)", () => {
    expect(isAfterHours("09:00")).toBe(false);
    expect(isAfterHours("12:00")).toBe(false);
    expect(isAfterHours("17:59")).toBe(false);
  });

  it("returns true for before 9am", () => {
    expect(isAfterHours("08:00")).toBe(true);
    expect(isAfterHours("06:30")).toBe(true);
  });

  it("returns true for 6pm and later", () => {
    expect(isAfterHours("18:00")).toBe(true);
    expect(isAfterHours("22:00")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isAfterHours("")).toBe(false);
  });
});

describe("getAfterHoursFee", () => {
  it("returns 0 during business hours", () => {
    expect(getAfterHoursFee("10:00", 25)).toBe(0);
  });

  it("returns base fee for evening hours (6pm-10pm)", () => {
    expect(getAfterHoursFee("19:00", 25)).toBe(25);
  });

  it("returns 3x base fee for emergency hours (10pm-9am)", () => {
    expect(getAfterHoursFee("23:00", 25)).toBe(75);
    expect(getAfterHoursFee("03:00", 25)).toBe(75);
  });

  it("returns 0 for empty string", () => {
    expect(getAfterHoursFee("", 25)).toBe(0);
  });
});
