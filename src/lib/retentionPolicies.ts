/**
 * SVC-169: Centralized data retention policies
 * Defines retention periods per data type and provides cleanup helpers.
 */

export interface RetentionPolicy {
  dataType: string;
  tableName: string;
  retentionDays: number;
  legalBasis: string;
  canBeDeleted: boolean;
  notes: string;
}

/** Retention policies per Ohio law and platform requirements */
export const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    dataType: "RON Session Recordings",
    tableName: "notarization_sessions",
    retentionDays: 3650, // 10 years
    legalBasis: "ORC §147.141",
    canBeDeleted: false,
    notes: "Mandatory 10-year retention for electronic journal entries and recordings",
  },
  {
    dataType: "Journal Entries",
    tableName: "journal_entries",
    retentionDays: 3650,
    legalBasis: "ORC §147.141",
    canBeDeleted: false,
    notes: "Notarial journal must be retained for 10 years after notary commission ends",
  },
  {
    dataType: "E-Seal Verifications",
    tableName: "e_seal_verifications",
    retentionDays: 3650,
    legalBasis: "ORC §147.542",
    canBeDeleted: false,
    notes: "Certificate records tied to notarial acts",
  },
  {
    dataType: "Audit Logs",
    tableName: "audit_log",
    retentionDays: 2555, // 7 years
    legalBasis: "Business record retention",
    canBeDeleted: false,
    notes: "Administrative audit trail for compliance",
  },
  {
    dataType: "Payment Records",
    tableName: "payments",
    retentionDays: 2555,
    legalBasis: "IRS record retention / ORC",
    canBeDeleted: false,
    notes: "Financial records for tax and legal purposes",
  },
  {
    dataType: "Appointments",
    tableName: "appointments",
    retentionDays: 2555,
    legalBasis: "Business records",
    canBeDeleted: false,
    notes: "Service records for compliance and disputes",
  },
  {
    dataType: "User Profiles",
    tableName: "profiles",
    retentionDays: -1, // Until deletion requested
    legalBasis: "Service operation",
    canBeDeleted: true,
    notes: "Can be anonymized upon user deletion request (except linked legal records)",
  },
  {
    dataType: "Chat Messages",
    tableName: "chat_messages",
    retentionDays: 365,
    legalBasis: "Customer support",
    canBeDeleted: true,
    notes: "Support communication history",
  },
  {
    dataType: "Booking Drafts",
    tableName: "booking_drafts",
    retentionDays: 30,
    legalBasis: "UX convenience",
    canBeDeleted: true,
    notes: "Temporary booking progress data",
  },
  {
    dataType: "Webhook Events",
    tableName: "webhook_events",
    retentionDays: 90,
    legalBasis: "Operational",
    canBeDeleted: true,
    notes: "Webhook processing logs for debugging",
  },
];

/** Check if a record is within its retention period */
export function isWithinRetention(createdAt: string, retentionDays: number): boolean {
  if (retentionDays < 0) return true; // Indefinite
  const created = new Date(createdAt);
  const expires = new Date(created.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  return new Date() < expires;
}

/** Get retention policy for a table */
export function getRetentionPolicy(tableName: string): RetentionPolicy | undefined {
  return RETENTION_POLICIES.find(p => p.tableName === tableName);
}

/** Check if record is under legal hold (cannot be deleted) */
export function isUnderLegalHold(policy: RetentionPolicy, createdAt: string): boolean {
  if (!policy.canBeDeleted) return true;
  return isWithinRetention(createdAt, policy.retentionDays);
}
