import { describe, it, expect } from "vitest";
import {
  bookingReducer,
  INITIAL_BOOKING_STATE,
  nextStep,
  prevStep,
  BOOKING_STEPS,
} from "@/lib/booking/bookingReducer";
import { buildIcs } from "@/lib/booking/icsExport";

describe("bookingReducer", () => {
  it("sets service and recalculates total", () => {
    const s = bookingReducer(INITIAL_BOOKING_STATE, {
      type: "SET_SERVICE",
      serviceType: "ron",
      notarizationType: "remote_online",
      basePrice: 25,
    });
    expect(s.serviceType).toBe("ron");
    expect(s.totalPrice).toBe(25);
  });

  it("toggles add-ons additively and removes on second toggle", () => {
    let s = bookingReducer(INITIAL_BOOKING_STATE, {
      type: "SET_SERVICE", serviceType: "ron", notarizationType: "remote_online", basePrice: 10,
    });
    s = bookingReducer(s, { type: "TOGGLE_ADDON", addonId: "apostille", price: 50 });
    expect(s.totalPrice).toBe(60);
    s = bookingReducer(s, { type: "TOGGLE_ADDON", addonId: "apostille", price: 50 });
    expect(s.totalPrice).toBe(10);
    expect(s.selectedAddons).toHaveLength(0);
  });

  it("transitions through steps", () => {
    expect(nextStep("service")).toBe("datetime");
    expect(prevStep("datetime")).toBe("service");
    expect(nextStep("confirmation")).toBe("confirmation"); // clamps
    expect(prevStep("service")).toBe("service"); // clamps
    expect(BOOKING_STEPS).toContain("payment");
  });

  it("captures submission lifecycle", () => {
    let s = bookingReducer(INITIAL_BOOKING_STATE, { type: "SUBMIT_START" });
    expect(s.submitting).toBe(true);
    s = bookingReducer(s, { type: "SUBMIT_SUCCESS", confirmationNumber: "NTR-123" });
    expect(s.confirmationNumber).toBe("NTR-123");
    expect(s.step).toBe("confirmation");
  });
});

describe("icsExport", () => {
  it("generates valid iCalendar text", () => {
    const ics = buildIcs({
      uid: "abc-123",
      title: "Notary Appointment",
      date: "2026-05-01",
      time: "14:30",
      durationMinutes: 60,
      location: "Online",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20260501T143000");
    expect(ics).toContain("DTEND:20260501T153000");
    expect(ics).toContain("SUMMARY:Notary Appointment");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("escapes commas and newlines in description", () => {
    const ics = buildIcs({
      uid: "x",
      title: "T",
      date: "2026-05-01",
      time: "10:00",
      description: "Line1\nLine2, with comma",
    });
    expect(ics).toContain("Line1\\nLine2\\, with comma");
  });
});
