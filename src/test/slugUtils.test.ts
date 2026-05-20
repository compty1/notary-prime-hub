import { describe, it, expect } from "vitest";
import { validateSlugFormat, generateSlug } from "@/lib/slugUtils";

describe("slugUtils", () => {
  it("rejects empty / short slugs", () => {
    expect(validateSlugFormat("").valid).toBe(false);
    expect(validateSlugFormat("ab").valid).toBe(false);
  });
  it("rejects reserved slugs", () => {
    expect(validateSlugFormat("admin").valid).toBe(false);
    expect(validateSlugFormat("login").valid).toBe(false);
  });
  it("rejects bad format", () => {
    expect(validateSlugFormat("Bad Slug").valid).toBe(false);
    expect(validateSlugFormat("trailing-").valid).toBe(false);
    expect(validateSlugFormat("a--b").valid).toBe(false);
  });
  it("rejects slugs over 50 chars", () => {
    expect(validateSlugFormat("a".repeat(51)).valid).toBe(false);
  });
  it("accepts valid slugs", () => {
    expect(validateSlugFormat("john-doe").valid).toBe(true);
    expect(validateSlugFormat("notary123").valid).toBe(true);
  });
  it("generateSlug normalizes names", () => {
    expect(generateSlug("John Doe!")).toBe("john-doe");
    expect(generateSlug("  Multiple   Spaces  ")).toBe("multiple-spaces");
  });
});
