/**
 * SLA monitoring and alert escalation.
 * Enhancement #35 (SLA monitoring)
 */

import { supabase } from "@/integrations/supabase/client";

export interface SLARule {
  name: string;
  status: string;
  maxHours: number;
  escalationAction: "alert" | "auto_reassign" | "notify_admin";
}

export const DEFAULT_SLA_RULES: SLARule[] = [
  { name: "Pending Review", status: "submitted", maxHours: 4, escalationAction: "notify_admin" },
  { name: "Awaiting Confirmation", status: "scheduled", maxHours: 24, escalationAction: "alert" },
  { name: "Document Review", status: "in_review", maxHours: 48, escalationAction: "notify_admin" },
  { name: "Payment Pending", status: "completed", maxHours: 72, escalationAction: "alert" },
];

export interface SLAViolation {
  appointmentId: string;
  confirmationNumber: string;
  status: string;
  hoursInStatus: number;
  rule: SLARule;
  clientName?: string;
}

/** Check for SLA violations across appointments */
export async function checkSLAViolations(rules = DEFAULT_SLA_RULES): Promise<SLAViolation[]> {
  const violations: SLAViolation[] = [];

  for (const rule of rules) {
    const cutoff = new Date(Date.now() - rule.maxHours * 3600000).toISOString();

    const { data } = await supabase
      .from("appointments")
      .select("id, confirmation_number, status, updated_at, profiles:client_id(full_name)")
      .eq("status", rule.status as any)
      .lt("updated_at", cutoff)
      .limit(50);

    if (data) {
      data.forEach((appt: any) => {
        const hoursInStatus = (Date.now() - new Date(appt.updated_at).getTime()) / 3600000;
        violations.push({
          appointmentId: appt.id,
          confirmationNumber: appt.confirmation_number || appt.id.slice(0, 8),
          status: appt.status,
          hoursInStatus: Math.round(hoursInStatus),
          rule,
          clientName: appt.profiles?.full_name,
        });
      });
    }
  }

  return violations.sort((a, b) => b.hoursInStatus - a.hoursInStatus);
}
