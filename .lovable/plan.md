

# Complete Platform for Public Use — Gap Analysis & Plan

## Current State Summary
After thorough investigation, here is what exists and what's missing:

### What's Working
- 25 database tables with RLS policies
- 34 active services with 10 seeded with requirements/workflows
- 20 platform settings configured
- 3 document bundles created
- `on_auth_user_created` trigger attached to `auth.users`
- Google OAuth UI on Login/SignUp pages
- All routes registered (client portal, admin dashboard, public pages)
- Edge functions deployed (explain-document, detect-document, scan-id, notary-assistant, fetch-leads, process-inbound-email, send-appointment-emails)

### Gaps Found

| Gap | Impact |
|-----|--------|
| **0 time_slots** — booking page has no availability | Users cannot book appointments |
| **0 leads** — lead portal is empty | Admin CRM is blank |
| **0 `updated_at` triggers** — all are missing from the database | `updated_at` columns never auto-update |
| **24 services missing requirements/workflows** | Service detail panels show empty for most services |
| **Phone number placeholder** `(614) 555-1234` on homepage/footer | Looks fake for production |
| **No lead_sources seeded** | Lead portal source filtering has no data |

---

## Implementation Plan

### 1. Seed Default Time Slots
Insert standard weekly availability (Mon-Fri 9AM-5PM, Sat 10AM-2PM) into `time_slots` so the booking page shows available times.

### 2. Re-create All `updated_at` Triggers
Create triggers for all tables that have `updated_at` columns: `appointments`, `profiles`, `payments`, `leads`, `documents`, `notary_journal`, `notarization_sessions`, `apostille_requests`, `business_profiles`, `client_correspondence`, `services`, `service_requirements`.

### 3. Seed Requirements & Workflows for Remaining 24 Services
Add Ohio-specific requirements and workflow steps for:
- ID Verification / KYC, Employment Onboarding, Background Check Coordination
- Clerical Document Prep, PDF Services, Document Scanning, Document Cleanup
- Form Filling Assistance, Certified Doc Prep for Agencies
- Email Management, Consular Legalization Prep
- Business Subscription Plans, API & Integration Services, White-Label Partners
- Registered Agent Coordination, Secure Document Vault, Virtual Mailroom
- Automated Reminders, Template Library, Document Retention
- RON Onboarding Consulting, Document Workflow Audits, Custom Workflow Design

### 4. Seed Sample Lead Data
Insert 15-20 realistic Ohio leads across all pipeline stages (new, contacted, qualified, converted, closed) with varied intent scores and service needs.

### 5. Seed Lead Sources
Insert 4-5 lead source records (manual entry, Ohio SOS, signing platforms, referrals, social media).

### 6. Update Contact Info Placeholder
Replace `(614) 555-1234` with a configurable reference or a real-looking placeholder note on the Index page footer to avoid looking fake in production. Add a platform_setting for `notary_phone` and `notary_email` so these can be managed from admin settings.

---

## Technical Approach
- **Database migrations** for the `updated_at` triggers (schema changes)
- **Data insert tool** for time_slots, leads, lead_sources, service_requirements, service_workflows
- **Code edits** for the contact info on Index.tsx to pull from platform_settings or use a more production-ready approach
- No new tables or RLS changes needed

