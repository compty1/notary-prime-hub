import { documentTemplates } from "./documentTemplates";

export interface BrandKit {
  company_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  tagline?: string;
}

function buildBrandHeader(brandKit?: BrandKit): string {
  if (!brandKit) return "";
  const logo = brandKit.logo_url
    ? `<img src="${brandKit.logo_url}" alt="${brandKit.company_name}" style="max-height:60px;margin-bottom:8px;" />`
    : "";
  return `<div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid ${brandKit.primary_color};">
    ${logo}
    <h1 style="font-family:${brandKit.font_family},serif;color:${brandKit.primary_color};margin:0;font-size:22px;">${brandKit.company_name}</h1>
    ${brandKit.tagline ? `<p style="color:${brandKit.secondary_color};font-size:12px;margin:4px 0 0;">${brandKit.tagline}</p>` : ""}
  </div>`;
}

export function renderTemplate(
  templateId: string,
  data: Record<string, string>,
  brandKit?: BrandKit
): string {
  const template = documentTemplates[templateId];
  if (!template) return `<p>Template "${templateId}" not found.</p>`;

  let html = template.html;

  // Inject brand header
  html = html.replace(/\{\{brand_header\}\}/g, buildBrandHeader(brandKit));

  // Replace all data placeholders
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    html = regex[Symbol.replace](html, value || "");
  }

  // Clear any remaining unreplaced placeholders
  html = html.replace(/\{\{[a-z_]+\}\}/g, "___________");

  return html;
}

export function getTemplatePlaceholders(templateId: string): string[] {
  const template = documentTemplates[templateId];
  return template?.placeholders ?? [];
}
