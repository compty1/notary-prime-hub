/**
 * SVC-113: MFA enforcement for notary-sensitive routes
 * Checks if user has MFA enabled and enforces it for critical operations
 */
import { supabase } from "@/integrations/supabase/client";

export async function checkMFAStatus(): Promise<{
  enabled: boolean;
  verified: boolean;
  factorId?: string;
}> {
  const { data: factors } = await supabase.auth.mfa.listFactors();
  
  if (!factors?.totp || factors.totp.length === 0) {
    return { enabled: false, verified: false };
  }

  const activeFactor = factors.totp.find(f => f.status === "verified");
  if (!activeFactor) {
    return { enabled: true, verified: false };
  }

  // Check if there's an active authenticated assurance level
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const isAAL2 = aal?.currentLevel === "aal2";

  return {
    enabled: true,
    verified: isAAL2,
    factorId: activeFactor.id,
  };
}

export async function verifyMFACode(factorId: string, code: string): Promise<boolean> {
  const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
  if (!challenge) return false;

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  return !error;
}

/** Routes that require MFA for notaries */
export const MFA_REQUIRED_ROUTES = [
  "/ron-session",
  "/admin/journal",
  "/admin/compliance-report",
  "/admin/audit-log",
  "/admin/finances",
];

export function routeRequiresMFA(pathname: string): boolean {
  return MFA_REQUIRED_ROUTES.some(r => pathname.startsWith(r));
}
