import { describe, it, expect } from "vitest";
import { hslToHex, isHex, ensureHex, sanitizeSlug } from "@/lib/colorUtils";

describe("colorUtils", () => {
  it("hslToHex converts known colors", () => {
    expect(hslToHex("hsl(0, 0%, 0%)")).toBe("#000000");
    expect(hslToHex("hsl(0, 0%, 100%)")).toBe("#ffffff");
    expect(hslToHex("hsl(0, 100%, 50%)")).toBe("#ff0000");
  });
  it("hslToHex passes through invalid input", () => {
    expect(hslToHex("not-hsl")).toBe("not-hsl");
  });
  it("isHex validates 6-digit hex", () => {
    expect(isHex("#abcdef")).toBe(true);
    expect(isHex("#ABC")).toBe(false);
    expect(isHex("abcdef")).toBe(false);
  });
  it("ensureHex returns fallback on empty", () => {
    expect(ensureHex(null)).toBe("#C9A227");
    expect(ensureHex(undefined, "#000000")).toBe("#000000");
  });
  it("ensureHex passes hex through", () => {
    expect(ensureHex("#112233")).toBe("#112233");
  });
  it("ensureHex converts HSL", () => {
    expect(ensureHex("hsl(0, 100%, 50%)")).toBe("#ff0000");
  });
  it("sanitizeSlug normalizes input", () => {
    expect(sanitizeSlug("Hello World!")).toBe("helloworld");
    expect(sanitizeSlug("a--b--c")).toBe("a-b-c");
    expect(sanitizeSlug("-trim-")).toBe("trim");
  });
});
