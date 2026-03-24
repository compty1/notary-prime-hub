// Centralized status display labels for consistent terminology across the app

export const appointmentStatusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  id_verification: "ID Verification",
  kba_pending: "KBA Pending",
  in_session: "In Session",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export const documentStatusLabels: Record<string, string> = {
  uploaded: "Uploaded",
  pending_review: "Pending Review",
  approved: "Approved",
  notarized: "Notarized",
  rejected: "Rejected",
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const apostilleStatusLabels: Record<string, string> = {
  intake: "Intake",
  processing: "Processing",
  submitted: "Submitted to SOS",
  completed: "Completed",
  returned: "Returned",
};

export const verificationStatusLabels: Record<string, string> = {
  valid: "Valid",
  revoked: "Revoked",
  expired: "Expired",
};

export const leadStatusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  lost: "Lost",
};

export function formatStatusLabel(status: string, domain?: string): string {
  const maps: Record<string, Record<string, string>> = {
    appointment: appointmentStatusLabels,
    document: documentStatusLabels,
    payment: paymentStatusLabels,
    apostille: apostilleStatusLabels,
    verification: verificationStatusLabels,
    lead: leadStatusLabels,
  };

  if (domain && maps[domain]?.[status]) {
    return maps[domain][status];
  }

  // Fallback: try all maps then format raw
  for (const map of Object.values(maps)) {
    if (map[status]) return map[status];
  }

  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
