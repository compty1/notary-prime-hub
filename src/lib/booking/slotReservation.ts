/**
 * Sprint C (C-02..15): Unified slot reservation helper
 * Wraps the `check_and_reserve_slot` RPC with consistent error handling
 * to fix race conditions across all entry points (BookAppointment,
 * Reschedule flow, AdminAppointments quick-book, etc.).
 */
import { supabase } from "@/integrations/supabase/client";

export interface SlotReservationResult {
  success: boolean;
  appointmentId?: string;
  error?: string;
}

/** Atomically reserve a time slot. Returns the new appointment ID on success. */
export async function reserveSlot(opts: {
  date: string;
  time: string;
  clientId: string;
  serviceType: string;
}): Promise<SlotReservationResult> {
  try {
    const { data, error } = await supabase.rpc("check_and_reserve_slot", {
      p_date: opts.date,
      p_time: opts.time,
      p_client_id: opts.clientId,
      p_service_type: opts.serviceType,
    });

    if (error) {
      const msg = error.message?.includes("already booked")
        ? "This time slot was just taken. Please choose another."
        : error.message || "Failed to reserve slot";
      return { success: false, error: msg };
    }

    return { success: true, appointmentId: data as string };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error during reservation",
    };
  }
}

/** Release a previously-reserved slot (for cancellation or step-back) */
export async function releaseSlot(appointmentId: string): Promise<void> {
  await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("status", "scheduled");
}
