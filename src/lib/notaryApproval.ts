/**
 * AP-003: Notary approval flow management.
 * Handles pending → approved → live transitions for notary pages.
 */
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/auditLogger";
import { useToast } from "@/hooks/use-toast";

export type NotaryPageStatus = "draft" | "pending_review" | "approved" | "published" | "suspended" | "rejected";

interface ApprovalResult {
  success: boolean;
  error?: string;
}

export function useNotaryApproval() {
  const { toast } = useToast();

  const updateStatus = async (
    notaryPageId: string,
    newStatus: NotaryPageStatus,
    notes?: string
  ): Promise<ApprovalResult> => {
    try {
      const { error } = await supabase
        .from("notary_pages")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", notaryPageId);

      if (error) throw error;

      await logAdminAction({
        action: `notary_page_${newStatus}`,
        entityType: "notary_page",
        entityId: notaryPageId,
        details: { newStatus, notes },
      });

      toast({ title: `Notary page ${newStatus}`, description: notes || `Status updated to ${newStatus}.` });
      return { success: true };
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return { success: false, error: err.message };
    }
  };

  const approve = (id: string, notes?: string) => updateStatus(id, "approved", notes);
  const publish = (id: string) => updateStatus(id, "published");
  const reject = (id: string, reason: string) => updateStatus(id, "rejected", reason);
  const suspend = (id: string, reason: string) => updateStatus(id, "suspended", reason);

  return { approve, publish, reject, suspend, updateStatus };
}

/**
 * Commission validity check for compliance.
 */
export function isCommissionValid(expirationDate: string | null): {
  valid: boolean;
  daysRemaining: number;
  warning: boolean;
} {
  if (!expirationDate) return { valid: false, daysRemaining: 0, warning: true };

  const exp = new Date(expirationDate);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    valid: daysRemaining > 0,
    daysRemaining,
    warning: daysRemaining <= 90 && daysRemaining > 0,
  };
}

/**
 * Compliance checklist items for notary page approval.
 */
export const APPROVAL_CHECKLIST = [
  { id: "commission_valid", label: "Active notary commission on file", required: true },
  { id: "eo_insurance", label: "E&O insurance verified", required: true },
  { id: "background_check", label: "Background check completed", required: true },
  { id: "profile_complete", label: "Profile information complete", required: true },
  { id: "photo_uploaded", label: "Professional photo uploaded", required: false },
  { id: "bio_written", label: "Bio/description provided", required: true },
  { id: "service_areas", label: "Service areas defined", required: true },
  { id: "disclaimers", label: "Legal disclaimers acknowledged", required: true },
  { id: "ron_technology", label: "RON technology verified (if offering RON)", required: false },
] as const;
