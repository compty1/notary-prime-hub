/**
 * Appointment Intake State Machine (GAP-P1-07 / BIZ-001)
 * Enforces valid status transitions per the implementation plan §4.7.
 * Ohio RON compliance: ORC §147.60–.66
 */

export type AppointmentStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "notarized"
  | "archived"
  | "cancelled"
  | "no_show"
  | "refused";

export type UserRole = "admin" | "notary" | "client";

interface TransitionRule {
  to: AppointmentStatus;
  allowedRoles: UserRole[];
  requiresReason?: boolean;
  sideEffects?: string[];
}

/**
 * Defines all valid status transitions with role-based access control.
 * Each status maps to an array of possible next states.
 */
const TRANSITION_MAP: Record<AppointmentStatus, TransitionRule[]> = {
  draft: [
    {
      to: "submitted",
      allowedRoles: ["client", "admin"],
      sideEffects: ["email_notary_assignment", "sms_client_confirmation"],
    },
    { to: "cancelled", allowedRoles: ["client", "admin"] },
  ],
  submitted: [
    {
      to: "in_review",
      allowedRoles: ["notary", "admin"],
      sideEffects: ["audit_log", "email_client_review_started"],
    },
    { to: "cancelled", allowedRoles: ["client", "admin"] },
  ],
  in_review: [
    {
      to: "approved",
      allowedRoles: ["notary", "admin"],
      sideEffects: ["email_client_scheduling_link"],
    },
    {
      to: "rejected",
      allowedRoles: ["notary", "admin"],
      requiresReason: true,
      sideEffects: ["email_client_rejection", "audit_log"],
    },
    { to: "cancelled", allowedRoles: ["admin"] },
  ],
  approved: [
    {
      to: "scheduled",
      allowedRoles: ["client", "admin"],
      sideEffects: ["calendar_event", "queue_reminders"],
    },
    { to: "cancelled", allowedRoles: ["client", "admin"] },
  ],
  rejected: [],
  scheduled: [
    {
      to: "confirmed",
      allowedRoles: ["notary", "admin"],
      sideEffects: ["email_client_final_confirmation"],
    },
    {
      to: "in_progress",
      allowedRoles: ["notary", "admin"],
      sideEffects: ["log_gps_checkin"],
    },
    { to: "cancelled", allowedRoles: ["client", "admin"] },
    { to: "no_show", allowedRoles: ["notary", "admin"] },
  ],
  confirmed: [
    {
      to: "in_progress",
      allowedRoles: ["notary", "admin"],
      sideEffects: ["log_gps_checkin"],
    },
    { to: "cancelled", allowedRoles: ["client", "admin"] },
    { to: "no_show", allowedRoles: ["notary", "admin"] },
  ],
  in_progress: [
    {
      to: "completed",
      allowedRoles: ["notary", "admin"],
      sideEffects: ["generate_invoice", "email_completion", "queue_satisfaction_survey"],
    },
    {
      to: "refused",
      allowedRoles: ["notary"],
      requiresReason: true,
      sideEffects: ["audit_log", "notify_admin"],
    },
  ],
  completed: [
    {
      to: "notarized",
      allowedRoles: ["notary", "admin"],
      sideEffects: ["generate_certificate", "journal_entry"],
    },
    {
      to: "archived",
      allowedRoles: ["admin"],
      sideEffects: ["move_to_cold_storage"],
    },
  ],
  notarized: [
    {
      to: "archived",
      allowedRoles: ["admin"],
      sideEffects: ["move_to_cold_storage"],
    },
  ],
  archived: [],
  cancelled: [],
  no_show: [
    { to: "scheduled", allowedRoles: ["admin"], sideEffects: ["reschedule_flow"] },
  ],
  refused: [],
};

export interface TransitionResult {
  valid: boolean;
  error?: string;
  sideEffects?: string[];
  requiresReason?: boolean;
}

/**
 * Validates whether a status transition is allowed for the given role.
 */
export function validateTransition(
  currentStatus: AppointmentStatus,
  targetStatus: AppointmentStatus,
  userRole: UserRole,
  reason?: string
): TransitionResult {
  const rules = TRANSITION_MAP[currentStatus];
  if (!rules || rules.length === 0) {
    return {
      valid: false,
      error: `No transitions allowed from status "${currentStatus}". It is a terminal state.`,
    };
  }

  const rule = rules.find((r) => r.to === targetStatus);
  if (!rule) {
    const allowed = rules.map((r) => r.to).join(", ");
    return {
      valid: false,
      error: `Cannot transition from "${currentStatus}" to "${targetStatus}". Valid targets: ${allowed}`,
    };
  }

  if (!rule.allowedRoles.includes(userRole)) {
    return {
      valid: false,
      error: `Role "${userRole}" is not authorized to transition from "${currentStatus}" to "${targetStatus}".`,
    };
  }

  if (rule.requiresReason && (!reason || reason.trim().length === 0)) {
    return {
      valid: false,
      error: `A reason is required when transitioning to "${targetStatus}".`,
      requiresReason: true,
    };
  }

  return {
    valid: true,
    sideEffects: rule.sideEffects,
  };
}

/**
 * Returns all valid next statuses for the given current status and role.
 */
export function getAvailableTransitions(
  currentStatus: AppointmentStatus,
  userRole: UserRole
): AppointmentStatus[] {
  const rules = TRANSITION_MAP[currentStatus] || [];
  return rules
    .filter((r) => r.allowedRoles.includes(userRole))
    .map((r) => r.to);
}

/**
 * Human-readable status labels for UI display.
 */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  notarized: "Notarized",
  archived: "Archived",
  cancelled: "Cancelled",
  no_show: "No Show",
  refused: "Refused",
};

/**
 * Status color mapping for badges.
 */
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_review: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-destructive/10 text-destructive",
  scheduled: "bg-primary/10 text-primary",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  in_progress: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  notarized: "bg-primary/20 text-primary",
  archived: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
  no_show: "bg-destructive/10 text-destructive",
  refused: "bg-destructive/10 text-destructive",
};
