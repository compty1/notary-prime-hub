/**
 * Security incident response playbook.
 * Enhancement #86 (Incident response playbook)
 */

export interface IncidentStep {
  order: number;
  title: string;
  description: string;
  responsible: string;
  timeframe: string;
}

export interface IncidentPlaybook {
  type: string;
  severity: "critical" | "high" | "medium";
  steps: IncidentStep[];
}

export const INCIDENT_PLAYBOOKS: IncidentPlaybook[] = [
  {
    type: "Data Breach",
    severity: "critical",
    steps: [
      { order: 1, title: "Isolate affected systems", description: "Disable compromised accounts and revoke API keys immediately", responsible: "Admin", timeframe: "0-15 min" },
      { order: 2, title: "Assess scope", description: "Determine what data was accessed, number of affected users, and attack vector", responsible: "Admin", timeframe: "15-60 min" },
      { order: 3, title: "Rotate all secrets", description: "Rotate Supabase service role key, Stripe keys, IONOS credentials, SignNow tokens", responsible: "Admin", timeframe: "1-2 hours" },
      { order: 4, title: "Notify affected users", description: "Send breach notification per Ohio data breach law (ORC §1349.19) within 45 days", responsible: "Admin", timeframe: "Within 45 days" },
      { order: 5, title: "File regulatory reports", description: "Report to Ohio Attorney General if >1000 residents affected", responsible: "Legal", timeframe: "Within 45 days" },
      { order: 6, title: "Post-incident review", description: "Document root cause, remediation steps, and prevention measures", responsible: "Admin", timeframe: "Within 7 days" },
    ],
  },
  {
    type: "Unauthorized Access",
    severity: "high",
    steps: [
      { order: 1, title: "Lock affected account", description: "Immediately disable the compromised user account", responsible: "Admin", timeframe: "0-5 min" },
      { order: 2, title: "Review audit logs", description: "Check audit_log for all actions by the compromised account", responsible: "Admin", timeframe: "5-30 min" },
      { order: 3, title: "Force password reset", description: "Require new credentials for all potentially affected accounts", responsible: "Admin", timeframe: "30-60 min" },
      { order: 4, title: "Review RLS policies", description: "Verify no data was accessed beyond authorized scope", responsible: "Admin", timeframe: "1-4 hours" },
    ],
  },
  {
    type: "Service Outage",
    severity: "medium",
    steps: [
      { order: 1, title: "Enable maintenance mode", description: "Activate maintenance_mode platform setting to show status page", responsible: "Admin", timeframe: "0-5 min" },
      { order: 2, title: "Diagnose root cause", description: "Check edge function logs, database status, third-party service health", responsible: "Admin", timeframe: "5-30 min" },
      { order: 3, title: "Implement fix", description: "Deploy fix or workaround; restore services incrementally", responsible: "Admin", timeframe: "30 min - 4 hours" },
      { order: 4, title: "Post-mortem", description: "Document timeline, impact, and prevention measures", responsible: "Admin", timeframe: "Within 48 hours" },
    ],
  },
];
