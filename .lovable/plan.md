

# Implementation Plan: Address Build Tracker Issues, Fix Live Preview, Fix Email Display

This plan addresses all 35 items from the uploaded CSV, fixes the Live Preview tab to show real theme changes, and fixes the email mailbox to properly display sender info/subject like a normal inbox.

---

## 1. Fix Live Preview Tab — Real Theme Overlay Support

**Problem:** The `LivePreviewTab` accepts a `themeOverlay` prop but never passes it to the iframe. The parent `AdminBuildTracker` never passes `themeOverlay` to `LivePreviewTab`. Theme changes from ThemeExplorerTab have no way to appear in the preview.

**Fix:**
- Update `LivePreviewTab.tsx` to inject theme CSS variables into the iframe via `postMessage` after load, and add a URL-based route param for navigating within the preview
- Add a "Preview with page navigation" input so admin can navigate to specific routes inside the iframe
- Connect ThemeExplorerTab's selected theme to LivePreviewTab via shared state in `AdminBuildTracker.tsx` (pass `themeOverlay` prop when on preview tab)
- Add `useEffect` in LivePreviewTab that uses `iframe.contentWindow.postMessage` to send CSS variable overrides when `themeOverlay` changes
- Add a listener script concept — since cross-origin iframes can't be directly styled, add a `?theme=` query param approach that the app reads on load from `useSearchParams` to apply CSS overrides

**Files:** `LivePreviewTab.tsx`, `AdminBuildTracker.tsx`, `ThemeExplorerTab.tsx`

---

## 2. Fix Email Mailbox Display — Show Sender Info, Subject Properly

**Problem:** The email list in `AdminMailbox.tsx` already renders `from_name`, `from_address`, `subject`, and `date` correctly in the UI (lines 460-474). The real issue is that when `callEdgeFunction("ionos-email")` fails (which is the common case when IMAP sync hasn't run), the fallback queries `email_cache` but the cache may be empty or have null fields.

**Fix:**
- Improve the email list row display to show a proper snippet/preview line below the subject (first ~80 chars of body_text)
- Add body_text to the list query select in `ionos-email` edge function (line 97) so previews can show
- Add a visual indicator for email direction (sent vs received) in the list
- Ensure the fallback local query also fetches `body_text` for preview
- Show "from" for inbox, "to" for sent folder in the list header

**Files:** `AdminMailbox.tsx`, `supabase/functions/ionos-email/index.ts`

---

## 3. Address Critical Compliance Items (CSV rows 4, 8, 9)

**Ohio ORC §147.66 KBA limit enforcement (critical):**
- The database trigger `enforce_kba_limit` was created in a previous migration. Verify it's referenced in the RON session UI. Add explicit UI enforcement: when `kba_attempts >= 2`, disable the KBA retry button and show a compliance warning.

**Notary journal completeness check (critical):**
- Add a compliance banner on the RON session finalize step that warns if no journal entry exists for the appointment.

**RON recording consent verification (critical):**
- The `RonSession.tsx` already has `recordingConsent` state and checks. Add a hard block: cannot proceed past Session Setup step unless `recording_consent === true`. Show ORC §147.63 citation.

**Files:** `RonSession.tsx`

---

## 4. Address RON Session Flow Issues (CSV rows 10, 11)

**Signing Platform API mode is placeholder:**
- Add informational text in RonSession that the signing platform integration uses a link-based workflow (per the project's integration strategy), not a live API. Remove any misleading "API Mode" labeling.

**Files:** `RonSession.tsx`

---

## 5. Address SEO Meta Tags (CSV row 7)

**29 public pages may lack SEO meta tags:**
- Add `usePageMeta()` calls with unique title, description, and OG tags to the top ~15 most important public pages that are missing them: `About`, `Services`, `FeeCalculator`, `SignerRights`, `NotaryGuide`, `RonInfo`, `LoanSigningServices`, `Resources`, `HelpSupport`, `BookAppointment`, `TermsPrivacy`, and all 6 solution pages.

**Files:** ~15 page files in `src/pages/`

---

## 6. Address Platform Entity Issues (CSV rows 3, 5, 12)

**Authentication & Security — MFA needs_attention:**
- Add a placeholder MFA settings section in `AccountSettings.tsx` with a note that MFA is available through the authentication system.

**Payments & Billing — Refund Processing:**
- The `process-refund` edge function exists. Add a refund confirmation UI step in the admin payment views.

**CRM & Leads — HubSpot Sync:**
- The `hubspot-sync` edge function exists. Add a status indicator in the Integration Hub showing sync status.

**Files:** `AccountSettings.tsx`, admin payment components

---

## 7. Address Content Gaps (CSV rows 2, 13, 14)

**Services missing FAQs, descriptions, turnaround times:**
- These are database content issues, not code issues. Add an admin prompt/banner on the Services management page reminding the admin to fill in missing FAQs, descriptions, and turnaround estimates.

**Files:** `AdminServices.tsx`

---

## 8. Address Mobile Responsiveness (CSV row 6)

- Add responsive classes to admin tables: horizontal scroll on mobile, stack form fields vertically, ensure dialogs are full-width on small screens. Focus on `AdminOverview`, `AdminAppointments`, and `AdminClients` as highest-impact pages.

**Files:** Admin page components

---

## 9. Address Workspace Desk Items (CSV rows 15-34)

These are feature specs for a Content Workspace. The `AdminContentWorkspace.tsx` page exists. Verify its completeness against the listed requirements:
- Rich text editor integration (exists via `RichTextEditor.tsx`)
- Content listing and filtering
- Live preview
- AI content generation
- Image upload
- Content storage model
- Integration with services catalog

Enhance `AdminContentWorkspace.tsx` to cover any missing functionality from the 20 workspace desk items.

**Files:** `AdminContentWorkspace.tsx`

---

## 10. Runtime Error Fix

**MutationRecord attributeName error:** This is from the Lovable session replay library (`lovable.js`), not from project code. It cannot be fixed from within the project. No action needed.

---

## Summary of Changes

| Area | Files Changed | Items Addressed |
|------|--------------|-----------------|
| Live Preview + Theme | 3 files | CSV row 17, theme overlay |
| Email Mailbox | 2 files | Email display fix |
| RON Compliance | 1 file | CSV rows 4, 8, 9, 10, 11 |
| SEO Meta | ~15 files | CSV row 7 |
| Platform Entities | 2-3 files | CSV rows 3, 5, 12 |
| Content Gaps | 1 file | CSV rows 2, 13, 14 |
| Mobile | 3 files | CSV row 6 |
| Workspace Desk | 1 file | CSV rows 15-34 |

