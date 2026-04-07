/**
 * Wave 4: Centralized file upload validation (CSV #13, #25)
 * Validates file extensions, MIME types, and sizes before upload.
 */

/** Allowed MIME types for document uploads */
export const ALLOWED_DOCUMENT_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

/** Allowed MIME types for image-only uploads (avatars, ID scans) */
export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

/** Allowed file extensions string for <input accept> */
export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx,.xlsx,.csv";
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.heic";

/** Default max file size: 10 MB */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Validate a file's MIME type against a whitelist */
export function validateFileMime(file: File, allowedMimes: Set<string> = ALLOWED_DOCUMENT_MIMES): string | null {
  if (!allowedMimes.has(file.type)) {
    return `File type "${file.type || "unknown"}" is not allowed. Accepted: ${Array.from(allowedMimes).map(m => m.split("/")[1]).join(", ")}`;
  }
  return null;
}

/** Validate file size */
export function validateFileSize(file: File, maxBytes = MAX_FILE_SIZE_BYTES): string | null {
  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024));
    return `File exceeds ${maxMB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`;
  }
  return null;
}

/** Full validation: MIME + size */
export function validateFile(file: File, opts?: { allowedMimes?: Set<string>; maxBytes?: number }): string | null {
  const mimeErr = validateFileMime(file, opts?.allowedMimes);
  if (mimeErr) return mimeErr;
  const sizeErr = validateFileSize(file, opts?.maxBytes);
  if (sizeErr) return sizeErr;
  return null;
}

/** Validate an array of files, returns map of filename → error */
export function validateFiles(files: File[], opts?: { allowedMimes?: Set<string>; maxBytes?: number }): Map<string, string> {
  const errors = new Map<string, string>();
  for (const file of files) {
    const err = validateFile(file, opts);
    if (err) errors.set(file.name, err);
  }
  return errors;
}
