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

/**
 * Release a previously-reserved slot (cancellation or step-back).
 * Writes an audit log entry so the cancellation is traceable per Ohio
 * RON record-keeping requirements.
 */
export async function releaseSlot(
  appointmentId: string,
  reason: string = "slot_released"
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      admin_notes: `Slot released: ${reason}`,
    } as never)
    .eq("id", appointmentId)
    .eq("status", "scheduled");

  if (error) {
    console.error("[releaseSlot] failed:", error.message);
    return;
  }

  // Best-effort audit log (does not block the release)
  try {
    await supabase.rpc("log_audit_event", {
      _action: "appointment.slot_released",
      _entity_type: "appointment",
      _entity_id: appointmentId,
      _details: { reason } as never,
    });
  } catch (e) {
    console.warn("[releaseSlot] audit log failed:", e);
  }
}
