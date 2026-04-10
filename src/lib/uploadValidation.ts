/**
 * File upload validation utilities (Items 520-535)
 * Comprehensive file type, size, and content validation.
 */

/** Allowed MIME types for document uploads */
export const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Allowed extensions mapped from MIME types */
export const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp", ".doc", ".docx",
]);

/** Maximum file size (25 MB) */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** Maximum file size for ID scans (10 MB) */
export const MAX_ID_SCAN_SIZE = 10 * 1024 * 1024;

/** Validate a file for upload */
export function validateUploadFile(file: File, options?: {
  maxSize?: number;
  allowedTypes?: Set<string>;
  allowedExtensions?: Set<string>;
}): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options?.allowedTypes || ALLOWED_DOCUMENT_TYPES;
  const allowedExtensions = options?.allowedExtensions || ALLOWED_EXTENSIONS;

  // Check file size
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File exceeds ${maxMB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)` };
  }

  // Check file size minimum (likely empty/corrupted)
  if (file.size === 0) {
    return { valid: false, error: "File appears to be empty" };
  }

  // Check MIME type
  if (!allowedTypes.has(file.type)) {
    return { valid: false, error: `File type "${file.type || "unknown"}" is not supported` };
  }

  // Check extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.has(ext)) {
    return { valid: false, error: `File extension "${ext}" is not allowed` };
  }

  // Check for double extensions (potential attack vector)
  const parts = file.name.split(".");
  if (parts.length > 2) {
    const suspiciousExts = [".exe", ".bat", ".cmd", ".scr", ".js", ".vbs", ".ps1", ".sh"];
    for (const part of parts.slice(1, -1)) {
      if (suspiciousExts.includes("." + part.toLowerCase())) {
        return { valid: false, error: "File contains suspicious double extension" };
      }
    }
  }

  return { valid: true };
}

/** Validate multiple files */
export function validateMultipleFiles(files: File[], maxCount = 10): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length > maxCount) {
    errors.push(`Maximum ${maxCount} files allowed (${files.length} selected)`);
  }

  files.forEach((file, idx) => {
    const result = validateUploadFile(file);
    if (!result.valid) {
      errors.push(`${file.name}: ${result.error}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/** Check if file appears to be a valid PDF (magic bytes) */
export async function isPdfFile(file: File): Promise<boolean> {
  const header = await file.slice(0, 5).text();
  return header === "%PDF-";
}

/** Sanitize a filename for storage */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s.-]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);
}
