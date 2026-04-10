/**
 * Data export utilities (Items 3800-3830)
 * Standardized CSV, JSON, and clipboard export with sanitization.
 */

/** Escape a CSV cell value */
function escapeCSV(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Export data as CSV with UTF-8 BOM for Excel compatibility */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; label: string }[]
): void {
  if (data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
  const header = cols.map(c => escapeCSV(c.label)).join(",");
  const rows = data.map(row =>
    cols.map(c => escapeCSV(row[c.key])).join(",")
  );

  const bom = "\uFEFF";
  const csv = bom + [header, ...rows].join("\n");
  downloadBlob(csv, filename, "text/csv;charset=utf-8");
}

/** Export data as JSON file */
export function exportToJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, filename, "application/json");
}

/** Copy text to clipboard with fallback */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand("copy");
    document.body.removeChild(textarea);
    return result;
  } catch {
    return false;
  }
}

/** Download a blob as a file */
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/** Print the current page or a specific element */
export function printElement(elementId?: string): void {
  if (elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Print</title>
      <style>body { font-family: system-ui, sans-serif; padding: 20px; }</style>
      </head><body>${el.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  } else {
    window.print();
  }
}
