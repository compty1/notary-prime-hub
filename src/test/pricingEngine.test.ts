import { describe, it, expect } from "vitest";
import { calculatePrice, DEFAULT_SETTINGS, parseSettings, getZoneFromMiles, getZoneTravelFee } from "@/lib/pricingEngine";

describe("getZoneFromMiles", () => {
  it("returns zone 1 for ≤15 miles", () => expect(getZoneFromMiles(10)).toBe(1));
  it("returns zone 2 for 15-30 miles", () => expect(getZoneFromMiles(25)).toBe(2));
  it("returns zone 3 for 30-45 miles", () => expect(getZoneFromMiles(40)).toBe(3));
  it("returns zone 4 for >45 miles", () => expect(getZoneFromMiles(60)).toBe(4));
});

describe("getZoneTravelFee", () => {
  it("waives travel under threshold", () => {
    expect(getZoneTravelFee(1, 3, DEFAULT_SETTINGS)).toBe(0);
  });
  it("charges zone 1 fee", () => {
    expect(getZoneTravelFee(1, 10, DEFAULT_SETTINGS)).toBe(25);
  });
  it("charges zone 2 fee", () => {
    expect(getZoneTravelFee(2, 20, DEFAULT_SETTINGS)).toBe(40);
  });
  it("charges zone 4 with per-mile beyond 45", () => {
    expect(getZoneTravelFee(4, 60, DEFAULT_SETTINGS)).toBe(55 + 15 * 1.5);
  });
});

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

  it("calculates RON with per-act + tech fees", () => {
    const result = calculatePrice(
      { notarizationType: "ron", documentCount: 1 },
      DEFAULT_SETTINGS
    );
    expect(result.ronFees).toBe(40); // 30/act + 10 tech
    expect(result.total).toBe(45); // 5 notarization + 40 RON
  });

  it("applies zone-based travel for in-person", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, travelMiles: 20 },
      DEFAULT_SETTINGS
    );
    expect(result.travelZone).toBe(2);
    expect(result.travelFee).toBe(40); // zone 2
  });

  it("waives travel for < 5 miles", () => {
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
    expect(result.rushFee).toBe(25);
    expect(result.afterHoursFee).toBe(35);
  });

  it("applies holiday surcharge", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, isHoliday: true },
      DEFAULT_SETTINGS
    );
    expect(result.holidayFee).toBe(50);
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

  it("calculates facility surcharge for jail", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, facilityType: "jail", travelMiles: 10 },
      DEFAULT_SETTINGS
    );
    expect(result.facilitySurcharge).toBe(75);
  });

  it("calculates hospital surcharge", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, facilityType: "hospital" },
      DEFAULT_SETTINGS
    );
    expect(result.facilitySurcharge).toBe(20);
  });

  it("calculates loan signing standard package", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, isLoanSigning: true, loanPackage: "standard" },
      DEFAULT_SETTINGS
    );
    expect(result.loanSigningFee).toBe(125);
    expect(result.notarizationFees).toBe(0); // included in package
  });

  it("calculates loan signing reverse mortgage", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, isLoanSigning: true, loanPackage: "reverse_mortgage" },
      DEFAULT_SETTINGS
    );
    expect(result.loanSigningFee).toBe(175);
  });

  it("calculates add-on fees", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, needsPOA: true, needsScanback: true, needsCourier: true },
      DEFAULT_SETTINGS
    );
    expect(result.addOnFees).toBe(25 + 15 + 25); // POA + scanback + courier
  });

  it("calculates estate plan bundle", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 5, isEstatePlanBundle: true },
      DEFAULT_SETTINGS
    );
    expect(result.addOnFees).toBe(100);
  });

  it("calculates I-9 verification add-on", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, needsI9: true },
      DEFAULT_SETTINGS
    );
    expect(result.addOnFees).toBe(45);
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
    expect(result.notarizationFees).toBeLessThanOrEqual(50 * 5);
  });

  it("handles multi-signer pricing (signers × docs)", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 2, signerCount: 3 },
      DEFAULT_SETTINGS
    );
    expect(result.notarizationFees).toBe(30);
  });

  it("witness fee is $15/witness", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, witnessCount: 2 },
      DEFAULT_SETTINGS
    );
    expect(result.witnessFee).toBe(30);
  });

  it("apostille fee is $175", () => {
    const result = calculatePrice(
      { notarizationType: "in_person", documentCount: 1, needsApostille: true },
      DEFAULT_SETTINGS
    );
    expect(result.apostilleFee).toBe(175);
  });
});

describe("parseSettings", () => {
  it("parses string values to numbers", () => {
    const result = parseSettings({ base_fee_per_signature: "10", zone1_fee: "30" });
    expect(result.base_fee_per_signature).toBe(10);
    expect(result.zone1_fee).toBe(30);
  });

  it("falls back to defaults for missing keys", () => {
    const result = parseSettings({});
    expect(result.base_fee_per_signature).toBe(DEFAULT_SETTINGS.base_fee_per_signature);
    expect(result.ron_per_act_fee).toBe(30);
    expect(result.witness_fee).toBe(15);
  });
});
