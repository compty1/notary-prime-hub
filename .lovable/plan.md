

# Fix All Identified Issues — Implementation Plan

This plan addresses every fixable issue from both uploaded documents plus the cross-wiring analysis. Issues are grouped into implementable phases by dependency and risk.

---

## Scope Summary

- **55 cross-wiring issues** from the analysis document
- **~30 gaps/bugs** from the Comprehensive Analysis Report (sections 9.1-9.3)
- **~15 monetization/pricing features** from section 11-12
- **Total: ~85 distinct items** (some overlap between documents)

Many items (mobile app, multi-language UI, white-label portal, E-Verify integration) are out of scope for this platform. This plan covers everything that can be implemented in the current React/Supabase stack.

---

## Phase 1: Critical Security Fixes (7 changes)

### 1.1 Remove client-side payment status mutation
- **File:** `src/pages/ClientPortal.tsx` line 667
- Remove the `.update({ status: 'paid' })` call from PaymentForm onSuccess
- Replace with a "Processing..." state that listens for realtime payment updates from stripe-webhook

### 1.2 Create delete-account edge function
- **New file:** `supabase/functions/delete-account/index.ts`
- JWT auth + user verification, single transaction: delete document_reminders, reviews, chat_messages, documents, appointments, storage files, profiles, user_roles, then `auth.admin.deleteUser()`
- Update ClientPortal.tsx line 826 to call this function instead of 7 sequential deletes

### 1.3 Add JWT auth to extract-email-leads
- **File:** `supabase/functions/extract-email-leads/index.ts`
- Add Authorization header check, getUser(), admin role verification (same pattern as discover-leads)

### 1.4 Add JWT auth to hubspot-sync
- **File:** `supabase/functions/hubspot-sync/index.ts`
- Add Authorization header check, getUser(), admin role verification

### 1.5 Add JWT auth to scrape-social-leads
- **File:** `supabase/functions/scrape-social-leads/index.ts`
- Same JWT + admin role pattern

### 1.6 Fix e-seal hash to use actual document content
- **File:** `src/pages/RonSession.tsx` lines 662-669
- Download document from storage bucket, compute SHA-256 of file bytes instead of metadata string

### 1.7 Add booking slot capacity locking
- **New migration:** Create a database function `check_and_reserve_slot` with `SELECT ... FOR UPDATE` to prevent double-booking race condition

---

## Phase 2: Broken Data Flows (8 changes)

### 2.1 Wire cancelReason to database
- **File:** `src/pages/ClientPortal.tsx` line 197
- Add `cancel_reason: cancelReason` to the `.update()` call
- Pass cancelReason in the cancellation email body

### 2.2 Fix AdminOverview revenue source
- **File:** `src/pages/admin/AdminOverview.tsx` line 68
- Change from `notary_journal.fees_charged` sum to `payments` table with `status='paid'` sum

### 2.3 Fix AdminOverview client count
- **File:** `src/pages/admin/AdminOverview.tsx` line 72
- Use distinct client_id count from appointments instead of profiles count

### 2.4 Persist e-sign consent immediately
- **File:** `src/pages/RonSession.tsx`
- Save consent to `notarization_sessions` on capture, not just at finalization

### 2.5 Add RON session auto-save
- **File:** `src/pages/RonSession.tsx`
- Add 30-second interval auto-save of session state to `notarization_sessions`

### 2.6 Fix guest booking flow
- **File:** `src/pages/ClientPortal.tsx`
- Add useEffect on mount to check sessionStorage for `pendingBooking` and auto-submit

### 2.7 Multi-document journal entries
- **File:** `src/pages/RonSession.tsx`
- Loop through all session documents and create individual journal entries per Ohio ORC §147.141

### 2.8 Add commission expiry gate to RON session
- **File:** `src/pages/RonSession.tsx`
- Already partially implemented (lines 756-777) — verify it runs on mount and blocks session creation

---

## Phase 3: Dead & Missing Wires (9 changes)

### 3.1 Wire PortalCorrespondenceTab
- **File:** `src/pages/ClientPortal.tsx` lines 568-590
- Replace inline correspondence JSX with `<PortalCorrespondenceTab>` import

### 3.2 Wire PortalServiceRequestsTab
- **File:** `src/pages/ClientPortal.tsx` lines 694-708
- Replace inline requests JSX with `<PortalServiceRequestsTab>` import

### 3.3 Wire PortalLeadsTab
- **File:** `src/pages/ClientPortal.tsx`
- Add TabsTrigger + TabsContent for leads tab using existing PortalLeadsTab component

### 3.4 Implement notification bell dropdown
- **File:** `src/pages/ClientPortal.tsx`
- Add Popover to Bell icon showing pending payments, upcoming appointments, unread chats

### 3.5 Implement portal search bar
- **File:** `src/pages/ClientPortal.tsx`
- Wire search input to filter appointments, documents, payments with fuzzy matching

### 3.6 Wire send-welcome-sequence
- **File:** `src/pages/BookAppointment.tsx` or auth trigger
- Invoke `send-welcome-sequence` on successful signup

### 3.7 Wire send-followup-sequence
- Invoke `send-followup-sequence` on appointment completion in RonSession finalization

### 3.8 Fix Remember Me checkbox
- **File:** `src/pages/Login.tsx`
- Use rememberMe value to set session persistence (sessionStorage vs localStorage)

### 3.9 Add realtime filters
- **File:** `src/pages/ClientPortal.tsx` line 165
- Add `filter: 'client_id=eq.${user.id}'` to appointments channel subscription

---

## Phase 4: Profile Validation & UX (5 changes)

### 4.1 Add profile form validation
- **File:** `src/pages/ClientPortal.tsx` saveProfile function
- Add Zod validation: full_name required, phone format check, zip 5-digit check

### 4.2 Consolidate portal tabs (14 → grouped)
- **File:** `src/pages/ClientPortal.tsx`
- Group tabs into sections with overflow scroll on mobile

### 4.3 Fix cookie consent / mobile FAB overlap
- **Files:** `src/components/CookieConsent.tsx`, `src/components/MobileFAB.tsx`
- Add z-index management and bottom offset coordination

### 4.4 Add appointment_id to mobile QR upload
- **File:** `src/pages/ClientPortal.tsx` QR URL generation
- Include appointment_id parameter in QR URL so uploaded docs link to the appointment

### 4.5 Auto-save AI tool generations
- **File:** `src/components/ai-tools/ToolRunner.tsx`
- Auto-save generation result as draft after successful AI response

---

## Phase 5: Compliance & Integrations (6 changes)

### 5.1 Early Ohio vital records check
- **File:** `src/pages/BookAppointment.tsx`
- Run `checkDocumentEligibility()` on serviceType change, not just at submit

### 5.2 Wire SignNow webhook to documents table
- **File:** `supabase/functions/signnow-webhook/index.ts`
- Map `document.completed` events to documents table status updates

### 5.3 Add subscription event handlers to stripe-webhook
- **File:** `supabase/functions/stripe-webhook/index.ts`
- Handle `customer.subscription.created/updated/deleted` → update `profiles.plan`

### 5.4 Unify CRM pipeline stages
- **Files:** `src/pages/admin/AdminLeadPortal.tsx`, `src/pages/admin/AdminCRM.tsx`
- Align on consistent pipeline stage definitions

### 5.5 Use enqueue_email for reliable delivery
- Replace fire-and-forget edge function calls with email queue pattern

### 5.6 Fix DocuDex auto-save reliability
- Ensure auto-save writes to backend, not just local state, with error toast on failure

---

## Phase 6: Monetization & Pricing (new tables + UI)

### 6.1 Database tables
- **New migration:** Create `user_subscriptions`, `usage_tracking`, `pricing_rules`, `promo_codes`, `price_change_log`, `service_add_ons` tables with RLS

### 6.2 AI tools paywall
- Add usage counting in `ai-tools` edge function
- Check subscription tier before processing

### 6.3 Subscription management UI
- **New component:** SubscriptionManager in client portal
- Wire to Stripe Subscriptions via webhook

### 6.4 Admin pricing rules editor
- **File:** `src/pages/admin/AdminServices.tsx`
- Add Pricing Rules tab with rule builder UI

---

## Phase 7: Missing Pages & Features (4 changes)

### 7.1 Accessibility statement page
- **New file:** `src/pages/Accessibility.tsx`
- WCAG 2.1 AA compliance statement

### 7.2 Activate high-demand inactive services
- Database update: Set `is_active = true` for I-9, ID/KYC, Clerical Doc Prep

### 7.3 Service-specific FAQ pages
- **File:** `src/pages/ServiceDetail.tsx`
- Add FAQ section per service using service metadata

### 7.4 Session timeout persistence across tabs
- **File:** `src/contexts/AuthContext.tsx`
- Listen for `TOKEN_REFRESHED` event and update timeout timers

---

## Technical Details

- **Total files modified:** ~25
- **New files:** ~5 (delete-account edge function, accessibility page, database migrations)
- **New database tables:** 6 (for monetization/pricing)
- **Edge functions modified:** 5 (security fixes)
- **Estimated implementation:** 7 phases, each self-contained

All changes follow existing patterns: Supabase client imports from `@/integrations/supabase/client`, edge functions use manual CORS headers, JWT auth uses `getUser()` + role check pattern from discover-leads.

