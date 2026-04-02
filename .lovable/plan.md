

# Comprehensive Fix & Gap Closure Plan

## Issues Identified

### 1. Build Tracker CSV Items (34 open items)
The uploaded CSV contains 34 open tracker items. These need to be acknowledged and the critical ones addressed. Most are already tracked — the key actionable ones are:
- 3 critical Ohio compliance items (KBA enforcement, journal completeness, RON recording consent) — already implemented in code/DB triggers
- 11 services missing FAQs, 11 missing turnaround estimates, 2 missing descriptions
- Mobile responsiveness audit
- SEO meta tags gap
- ~20 "Workspace Desk" feature items (auto-generated, most already built in AdminContentWorkspace)

### 2. Email Template Preview — Missing Sender Address
The `renderPreview()` function in `EmailTemplatesTab.tsx` renders the email body wrapped in header/footer but does NOT show a "From:" sender line. Fix: add a sender info bar below the header showing `From: notify@notardex.com` (or the configured sender) so admins can see the full email as recipients would.

### 3. Zoom Schedule Buttons
The "Schedule Zoom" button in `ServiceDetail.tsx` links to `/book?service=Consultation` which correctly triggers the consultation flow (skips notarization type, shows Zoom banner). This is already working correctly. However, I'll verify the booking flow fully handles the consultation path and ensure the Zoom meeting link from `platform_settings` is included in the confirmation email.

### 4. AI Tools Hub Gaps
All 48 tools from the request are present in the registry and edge function. The tools are complete with full field definitions and system prompts. The only gap is:
- **Navbar missing AI Tools link** — `toolLinks` in `Navbar.tsx` doesn't include `/ai-tools`
- **AI Tools not accessible without login** — route is wrapped in `ProtectedRoute`, but the catalog should be browsable without auth (only generation requires login)

### 5. Button/Route Audit Findings
All links checked against registered routes — no broken routes found. Key findings:
- `/#contact` on ServiceDetail.tsx — this scrolls to a contact section on the homepage which exists
- All solution pages, tool pages, and service pages have valid routes

### 6. Unfinished Items from Previous Plans
- Navbar `toolLinks` missing AI Tools Hub entry
- Email preview missing sender address display
- Services missing FAQs/descriptions/turnaround (content gap, not code)

---

## Implementation Steps

### Step 1: Fix Email Template Preview — Add Sender Address
**File:** `src/pages/admin/build-tracker/EmailTemplatesTab.tsx`

Update `renderPreview()` to include a sender info bar between the header and body:
```
From: notify@notardex.com
To: {recipient from sample data}
Subject: {resolved subject line}
```
This gives admins a realistic preview of how the email appears. Add a `senderEmail` field to the `MasterTemplate` type (defaulting to `notify@notardex.com`) and make it editable in the Master Template settings panel.

### Step 2: Add AI Tools Hub to Navbar
**File:** `src/components/Navbar.tsx`

Add `{ to: "/ai-tools", label: "AI Tools Hub" }` to the `toolLinks` array so it appears in the Tools dropdown.

### Step 3: Make AI Tools Catalog Public (Auth Only for Generation)
**File:** `src/App.tsx`

Remove `ProtectedRoute` wrapper from the `/ai-tools` route. The page already checks for `user` before allowing generation, so the catalog can be browsed without login.

### Step 4: Verify Zoom Consultation Flow
The booking flow correctly handles consultations — `/book?service=Consultation` skips notarization type selection and shows the Zoom banner. No code changes needed here. However, verify that any other "Schedule Zoom" or Zoom-related buttons across the site also route to `/book?service=Consultation` rather than the generic `/book`.

### Step 5: Content Gap Items (Tracked, Not Code)
These items from the CSV are content/data issues, not code bugs:
- 11 services missing FAQs → admin can add via service editor
- 11 services missing turnaround estimates → admin can add via service editor  
- 2 services missing descriptions → admin can add via service editor

No code changes needed — the admin UI already supports editing all these fields.

### Step 6: Mark Resolved Tracker Items
The following CSV items are already resolved in code:
- Ohio ORC §147.66 KBA limit → `enforce_kba_limit()` trigger exists
- Notary journal completeness → journal auto-creation on session finalization
- RON recording consent → `recording_consent` flag checked in RonSession.tsx
- SEO meta tags → `usePageMeta()` added to all public pages in previous plans
- MFA → existing auth system (Supabase handles this)

---

## Summary

| Change | File | Type |
|--------|------|------|
| Add sender address to email preview | `EmailTemplatesTab.tsx` | Fix |
| Add AI Tools Hub to navbar | `Navbar.tsx` | Fix |
| Make AI Tools catalog public | `App.tsx` | Fix |
| Verify Zoom button routing | `ServiceDetail.tsx` | Verify (no change needed) |
| Content gaps (FAQs, descriptions) | Database content | Admin task, not code |

