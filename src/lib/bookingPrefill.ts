/**
 * SVC-249: Form prefill for returning users
 * Loads saved profile data to prefill booking forms.
 */
import { supabase } from "@/integrations/supabase/client";

export interface PrefillData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export async function getBookingPrefill(userId: string): Promise<PrefillData | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone, address, city, state, zip")
      .eq("user_id", userId)
      .single();

    if (!profile) return null;

    return {
      fullName: profile.full_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      address: profile.address || "",
      city: profile.city || "",
      state: profile.state || "",
      zip: profile.zip || "",
    };
  } catch {
    return null;
  }
}
