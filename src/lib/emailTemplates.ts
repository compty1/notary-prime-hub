/**
 * SVC-107: Standardized email template library
 * Shared layout/footer and variable substitution for all transactional emails
 */

export interface EmailTemplateVars {
  clientName?: string;
  confirmationNumber?: string;
  serviceType?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  notaryName?: string;
  amount?: string;
  portalLink?: string;
  rescheduleLink?: string;
  cancelLink?: string;
  trackingUrl?: string;
  [key: string]: string | undefined;
}

const BRAND = {
  name: "NotaryPrime",
  supportEmail: "support@notaryprime.com",
  phone: "(614) 555-0100",
  address: "Columbus, OH",
  website: "https://notaryprime.com",
};

function substituteVars(template: string, vars: EmailTemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function wrapInLayout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
  <tr><td style="padding:24px 32px;background:#1a1a2e;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:24px;">${BRAND.name}</h1>
  </td></tr>
  <tr><td style="padding:32px;">${bodyHtml}</td></tr>
  <tr><td style="padding:24px 32px;background:#f4f4f5;text-align:center;font-size:12px;color:#71717a;">
    <p style="margin:0 0 8px;">${BRAND.name} · ${BRAND.address}</p>
    <p style="margin:0;">${BRAND.supportEmail} · ${BRAND.phone}</p>
    <p style="margin:8px 0 0;"><a href="{{portalLink}}" style="color:#6366f1;">Manage your account</a></p>
  </td></tr>
</table>
</body></html>`;
}

export const EMAIL_TEMPLATES = {
  booking_confirmation: {
    subject: "Booking Confirmed — {{confirmationNumber}}",
    body: `<h2 style="margin:0 0 16px;color:#1a1a2e;">Your Appointment is Confirmed</h2>
<p>Hi {{clientName}},</p>
<p>Your <strong>{{serviceType}}</strong> appointment has been confirmed.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr><td style="padding:8px;border-bottom:1px solid #e4e4e7;color:#71717a;">Confirmation</td><td style="padding:8px;border-bottom:1px solid #e4e4e7;font-weight:600;">{{confirmationNumber}}</td></tr>
  <tr><td style="padding:8px;border-bottom:1px solid #e4e4e7;color:#71717a;">Date</td><td style="padding:8px;border-bottom:1px solid #e4e4e7;">{{scheduledDate}}</td></tr>
  <tr><td style="padding:8px;border-bottom:1px solid #e4e4e7;color:#71717a;">Time</td><td style="padding:8px;border-bottom:1px solid #e4e4e7;">{{scheduledTime}} ET</td></tr>
</table>
<p><a href="{{portalLink}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">View in Portal</a></p>
<p style="font-size:13px;color:#71717a;">Need to change? <a href="{{rescheduleLink}}" style="color:#6366f1;">Reschedule</a> or <a href="{{cancelLink}}" style="color:#6366f1;">Cancel</a></p>`,
  },

  payment_receipt: {
    subject: "Payment Receipt — {{amount}}",
    body: `<h2 style="margin:0 0 16px;color:#1a1a2e;">Payment Received</h2>
<p>Hi {{clientName}},</p>
<p>We've received your payment of <strong>{{amount}}</strong> for {{serviceType}}.</p>
<p>Confirmation: {{confirmationNumber}}</p>
<p><a href="{{portalLink}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">View Receipt</a></p>`,
  },

  reminder_24h: {
    subject: "Reminder: Appointment Tomorrow — {{confirmationNumber}}",
    body: `<h2 style="margin:0 0 16px;color:#1a1a2e;">Your Appointment is Tomorrow</h2>
<p>Hi {{clientName}},</p>
<p>This is a friendly reminder that your <strong>{{serviceType}}</strong> appointment is scheduled for:</p>
<p style="font-size:18px;font-weight:600;">{{scheduledDate}} at {{scheduledTime}} ET</p>
<p><strong>What to bring:</strong></p>
<ul><li>Valid government-issued photo ID</li><li>All documents requiring notarization</li></ul>
<p><a href="{{portalLink}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">View Details</a></p>`,
  },

  cancellation: {
    subject: "Appointment Cancelled — {{confirmationNumber}}",
    body: `<h2 style="margin:0 0 16px;color:#1a1a2e;">Appointment Cancelled</h2>
<p>Hi {{clientName}},</p>
<p>Your {{serviceType}} appointment ({{confirmationNumber}}) has been cancelled.</p>
<p>If this was a mistake, you can rebook at any time:</p>
<p><a href="{{portalLink}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Book New Appointment</a></p>`,
  },
} as const;

export type EmailTemplateName = keyof typeof EMAIL_TEMPLATES;

export function renderEmail(
  templateName: EmailTemplateName,
  vars: EmailTemplateVars
): { subject: string; html: string } {
  const template = EMAIL_TEMPLATES[templateName];
  return {
    subject: substituteVars(template.subject, vars),
    html: wrapInLayout(substituteVars(template.body, vars)),
  };
}
