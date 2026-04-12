/**
 * SVC-139: CRM auto-tagging by service usage
 * Tags clients based on their booking history.
 */
import { supabase } from "@/integrations/supabase/client";

export type ClientTag = 
  | "frequent" | "new" | "vip" | "ron_user" | "mobile_notary" 
  | "business" | "loan_signing" | "apostille" | "at_risk";

export async function getClientTags(clientId: string): Promise<ClientTag[]> {
  const tags: ClientTag[] = [];

  const { data: appointments } = await supabase
    .from("appointments")
    .select("service_type, status, created_at")
    .eq("client_id", clientId);

  if (!appointments || appointments.length === 0) {
    tags.push("new");
    return tags;
  }

  // Frequency
  if (appointments.length >= 10) tags.push("vip");
  else if (appointments.length >= 3) tags.push("frequent");

  // Service-based tags
  const services = appointments.map(a => a.service_type.toLowerCase());
  if (services.some(s => s.includes("ron") || s.includes("remote"))) tags.push("ron_user");
  if (services.some(s => s.includes("mobile") || s.includes("travel"))) tags.push("mobile_notary");
  if (services.some(s => s.includes("loan") || s.includes("closing"))) tags.push("loan_signing");
  if (services.some(s => s.includes("apostille"))) tags.push("apostille");

  // At-risk: cancelled > 50% of bookings
  const cancelled = appointments.filter(a => a.status === "cancelled").length;
  if (cancelled > appointments.length * 0.5 && appointments.length >= 2) tags.push("at_risk");

  return [...new Set(tags)];
}

export const TAG_COLORS: Record<ClientTag, string> = {
  frequent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  new: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  vip: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  ron_user: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  mobile_notary: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  business: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  loan_signing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  apostille: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  at_risk: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};
