import { describe, it, expect } from "vitest";
import { calculatePrice, DEFAULT_SETTINGS, parseSettings } from "@/lib/pricingEngine";

describe("calculatePrice", () => {
  it("calculates basic in-person notarization", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1 },
      DEFAULT_SETTINGS
    );
    expect(result.notarizationFees).toBe(5);
    expect(result.ronFees).toBe(0);
    expect(result.total).toBe(5);
  });

  it("calculates RON with platform + KBA fees", () => {
    const result = calculatePrice(
      { notarizationType: "ron", documentCount: 1 },
      DEFAULT_SETTINGS
    );
    expect(result.ronFees).toBe(40); // 25 + 15
    expect(result.total).toBe(45); // 5 + 40
  });

  it("applies travel fee for in-person > 5 miles", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, travelMiles: 20 },
      DEFAULT_SETTINGS
    );
    expect(result.travelFee).toBe(Math.max(25, 20 * 0.655));
  });

  it("waives travel fee for < 5 miles", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, travelMiles: 3 },
      DEFAULT_SETTINGS
    );
    expect(result.travelFee).toBe(0);
  });

  it("applies rush and after-hours fees", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, isRush: true, isAfterHours: true },
      DEFAULT_SETTINGS
    );
    expect(result.rushFee).toBe(35);
    expect(result.afterHoursFee).toBe(25);
  });

  it("applies volume discount at 10+ acts", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 10 },
      DEFAULT_SETTINGS
    );
    expect(result.notarizationFees).toBe(10 * 5 * 0.9);
  });

  it("applies volume discount at 20+ acts", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 20 },
      DEFAULT_SETTINGS
    );
    expect(result.notarizationFees).toBe(20 * 5 * 0.8);
  });

  it("calculates percentage promo discount", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, promoDiscount: 50, promoType: "percentage" },
      DEFAULT_SETTINGS
    );
    expect(result.discount).toBe(2.5);
    expect(result.total).toBe(2.5);
  });

  it("calculates flat promo discount", () => {
    const result = calculatePrice(
      { notarizationType: "ron", documentCount: 1, promoDiscount: 10, promoType: "flat" },
      DEFAULT_SETTINGS
    );
    expect(result.discount).toBe(10);
  });

  it("calculates 25% deposit", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 4 },
      DEFAULT_SETTINGS
    );
    expect(result.deposit).toBe(Math.round(result.total * 0.25 * 100) / 100);
  });

  it("caps document count at 50", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 100 },
      DEFAULT_SETTINGS
    );
    // Should treat as 50 docs
    expect(result.notarizationFees).toBeLessThanOrEqual(50 * 5);
  });

  it("handles multi-signer pricing (signers × docs)", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 2, signerCount: 3 },
      DEFAULT_SETTINGS
    );
    // 2 docs × 3 signers = 6 acts × $5 = $30
    expect(result.notarizationFees).toBe(30);
  });
});

describe("parseSettings", () => {
  it("parses string values to numbers", () => {
    const result = parseSettings({ base_fee_per_signature: "10", travel_fee_minimum: "30" });
    expect(result.base_fee_per_signature).toBe(10);
    expect(result.travel_fee_minimum).toBe(30);
  });

  it("falls back to defaults for missing keys", () => {
    const result = parseSettings({});
    expect(result.base_fee_per_signature).toBe(DEFAULT_SETTINGS.base_fee_per_signature);
  });
});
