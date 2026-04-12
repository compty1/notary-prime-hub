/**
 * SVC-437/463: Service filters and badge helpers
 * Filter services by availability, price, and display badges.
 */
import type { ServiceRegistryEntry, ServiceTag } from "@/lib/serviceRegistry";
import { SERVICE_REGISTRY } from "@/lib/serviceRegistry";

export interface ServiceFilterOptions {
  category?: string;
  tags?: ServiceTag[];
  ronOnly?: boolean;
  inPersonOnly?: boolean;
  searchQuery?: string;
}

/** Filter services from registry based on criteria */
export function filterServices(options: ServiceFilterOptions): ServiceRegistryEntry[] {
  let results = [...SERVICE_REGISTRY];

  if (options.category) {
    results = results.filter(s => s.category === options.category);
  }

  if (options.tags?.length) {
    results = results.filter(s => options.tags!.some(t => s.tags.includes(t)));
  }

  if (options.ronOnly) {
    results = results.filter(s => s.ronAvailable);
  }

  if (options.inPersonOnly) {
    results = results.filter(s => s.tags.includes("in-person"));
  }

  if (options.searchQuery) {
    const q = options.searchQuery.toLowerCase();
    results = results.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }

  return results;
}

/** Get display badge label for a tag */
export function getTagDisplayInfo(tag: ServiceTag): { label: string; color: string } {
  const map: Record<ServiceTag, { label: string; color: string }> = {
    "remote": { label: "Remote Available", color: "bg-primary/10 text-primary" },
    "in-person": { label: "In-Person", color: "bg-secondary text-secondary-foreground" },
    "same-day": { label: "Same-Day", color: "bg-accent text-accent-foreground" },
    "id-required": { label: "ID Required", color: "bg-muted text-muted-foreground" },
    "notary-required": { label: "Notary Required", color: "bg-muted text-muted-foreground" },
    "ohio-only": { label: "Ohio Only", color: "bg-secondary text-secondary-foreground" },
    "nationwide": { label: "Nationwide", color: "bg-primary/10 text-primary" },
    "rush-available": { label: "Rush Available", color: "bg-accent text-accent-foreground" },
    "subscription": { label: "Subscription", color: "bg-muted text-muted-foreground" },
    "free-tier": { label: "Free Tier", color: "bg-primary/10 text-primary" },
  };
  return map[tag] || { label: tag, color: "bg-muted text-muted-foreground" };
}
