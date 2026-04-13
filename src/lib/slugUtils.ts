/**
 * NS-003: Slug validation and uniqueness utilities for notary pages
 */
import { supabase } from "@/integrations/supabase/client";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const RESERVED_SLUGS = new Set([
  "admin", "portal", "login", "signup", "book", "services", "api",
  "about", "contact", "help", "terms", "privacy", "notaries",
  "settings", "dashboard", "pricing", "verify", "reset-password",
]);

export interface SlugValidation {
  valid: boolean;
  error?: string;
}

export function validateSlugFormat(slug: string): SlugValidation {
  if (!slug) return { valid: false, error: "Slug is required" };
  if (slug.length < 3) return { valid: false, error: "Slug must be at least 3 characters" };
  if (slug.length > 50) return { valid: false, error: "Slug must be 50 characters or fewer" };
  if (!SLUG_REGEX.test(slug)) return { valid: false, error: "Slug must contain only lowercase letters, numbers, and hyphens" };
  if (slug.includes("--")) return { valid: false, error: "Slug cannot contain consecutive hyphens" };
  if (RESERVED_SLUGS.has(slug)) return { valid: false, error: "This slug is reserved" };
  return { valid: true };
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function checkSlugUniqueness(slug: string, currentUserId?: string): Promise<boolean> {
  const query = supabase
    .from("notary_pages")
    .select("id, user_id")
    .eq("slug", slug)
    .limit(1);

  const { data } = await query;
  if (!data || data.length === 0) return true;
  // If the slug belongs to the current user, it's fine
  if (currentUserId && data[0].user_id === currentUserId) return true;
  return false;
}
