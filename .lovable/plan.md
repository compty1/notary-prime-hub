

# Implement All Items from NewImplementations.docx

## Scope Assessment

The document contains **~890 items** (SVC-101 to SVC-861 + BTN/FRM/WFL/DASH/OPS/CNT/SEC/TST/ORG/DOC series). After cross-referencing the codebase, items fall into three buckets:

### Already Implemented (~120 items) -- Will Skip
- **SVC-111** Password strength: `PasswordStrengthMeter` component exists, Zod validation in `zodSchemas.ts`
- **SVC-112** Session timeout: `SessionTimeoutWarning` component active in RON sessions
- **SVC-156** Edge function input validation: Zod + rate limiting in `middleware.ts`
- **SVC-289** Cookie consent: Granular `CookieConsent` component with categories
- **SVC-124** Signature audit trail: `SignerIDVerificationLog` component exists
- **SVC-126** Pre-session tech check: `TechCheck` component exists
- **SVC-150** Health check endpoint: `health-check` edge function exists
- **SVC-151** Structured logging: `structuredLog()` in middleware
- **SVC-161** CSP headers: Already in `securityHeaders` in middleware
- **SVC-162** CSRF: `csrfProtection.ts` exists
- **SVC-163** XSS sanitization: `sanitize.ts` and `inputSanitization.ts` exist
- **BTN-001/002** Service CTAs: Service cards have CTAs
- **WFL-001** RON lifecycle: Full RON state machine exists
- **SEC-002** Audit logging: `audit_log` table + `log_audit_event()` function exist
- Plus many more already verified in prior implementation rounds

### Out of Scope for Lovable (~450 items) -- Will Document as Deferred
These require external infrastructure, CI/CD pipelines, third-party SaaS, or manual processes that cannot be built in a React frontend project:
- **CI/CD**: SVC-154/155/253-259/337/381-382/433/444-445/465-466 (Docker, GitHub Actions, test frameworks, pre-commit hooks)
- **Infrastructure**: SVC-152-153/231/233/270-271/296-298 (DB backups, autoscaling, CDN, multi-region storage)
- **External integrations requiring API accounts**: SVC-110 (SAML SSO), SVC-115/272 (OCR service), SVC-116 (credential analysis API), SVC-149 (Sentry), SVC-201/203 (DocuSign/Zoom), SVC-267-268 (Google Maps API), SVC-319 (sanctions screening)
- **DevOps/Process**: SVC-211-214/251-252/276-280/334-335/353-358/380/388-389 (runbooks, on-call, pen testing, whitepapers, case studies)
- **Testing**: SVC-215-218/256-258/309/336/382/488/542/678/712/722/732/748/756/764/780/788/796/810/826/834/842/850/858 (E2E tests, load tests, visual regression, contract tests)
- Hundreds of Low-priority "Local dev mock" items (SVC-334/487/689/711/721/731/739/747/755/763/771/779/787/795/809/817/825/833/841/849/857)

### Implementable in Lovable (~320 items) -- The Plan

Due to the massive scope, implementation will be organized into **10 batches** across multiple messages. Each batch targets a coherent domain.

---

## Batch 1: Core Service Architecture & Forms (SVC-001/002, BTN-003, FRM-001 to FRM-006, SVC-401, SVC-409)
1. **Create centralized service registry** (`src/lib/serviceRegistry.ts`) -- canonical list of all services with id, name, slug, category, paths, required fields, tags
2. **Create `ServicesMenu` component** -- dynamic nav menu from registry
3. **Enhance booking forms** with RON-specific fields (doc type, signer count, state, timezone, tech check confirmation), mobile-specific fields (address, parking, access notes), and loan signing fields (lender, loan type, page count)
4. **Standardize form validation** with shared Zod schemas per service type in `src/lib/validation/booking.ts`
5. **Enhance booking confirmation page** -- show full summary, fees, documents required, next steps
6. **Add service requirement badges** on service cards ("ID Required", "Remote Available")

## Batch 2: Workflow & Operations Dashboards (WFL-002 to WFL-004, DASH-001 to DASH-003, OPS-001 to OPS-003)
1. **Create unified Operations Dashboard** (`/admin/operations`) -- all open jobs grouped by service and status with filters and quick actions
2. **Add notary work queue dashboard** -- assigned jobs with accept/decline, status changes, notes
3. **Enhance client portal** -- "My Requests" view with status tracking, document upload links
4. **Add "Data Issues" admin section** -- records with missing fields or failed webhooks
5. **Link journal entries to jobs** bidirectionally -- button to create journal from job detail
6. **Surface fee calculations** on job detail pages with override justification

## Batch 3: Payments & Billing (SVC-101 to SVC-105, SVC-135-137, SVC-244-246, SVC-301-303, SVC-413, SVC-455, SVC-495, SVC-514, SVC-534, SVC-543)
1. **Idempotent webhook processing** -- store event IDs in `webhook_events`, skip duplicates (SVC-101, SVC-455)
2. **Partial refund UI** -- modal in admin billing with amount, reason, audit trail (SVC-102)
3. **Billing CSV export** -- date range and service type filters (SVC-105)
4. **Auto receipts** -- trigger receipt email on payment success (SVC-137)
5. **Map all Stripe webhook events** to internal states (SVC-543)
6. **Add tax line items and detailed invoices** (SVC-135-136)

## Batch 4: Security & Auth Hardening (SVC-113, SVC-160, SVC-164-165, SVC-166-167, SVC-193, SVC-195-196, SVC-223-224, SVC-285-288, SVC-343, SVC-351-352, SVC-397-398, SVC-420, SVC-461, SVC-471, SVC-481, SVC-523)
1. **MFA enforcement for notaries** -- policy check on sensitive routes (SVC-113)
2. **RLS audit** -- review tables and add missing policies using `has_role()` (SVC-160)
3. **Consent logging** -- `consent_log` table with version, timestamp, user_agent (SVC-166)
4. **Data deletion request flow** -- portal button to request deletion, admin job to anonymize (SVC-167, SVC-195, SVC-481)
5. **Data export tool** for user data access requests (SVC-196)
6. **Searchable audit logs** -- filters by actor, action, date, target; CSV export (SVC-224)
7. **Brute force protection** -- progressive lockout after failed attempts (SVC-285)
8. **Active sessions view** with device/IP and revoke option (SVC-288)
9. **PII masking in UI** -- show last4 for sensitive fields (SVC-352, SVC-523)
10. **Granular permissions matrix** for admin roles (SVC-223)
11. **Soft-disable accounts** with review workflow (SVC-471)
12. **Legal hold mechanism** -- flag records to suspend deletion (SVC-193)

## Batch 5: Notifications & Communication (SVC-107-109, SVC-129, SVC-269, SVC-385, SVC-402, SVC-503)
1. **Standardize email template library** with shared layout/footer and variables (SVC-107)
2. **SMS consent management** -- opt-in checkbox, consent flag, unsubscribe handling (SVC-108)
3. **Calendar sync** -- ICS generation and Google Calendar deep links on booking (SVC-129)
4. **Email bounce handling** -- process bounce webhooks, mark contacts invalid (SVC-385)
5. **Deep links in confirmation emails** (SVC-402)
6. **SMS reminders opt-in** (SVC-503)

## Batch 6: CRM, Analytics & Reporting (SVC-138-141, SVC-282, SVC-404-405, SVC-432, SVC-452)
1. **Standardize analytics events** -- define event taxonomy and wrapper (SVC-140)
2. **Funnel tracking** for booking flow (view -> start -> submit -> payment) (SVC-141)
3. **Per-service usage dashboards** -- bookings, completions, revenue per service (SVC-282)
4. **UTM/referral capture** on booking records (SVC-404)
5. **Booking lifecycle timestamps** -- scheduled_at, started_at, completed_at (SVC-452)
6. **CRM auto-tagging** by service usage (SVC-139)

## Batch 7: Document & Storage Enhancements (SVC-119, SVC-121-123, SVC-145, SVC-206-208)
1. **Document versioning** -- version table, upload creates new version, admin can restore (SVC-119)
2. **In-browser PDF viewer** with lazy loading (SVC-121)
3. **Redaction UI** with audit trail (SVC-122)
4. **Dynamic watermarking** on PDF generation (SVC-123)
5. **AI guardrails** -- confidence thresholds and human-in-the-loop for DocuDex (SVC-206)
6. **AI auto-fill confirmation step** before submit (SVC-208)

## Batch 8: Booking & Scheduling Enhancements (SVC-130-134, SVC-363-364, SVC-401, SVC-442, SVC-459, SVC-468, SVC-506, SVC-515, SVC-532)
1. **Reschedule conflict detection** with alternative slot suggestions (SVC-130)
2. **UTC timezone normalization** -- store UTC, display localized (SVC-131)
3. **No-show workflow** -- status, fees, notifications (SVC-132)
4. **Recurring availability** for notaries (SVC-133)
5. **Multi-step booking optimization** -- reduce steps, prefill, progress bar (SVC-363)
6. **Explicit consent checkboxes** on booking with timestamps (SVC-442)
7. **Inline validation on blur** for forms (SVC-468)
8. **Persist booking progress** in localStorage (SVC-515)
9. **Quick actions toolbar** on job detail (SVC-506)

## Batch 9: Compliance, Privacy & Legal (SVC-168-170, SVC-362, SVC-374, SVC-462, SVC-510, SVC-516, SVC-524)
1. **Per-service legal notes** linked from booking (SVC-168)
2. **Centralized retention policies** -- define per data type, enforce via scheduled cleanup (SVC-169)
3. **Audit export package** -- bundle job, journal, recordings, metadata with checksums (SVC-170, SVC-510)
4. **Evidence package builder** for disputes (SVC-362)
5. **Audit evidence viewer** for regulators (SVC-374)
6. **Centralize state rules** module with per-state validations (SVC-462)
7. **State-specific booking validations** (SVC-524)
8. **State-specific disclaimers** on service pages (SVC-516)

## Batch 10: UX, Accessibility & Content (SVC-171-175, SVC-219-222, SVC-234, SVC-247-250, SVC-291-293, SVC-304-306, SVC-331-333, SVC-409-411, SVC-437-439, SVC-443, SVC-454, SVC-458, SVC-463, SVC-469, SVC-477, SVC-484, SVC-489, SVC-498, SVC-525-526, SVC-529, SVC-537, SVC-699, SVC-735, SVC-751)
1. **WCAG 2.1 AA remediation** -- fix labels, focus order, contrast, skip links, ARIA (SVC-171)
2. **Keyboard navigation** -- tab order, keyboard handlers, focus outlines (SVC-172)
3. **ARIA live regions** for dynamic updates (SVC-173)
4. **Lazy-load heavy components** -- React.lazy for DocuDex, AI tools, admin charts (SVC-234)
5. **Helpful empty states** with actions and tips (SVC-220)
6. **Improved error pages** with recovery actions and request ID (SVC-221)
7. **Progressive disclosure** for complex forms (SVC-247)
8. **Autosave drafts** for long forms (SVC-248)
9. **Form prefill** for returning users (SVC-249)
10. **Contextual help tooltips** (SVC-250)
11. **Service filters** by availability and price (SVC-437)
12. **Service badges** ("Remote", "Same-day") (SVC-463)
13. **Per-service "What You Need" checklist** (SVC-751)
14. **Glossary of notary terms** (SVC-469)

---

## Output Artifacts
- **Updated CSV** at `/mnt/documents/notardex_full_implementation_status.csv` tracking all 890 items with status (Done/Implemented/Deferred/Out-of-Scope) and notes
- Each batch will be implemented sequentially across multiple messages

## Technical Approach
- All new components follow existing patterns (shadcn/ui, Tailwind, TypeScript)
- Database changes via migration tool where needed (consent_log, document_versions, etc.)
- New pages registered in `App.tsx` with lazy loading
- Existing edge functions enhanced (stripe-webhook idempotency, email bounce handling)
- No external API accounts required -- items needing them are deferred with documentation

## What Cannot Be Implemented in Lovable (Deferred ~450 items)
These will be documented in the CSV as "Deferred - requires external infrastructure":
- CI/CD pipelines, Docker, GitHub Actions
- Sentry/APM/RUM integration
- Third-party API integrations (Google Maps, DocuSign, Zoom, ClamAV, SCIM)
- Load testing, chaos testing, pen testing
- Local dev mocking servers
- Data warehouse ETL pipelines
- All "Local dev infra" items (SVC-334, 487, 689, etc.)

