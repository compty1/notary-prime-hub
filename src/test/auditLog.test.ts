import { describe, it, expect, vi } from "vitest";

// Test that auditLog utility never throws

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => Promise.reject(new Error("DB error")),
  },
}));

describe("logAuditEvent", () => {
  it("never throws even on DB error", async () => {
    const { logAuditEvent } = await import("@/lib/auditLog");
    await expect(logAuditEvent("test_action")).resolves.toBeUndefined();
  });

  it("accepts optional parameters", async () => {
    const { logAuditEvent } = await import("@/lib/auditLog");
    await expect(
      logAuditEvent("test", { entityType: "user", entityId: "abc", details: { foo: "bar" } })
    ).resolves.toBeUndefined();
  });
});
