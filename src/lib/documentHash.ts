/**
 * Document hash verification utilities (Items 510-515)
 * Generate and verify SHA-256 hashes for document integrity.
 */

/** Generate SHA-256 hash of a file/blob */
export async function hashFile(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Generate SHA-256 hash of a string */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Verify a file against a known hash */
export async function verifyFileHash(file: File | Blob, expectedHash: string): Promise<boolean> {
  const actualHash = await hashFile(file);
  return actualHash === expectedHash.toLowerCase();
}

/** Generate fingerprint for e-seal verification */
export async function generateDocumentFingerprint(
  documentName: string,
  signerName: string,
  notaryName: string,
  timestamp: string
): Promise<string> {
  const payload = `${documentName}|${signerName}|${notaryName}|${timestamp}`;
  return hashString(payload);
}
