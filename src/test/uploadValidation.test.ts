import { describe, it, expect } from "vitest";
import { validateUploadFile, sanitizeFilename, validateMultipleFiles } from "@/lib/uploadValidation";

describe("uploadValidation", () => {
  it("rejects empty files", () => {
    const file = new File([], "empty.pdf", { type: "application/pdf" });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("accepts valid PDF files", () => {
    const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported file types", () => {
    const file = new File(["content"], "virus.exe", { type: "application/x-msdownload" });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(false);
  });

  it("rejects oversized files", () => {
    const bigContent = new Uint8Array(26 * 1024 * 1024); // 26MB
    const file = new File([bigContent], "big.pdf", { type: "application/pdf" });
    const result = validateUploadFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds");
  });

  it("sanitizes filenames", () => {
    expect(sanitizeFilename("my file<script>.pdf")).toBe("my_file_script_.pdf");
    expect(sanitizeFilename("normal-file.pdf")).toBe("normal-file.pdf");
  });

  it("validates multiple files with count limit", () => {
    const files = Array.from({ length: 15 }, (_, i) =>
      new File(["content"], `file${i}.pdf`, { type: "application/pdf" })
    );
    const result = validateMultipleFiles(files, 10);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Maximum 10 files");
  });
});
