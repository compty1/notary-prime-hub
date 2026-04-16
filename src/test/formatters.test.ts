import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatPhone,
  formatPercent,
  formatFileSize,
  truncate,
} from "@/lib/formatters";

describe("formatters", () => {
  it("formats USD currency", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
  });

  it("formats dates with default options", () => {
    expect(formatDate("2025-01-15T00:00:00Z")).toMatch(/Jan|Dec/);
    expect(formatDate(null)).toBe("—");
    expect(formatDate("invalid")).toBe("—");
  });

  it("formats US phone numbers", () => {
    expect(formatPhone("6143006890")).toBe("(614) 300-6890");
    expect(formatPhone("16143006890")).toBe("+1 (614) 300-6890");
    expect(formatPhone(null)).toBe("—");
    expect(formatPhone("12345")).toBe("12345");
  });

  it("formats percentages", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
    expect(formatPercent(1)).toBe("100.0%");
    expect(formatPercent(null)).toBe("—");
  });

  it("formats file sizes across units", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5242880)).toBe("5.0 MB");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hell…");
    expect(truncate("short", 10)).toBe("short");
    expect(truncate(null)).toBe("");
  });
});
