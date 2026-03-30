import { describe, it, expect, vi } from "vitest";

// Item 602: Test edge function auth helper

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
  },
}));

describe("getEdgeFunctionHeaders", () => {
  it("returns headers with anon key when no session", async () => {
    const { getEdgeFunctionHeaders } = await import("@/lib/edgeFunctionAuth");
    const headers = await getEdgeFunctionHeaders();
    expect(headers).toHaveProperty("Content-Type", "application/json");
    expect(headers).toHaveProperty("Authorization");
    expect(headers).toHaveProperty("apikey");
  });
});
