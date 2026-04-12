import { describe, it, expect } from "vitest";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";

describe("sanitize", () => {
  describe("sanitizeHtml", () => {
    it("strips script tags", () => {
      const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
      expect(result).not.toContain("script");
      expect(result).toContain("Hello");
    });

    it("strips onerror attributes", () => {
      const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain("onerror");
    });

    it("preserves safe HTML", () => {
      const result = sanitizeHtml("<p><strong>Bold</strong> text</p>");
      expect(result).toContain("<strong>Bold</strong>");
    });
  });

  describe("stripHtml", () => {
    it("removes all HTML tags", () => {
      const result = stripHtml("<p>Hello <strong>world</strong></p>");
      expect(result).toBe("Hello world");
    });

    it("handles empty input", () => {
      expect(stripHtml("")).toBe("");
    });
  });
});
