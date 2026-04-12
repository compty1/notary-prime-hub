import { describe, it, expect } from "vitest";
import {
  validateTransition,
  getAvailableTransitions,
  STATUS_LABELS,
} from "@/lib/appointmentStateMachine";

describe("appointmentStateMachine", () => {
  describe("validateTransition", () => {
    it("allows client to submit a draft", () => {
      const result = validateTransition("draft", "submitted", "client");
      expect(result.valid).toBe(true);
      expect(result.sideEffects).toContain("email_notary_assignment");
    });

    it("blocks client from approving a submission", () => {
      const result = validateTransition("in_review", "approved", "client");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not authorized");
    });

    it("requires reason for rejection", () => {
      const result = validateTransition("in_review", "rejected", "admin");
      expect(result.valid).toBe(false);
      expect(result.requiresReason).toBe(true);
    });

    it("allows rejection with reason", () => {
      const result = validateTransition("in_review", "rejected", "admin", "Documents incomplete");
      expect(result.valid).toBe(true);
    });

    it("blocks transitions from terminal states", () => {
      const result = validateTransition("archived", "draft", "admin");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("terminal state");
    });

    it("blocks invalid target status", () => {
      const result = validateTransition("draft", "completed", "admin");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Valid targets");
    });

    it("allows notary to refuse in-progress with reason", () => {
      const result = validateTransition("in_progress", "refused", "notary", "Signer appeared coerced");
      expect(result.valid).toBe(true);
    });

    it("blocks admin from refusing (notary only)", () => {
      const result = validateTransition("in_progress", "refused", "admin", "test");
      expect(result.valid).toBe(false);
    });
  });

  describe("getAvailableTransitions", () => {
    it("returns correct transitions for draft/client", () => {
      const transitions = getAvailableTransitions("draft", "client");
      expect(transitions).toContain("submitted");
      expect(transitions).toContain("cancelled");
      expect(transitions).not.toContain("approved");
    });

    it("returns empty for terminal states", () => {
      expect(getAvailableTransitions("rejected", "admin")).toEqual([]);
      expect(getAvailableTransitions("archived", "admin")).toEqual([]);
    });

    it("admin can reschedule no-shows", () => {
      const transitions = getAvailableTransitions("no_show", "admin");
      expect(transitions).toContain("scheduled");
    });
  });

  describe("STATUS_LABELS", () => {
    it("has labels for all statuses", () => {
      expect(Object.keys(STATUS_LABELS).length).toBeGreaterThanOrEqual(14);
      expect(STATUS_LABELS.notarized).toBe("Notarized");
    });
  });
});
