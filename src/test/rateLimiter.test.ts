import { describe, it, expect } from "vitest";
import { checkRateLimit, checkProgressiveRateLimit, resetRateLimit } from "@/lib/rateLimiter";

describe("rateLimiter", () => {
  it("allows requests within limit", () => {
    resetRateLimit("test1");
    const r1 = checkRateLimit("test1", 3, 60000);
    expect(r1.allowed).toBe(true);
    const r2 = checkRateLimit("test1", 3, 60000);
    expect(r2.allowed).toBe(true);
    const r3 = checkRateLimit("test1", 3, 60000);
    expect(r3.allowed).toBe(true);
  });

  it("blocks requests over limit", () => {
    resetRateLimit("test2");
    checkRateLimit("test2", 2, 60000);
    checkRateLimit("test2", 2, 60000);
    const r3 = checkRateLimit("test2", 2, 60000);
    expect(r3.allowed).toBe(false);
    expect(r3.retryAfterMs).toBeGreaterThan(0);
  });

  it("progressive rate limit increases penalty", () => {
    resetRateLimit("test3");
    checkProgressiveRateLimit("test3", 1, 1000);
    const r2 = checkProgressiveRateLimit("test3", 1, 1000);
    expect(r2.allowed).toBe(false);
  });
});
