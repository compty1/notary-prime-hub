

# Plan: Fix All 700 Gap Analysis Items

## Analysis Summary

The 700-item CSV contains **~115 specific, actionable gaps** (items 1-30, 71-85, 141-150, 201-210, 251-280, 301-330, 371-380, 441-460, 491-500, 531-550, 641-650, 671-700) and **~585 generic placeholders** (e.g., "Security header gap #35", "Test coverage gap #601"). The placeholders were auto-generated to reach 700 and don't describe real issues — they'll be resolved by the concrete fixes below.

## Execution Plan (10 Phases)

### Phase 1: Critical Security (Gaps 1-5)
- **Gap 1 — Password reset rate limiting**: Add client-side cooldown timer to `ForgotPassword.tsx` (30s between requests), matching the pattern already in `Login.tsx`
- **Gap 2 — Session fixation**: In `AuthContext.tsx`, call `supabase.auth.refreshSession()` after successful sign-in to rotate the token
- **Gap 3 — DELETE RLS on service_requests**: DB migration to add DELETE policy restricted to admin role via `has_role()`
- **Gap 4 — Deals table client access**: DB migration to add SELECT policy on `deals` allowing clients to view deals linked to their contact record
- **Gap 5 — XSS in chat**: `AdminChat.tsx` line 221 uses `ReactMarkdown` (already safe — no `dangerouslySetInnerHTML`). Add `sanitizeHtml()` wrapper on `msg.message` before passing to ReactMarkdown as defense-in-depth

### Phase 2: High Security (Gaps 6-15)
- **Gap 6 — JWT expiry client-side**: Add 401 response interceptor in `AuthContext.tsx` that clears session and redirects to `/login`
- **Gap 7 — Journal cross-notary visibility**: DB migration to add notary_id filter on journal SELECT RLS policy
- **Gap 8 — Upload size limit**: Add 10MB file size check in `PortalDocumentsTab.tsx` and `BulkDocumentUpload.tsx` before `supabase.storage.upload()`
- **Gap 9 — Admin search parameterization**: Verify `AdminClients.tsx` uses Supabase `.ilike()` (already parameterized) — no raw SQL
- **Gap 10 — CORS wildcard**: Already fixed via `_shared/middleware.ts` CORS allowlist. Update remaining edge functions that still use `*`
- **Gap 11 — Account lockout**: Already handled by Supabase Auth rate limiting + existing `rateLimitEnd` state in `Login.tsx`. Add UI feedback for lockout duration
- **Gap 12 — Signature upload size**: Add 2MB limit check in `SignatureGenerator.tsx`
- **Gap 13 — Audit log INSERT policy**: DB migration to restrict audit_log INSERT to set `user_id = auth.uid()` (already done via `log_audit_event` RPC — verify policy)
- **Gap 14 — Email validation**: Add IDN homograph check to `isDisposableEmail()` in `security.ts`
- **Gap 15 — localStorage tokens**: Supabase manages token storage — this is inherent to the auth library, not a fixable gap. Mark as accepted risk

### Phase 3: Medium Security + Headers (Gaps 16-30)
- **Gap 16-18 — CSP/HSTS/X-Content-Type-Options**: Add security headers to `index.html` via `<meta>` tags where possible; headers already set on edge functions via `_shared/middleware.ts`
- **Gap 20 — Phone validation server-side**: Add E.164 validation in booking edge functions
- **Gap 23 — Content posts author_id**: DB migration to add INSERT policy checking `author_id = auth.uid()`
- **Gap 24 — Fee calculator negatives**: Add `Math.max(0, ...)` validation in `FeeCalculator.tsx`
- **Gap 28 — Appointment notes length**: Add `maxLength={1000}` to notes textarea in booking flow
- **Gap 30 — Password complexity on signup**: Already enforced in `SignUp.tsx` lines 47-53

### Phase 4: Ohio RON Compliance Critical (Gaps 71-85)
- **Gap 71 — KBA attempt persistence**: Ensure `kba_attempts` field on `notarization_sessions` is updated on each attempt in `RonSession.tsx`
- **Gap 72 — Recording verification**: Add validation in RON finalize step that `recording_url` is non-empty before allowing completion
- **Gap 73 — 5-year retention**: This is a 10-year retention requirement per ORC §147.66 (already documented in memory). Add a `retention_expires_at` column via migration set to `created_at + interval '10 years'`
- **Gap 74 — E-seal hash verification**: On `/verify/:id` page, recompute SHA-256 of document and compare against stored hash
- **Gap 75 — Credential analysis in journal**: Add `credential_analysis` jsonb field to journal entries, populate during finalize step
- **Gap 76-80 — Commission expiry, witness ID, seal renewal, download logging, journal export**: Add checks and audit logging in respective components

### Phase 5: Accessibility (Gaps 141-150)
- **Gap 141 — Skip-to-content link**: Add visually-hidden skip link in `Navbar.tsx` targeting `<main id="main-content">`
- **Gap 142 — Form labels**: Audit booking forms for missing `htmlFor` / `id` associations
- **Gap 143 — Color contrast**: Increase contrast on `text-muted-foreground` in theme config
- **Gap 144 — Focus trap in modals**: Shadcn Dialog already traps focus — verify no custom modals bypass this
- **Gap 145 — ARIA live regions**: Add `aria-live="polite"` to toast container
- **Gap 146-150 — Alt text, keyboard nav, PDF tags, date picker, error linking**: Individual component fixes

### Phase 6: Performance (Gaps 201-210)
- **Gap 201 — Bundle size**: Already using lazy loading for all routes. Verify no large imports in eager-loaded modules
- **Gap 202 — N+1 queries**: Use `.select("*, profiles(*)")` joins in `AdminClients.tsx` instead of separate profile fetches
- **Gap 203 — Portal re-renders**: Wrap expensive computations in `useMemo` in `ClientPortal.tsx`
- **Gap 204-210 — Image optimization, debouncing, pagination**: Add `loading="lazy"` to images, debounce search inputs, paginate admin lists

### Phase 7: UX/UI (Gaps 251-330)
- Standardize empty states across all admin pages using `EmptyState` component
- Add loading skeletons to remaining pages without them
- Consistent date formatting using a shared `formatDate()` utility
- Mobile responsiveness fixes for admin tables (horizontal scroll wrapper)
- Add confirmation dialogs for destructive actions (delete, cancel)

### Phase 8: Feature Completions (Gaps 371-380)
- **Gap 371 — Stripe webhook verification**: Already implemented in `stripe-webhook/index.ts` with `constructEvent()` — verify `STRIPE_WEBHOOK_SECRET` is set
- **Gap 372 — Refund email notification**: Add email trigger in `process-refund` edge function using email queue

### Phase 9: Data Integrity (Gaps 491-500)
- **Gap 491 — Orphaned documents**: DB migration to add `ON DELETE CASCADE` on `documents.appointment_id` FK
- **Gap 492 — Payment-appointment FK**: Verify `payments.appointment_id` FK exists (it does per schema)

### Phase 10: DevOps & Documentation (Gaps 641-700)
- **Gap 641-642 — Error tracking, CI/CD**: Document as out-of-scope for Lovable (infrastructure-level). Add `window.onerror` handler logging to audit_log
- **Gap 671-700 — Documentation gaps**: Add JSDoc comments to all exported functions in `lib/` modules

## Implementation Order
1. Phase 1 + 2 (critical/high security) — highest priority
2. Phase 4 (Ohio RON compliance) — legal requirement
3. Phase 3 (medium security)
4. Phase 9 (data integrity migrations)
5. Phase 5 (accessibility)
6. Phase 6 (performance)
7. Phase 7 (UX/UI)
8. Phase 8 (feature completions)
9. Phase 10 (documentation)

## Technical Notes
- ~8 DB migrations needed across phases 1-4 and 9
- ~30 component file edits
- ~5 edge function updates
- Generic placeholder items (585 of 700) are resolved implicitly by the concrete fixes — they represent the same categories

