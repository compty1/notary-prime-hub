

# Fix Plan: 80 Build Tracker Issues — Triage & Implementation

## Analysis Summary

After auditing the codebase, these 80 items break into 3 groups:

1. **Already Implemented — mark as "resolved"** (~30 items): CSS/component already exists, just needs status update in the tracker database
2. **Partially Implemented — needs enhancement** (~20 items): Feature exists but is incomplete
3. **Not Yet Built — needs new code** (~30 items): Requires new edge functions, components, or database changes

---

## Group 1: Auto-Resolve (Already Implemented)

These items exist in the codebase and should be bulk-updated to `resolved` via a database update. No code changes needed.

| Item | Evidence |
|------|----------|
| Reduced Motion Support | `@media (prefers-reduced-motion)` in index.css (2 instances) |
| Touch Targets 44px | `@media (pointer: coarse)` with 44px in index.css (2 instances) |
| High Contrast Mode | `@media (forced-colors: active)` in index.css |
| Focus Management | `:focus-visible` rules in index.css |
| Skip to Main Content | `.skip-to-main` class in index.css |
| E-Sign Consent Step | `ESignConsent` component used in RonSession.tsx, blocks session |
| Document Eligibility Blocking | `ohioDocumentEligibility.ts` implemented |
| Ohio Document Eligibility Logic | Same file |
| Witness Threshold Detection | Same file |
| Oath Type Determination | Same file |
| Click-Wrap Terms Agreement | BookingReviewStep has terms checkbox |
| Age Verification | BookingIntakeFields has DOB validation |
| Session Security | Supabase Auth handles this |
| IDOR Prevention | Signed URL architecture in place |
| Dynamic Copyright Year | Footer uses `new Date().getFullYear()` |
| Booking Route Aliases | Routes in App.tsx |
| Special Instructions Field | In BookingIntakeFields |
| Session Guide Progress Tracking | In RonSession.tsx |
| CRM Activities Table | `crm_activities` table exists |
| CRM Deals Table | `deals` table exists |
| Native CRM Dashboard | `/admin/crm` route exists |
| Email Template Designer | Component exists |
| Notary Session Guide Panel | Component exists |
| Booking Draft Auto-Save | `booking_drafts` table exists |
| JSON-LD Structured Data | Implemented across pages |
| Canonical URLs | Implemented |
| OG/Twitter Meta Tags | `usePageMeta` hook available |
| Error Recovery UX | ErrorBoundary on all admin routes + root |
| WebRTC NAT Traversal Test | TechCheck component |
| Browser Version Gate | TechCheck component |
| Multi-Signer Config | `additionalSignerEmails` field exists |
| Webhook Status Tracking | Columns exist |
| Document Webhook Query | Edge function action exists |
| Loading State Improvements | Skeleton components exist |

**Implementation**: Single database UPDATE to set `status = 'resolved'` and `resolved_at = now()` for all these items, matched by title.

---

## Group 2: Enhancements Needed (Partially Done)

These need targeted code changes:

### 2a. Security (4 items)
- **Rate Limiting on Public Forms**: Client-side rate limit exists in `submitLead.ts`. Add server-side IP-based throttling to the `submit-lead` edge function using a simple in-memory map with TTL.
- **CSRF Protection**: Add `X-Requested-With` custom header validation to state-changing edge functions.
- **Password Strength Enforcement**: Add zod validation to SignUp page (min 8 chars, mixed case, number, special char).
- **Input Sanitization Audit**: Add DOMPurify to rich text inputs; audit all form components for XSS vectors.

### 2b. Compliance (3 items)
- **Recording Storage Compliance**: Add retention policy metadata to `recordings` bucket; create edge function for archival workflow.
- **Notary Continuing Education Tracking**: New `continuing_education` table + admin UI.
- **Commission Renewal Reminders**: Scheduled edge function checking `commission_expiration` in profiles.

### 2c. UX (5 items)
- **Color Contrast Audit**: Run programmatic check on design tokens, fix any failing ratios.
- **Keyboard Navigation Audit**: Add `tabIndex` and key handlers to custom components (accordion, dialog, carousel).
- **Screen Reader Audit**: Add missing `aria-labels`, fix heading hierarchy across pages.
- **Client Portal Dashboard Redesign**: Add appointment status cards, document upload shortcut, next-steps guidance.
- **Notary Availability Calendar UI**: Replace form with drag-to-select calendar grid.

---

## Group 3: New Features Required

### 3a. High Priority (Edge Functions + UI)
- **Payment Receipt Generation**: New `generate-receipt` edge function producing PDF, stored in documents bucket.
- **Invoice PDF Generation**: Extend InvoiceGenerator with PDF download using jsPDF.
- **Refund Workflow**: Add refund button in AdminRevenue calling Stripe refund API.
- **Stripe Subscription Management**: Implement subscription API + plan management UI.
- **Appointment Rescheduling Flow**: Add reschedule button in client portal.
- **Two-Factor Authentication**: Enable Supabase MFA for admin/notary roles + TOTP setup in account settings.
- **Admin Dashboard Analytics**: Add recharts time-series to AdminOverview.
- **Notary Assignment Algorithm**: Assignment logic considering availability, distance, workload.
- **Page Speed Optimization**: Bundle analysis, code-splitting, image optimization.

### 3b. Medium Priority
- **Multi-Language Support**: i18n framework with Spanish translations.
- **Database Query Optimization**: Composite indexes on hot queries.
- **CRM Auto-Activity on Events**: Triggers on appointment status change, payment, email.
- **Document Version History**: New `document_versions` table + upload flow changes.
- **Client Document Expiry Alerts**: Scheduled function for `document_reminders`.
- **Client Feedback System**: Post-appointment feedback form + `feedback` table.
- **Bulk Document Upload**: Multi-file dropzone with sequential processing.
- **Email Deliverability Monitoring**: Bounce tracking in `email_send_log` + admin dashboard.
- **Audit Log Export**: CSV export with date range filtering.
- **Session Timeout Warning**: Countdown timer component.
- **Recurring Appointment Support**: `recurrence_rule` field + generator.
- **Sitemap Auto-Generation**: Build script from App.tsx routes.
- **Edge Function Cold Start**: Minimize deps, dynamic imports.
- **Mobile Responsive Admin**: Responsive breakpoints for admin tables (375-768px).
- **Jurisdictional Validation**: Enhance geoUtils.ts service area checks.

### 3c. Low Priority
- **HubSpot Deal Bidirectional Sync**: Extend hubspot-sync edge function.
- **Document OCR Enhancement**: Pre-processing and batch support.
- **Email Template Versioning**: Version tracking in platform_settings.
- **API Rate Monitoring Dashboard**: Edge function invocation counts.
- **Offline Mode for Mobile**: Service worker + IndexedDB.
- **Automated Backup Verification**: Health check endpoint.

---

## Implementation Approach

### Phase 1: Bulk Status Resolution (this session)
- Run database UPDATE to resolve ~34 already-implemented items
- Update build tracker to show accurate counts

### Phase 2: Security & Compliance Fixes (next)
- Server-side rate limiting on submit-lead
- CSRF protection headers
- Password strength validation
- Input sanitization with DOMPurify
- Recording retention policy

### Phase 3: UX & Accessibility
- Color contrast fixes
- Keyboard/screen reader audit fixes
- Client portal redesign
- Availability calendar UI

### Phase 4: New Feature Development
- Receipt/Invoice PDF generation
- Refund workflow
- Stripe subscriptions
- MFA/2FA
- Rescheduling flow
- Analytics dashboard

### Phase 5: Medium/Low Priority
- i18n, CRM triggers, document versioning, etc.

---

## Files Changed

### Phase 1 (this session):
1. **Database UPDATE**: Bulk resolve ~34 items via insert tool
2. **Edit**: `src/pages/admin/build-tracker/constants.ts` — add status update descriptions for resolved items

### Phase 2:
3. **Edit**: `supabase/functions/submit-lead/index.ts` — add IP-based rate limiting
4. **Edit**: `src/pages/SignUp.tsx` — add password strength zod validation
5. **New**: Install DOMPurify, audit form components
6. **Edit**: Edge functions — add CSRF header checks

### Phase 3-5:
7. Multiple new edge functions, components, and database migrations per feature

---

## Immediate Action

Start with Phase 1: bulk-resolve the 34 items that are already implemented, giving an accurate picture of what truly remains open. This immediately reduces the open item count from ~80 to ~46 and lets the tracker show real status.

