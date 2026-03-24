

# Notar Platform — Rebrand, OneNotary Integration, Revenue Management, AI Chat Fixes & Educational Content

This plan covers 6 major workstreams across ~30 files.

---

## 1. Rebrand: "Shane Goble Notary" → "Notar" (NotarDex.com)

Every public-facing page has hardcoded "Shane Goble" branding, "SG" logos, and personal references across 33+ files.

**Approach:** Create a centralized brand config and update all references.

**Changes:**
- **Create `src/lib/brand.ts`** — Single source of truth for brand name ("Notar"), tagline ("Professional Notary & Document Services"), domain ("NotarDex.com"), logo initials ("N"), footer text, etc.
- **Update `index.html`** — Meta tags, JSON-LD structured data, canonical URL, OG tags: replace "Shane Goble Notary Public" with "Notar", update domain references (keep canonical as placeholder until domain connected)
- **Update nav/header in all pages** — Replace "SG" logo square with "N", "Shane Goble" → "Notar", tagline → "Notary & Document Services". Affected files:
  - `Index.tsx`, `About.tsx`, `Services.tsx`, `ServiceDetail.tsx`, `NotaryGuide.tsx`, `BookAppointment.tsx`, `ClientPortal.tsx`, `BusinessPortal.tsx`, `DocumentBuilder.tsx`, `AppointmentConfirmation.tsx`, `FeeCalculator.tsx`, `RonInfo.tsx`, `LoanSigningServices.tsx`, `TermsPrivacy.tsx`, `DocumentTemplates.tsx`, `DocumentDigitize.tsx`, `VirtualMailroom.tsx`, `SubscriptionPlans.tsx`, `VerifyIdentity.tsx`, `ServiceRequest.tsx`, `JoinPlatform.tsx`, `BlueNotarySession.tsx`, `OneNotarySession.tsx`, `RonEligibilityChecker.tsx`, `VerifySeal.tsx`
- **Update `About.tsx`** — Rewrite as a company page: "Notar is a team of Ohio-commissioned notaries led by Shane Goble." Add team structure section for future notaries.
- **Update footers** — All footer "© Shane Goble" → "© Notar"
- **Update document titles** — All `document.title` references
- **Update `WhatDoINeed.tsx`** — Print title "Shane Goble Notary" → "Notar"
- **Update edge function system prompts** — `client-assistant` and `notary-assistant`: update references from personal to company branding
- **Update `AppointmentConfirmation.tsx`** — VCALENDAR PRODID and description

---

## 2. OneNotary API Integration — Align with Official v2 Docs

The current edge function uses a simplified API that doesn't match the official spec. Key issues:

**Edge function updates (`supabase/functions/onenotary/index.ts`):**
- **Fix auth** — Replace `getClaims()` (doesn't exist in supabase-js) with `getUser()` for auth verification
- **Fix `create_session`** — Use `SessionRequestExtended` schema: add `external_id` (our appointment_id), `schedule_at`, `session_type`, `business_scenario` fields. Remove invented `callback_url` from body (webhooks are configured at account level, not per-session)
- **Fix `add_participant`** — Use `ParticipantRequestExtended`: include `first_name`, `last_name`, `phone_number`, `date_of_birth`, `address`, `external_id`, `custom` (for `signer_redirection_url`)
- **Fix `add_document`** — Support both JSON (base64) and URL-based uploads per the API docs. Current code sends `{name, url}` but API expects `{file: {name, content}}` for base64 or multipart
- **Add `list_sessions`** — GET /sessions for admin session listing
- **Add `download_document`** — GET /sessions/{id}/documents/{doc_id}/download
- **Add `get_stamps`** — GET /sessions/{id}/documents/{doc_id}/stamps for stamp placement data
- **Add `request_witness`** — POST /sessions/{id}/participants/witnesses/request
- **Add `set_notary`** — POST /sessions/{id}/notary to assign specific notary

**Webhook updates (`supabase/functions/onenotary-webhook/index.ts`):**
- **Add webhook signature verification** — Parse `X-Onenotary-Signature` header, verify HMAC SHA256 using API token
- **Align event names** — Use actual event types from docs: `session.status.updated_completed_successfully`, `session.status.updated_canceled`, `session.status.updated_session_started`, etc. (current code uses simplified `completed_successfully` etc.)
- **Handle additional events** — `session.updated_notary_assigned`, `session.updated_paused_*` events, `processing` status
- **Store session price** — Extract `data.price` from completed webhooks

**Frontend session page (`OneNotarySession.tsx`):**
- **Use correct session statuses** from the API lifecycle (created → invite_sent → draft → identity_check → ready_to_start → session_started → processing → completed_successfully)
- **Add `send_email` parameter** to init_session call
- **Display notary assignment info** when notary is assigned
- **Show document stamps** after completion

---

## 3. Revenue, Platform Fees & Income Tracking

**Update `AdminRevenue.tsx`:**
- Add configurable platform fee fields — OneNotary charges per session; add fields to track:
  - OneNotary platform fee per session (from session `price` field)
  - Notar service markup
  - Net notary income = client charge - OneNotary fee - platform cut
- Add fee breakdown per session type (RON vs in-person vs mobile)
- Add deposits/payouts tracking section — record when payments are collected vs disbursed to notaries
- Add notary-specific revenue view (for future multi-notary team)

**Database migration:**
- Add columns to `notary_journal`: `onenotary_fee` (decimal), `notary_payout` (decimal), `platform_markup` (decimal)
- Add `notary_payouts` table: `id`, `notary_user_id`, `period_start`, `period_end`, `gross_revenue`, `platform_fees`, `onenotary_fees`, `net_payout`, `status`, `paid_at`

---

## 4. AI Chat Fixes & Formatting

**Issue 1: Client-side chat renders plain text, not markdown**
- `ClientPortal.tsx` line 683: `<p>{msg.message}</p>` — doesn't render markdown
- **Fix:** Import `ReactMarkdown` and render messages with `prose` classes, same as `WhatDoINeed.tsx`

**Issue 2: Admin chat also renders plain text**
- `AdminChat.tsx` line 158: `{msg.message}` — same issue
- **Fix:** Add `ReactMarkdown` rendering with proper prose styling

**Issue 3: `WhatDoINeed.tsx` AI assistant — streaming works but error handling could be better**
- Add handling for 429 and 402 responses from the edge function with user-friendly toast messages

**Issue 4: Console warning about SelectContent ref**
- This is a known Radix UI warning, not a functional error. Low priority.

---

## 5. Educational Content for Notaries — Process Guides with Images

**Create `src/pages/NotaryProcessGuide.tsx`** — A comprehensive reference page for notaries covering:

- **Seal Placement Guide** — Diagrams/illustrations showing:
  - Where to place the notary seal on acknowledgments vs jurats
  - Correct seal positioning (near signature, not covering text)
  - Ohio seal requirements (name, "Notary Public", "State of Ohio", commission expiration)
- **What Signers Receive** — Checklist of what signers leave with:
  - Notarized original document(s)
  - Copy of notary certificate (acknowledgment or jurat)
  - Session recording access link (for RON)
  - Notarized document download link (for RON)
- **Notarization Process Walkthrough** — Step-by-step for each type:
  - In-person: verify ID → administer oath → sign → seal → journal entry
  - RON: tech check → credential analysis → KBA → oath → e-sign → e-seal → journal → recording
- **Document-Specific Instructions** — Expanded from `NotaryGuide.tsx`:
  - Real estate closings: seal every signature page, wire fraud awareness
  - POA: principal must be competent, cannot notarize for family
  - I-9: notary cannot complete Section 2, only verify identity
- **Common Mistakes & Prohibited Acts** — Reference ORC §147 restrictions
- **Copy the uploaded jurat image** to `src/assets/jurat-example.jpg` for use as a reference illustration

**Add route** in `App.tsx`: `/notary-guide-process` → `NotaryProcessGuide`

**Add link** from admin sidebar and `NotaryGuide.tsx`

---

## 6. Team Structure for Multi-Notary Company

**Update `About.tsx`:**
- Add "Our Team" section showing Shane as lead notary with credentials
- Add placeholder cards for future team members with "Coming Soon" or "Join Our Team" CTA
- Link to `/join` for notary recruitment

**Update admin sidebar / dashboard:**
- Ensure `AdminTeam.tsx` references team as "Notar Team" not individual

---

## Files Summary

| File | Action |
|------|--------|
| `src/lib/brand.ts` | **CREATE** — Centralized brand config |
| `src/pages/NotaryProcessGuide.tsx` | **CREATE** — Educational content page |
| `supabase/migrations/[new].sql` | **CREATE** — Add revenue columns + payouts table |
| `index.html` | **EDIT** — Meta tags, JSON-LD rebrand |
| `src/pages/Index.tsx` | **EDIT** — Rebrand nav, hero, footer |
| `src/pages/About.tsx` | **EDIT** — Company page + team section |
| `src/pages/ClientPortal.tsx` | **EDIT** — Chat markdown rendering |
| `src/pages/admin/AdminChat.tsx` | **EDIT** — Chat markdown rendering |
| `src/pages/admin/AdminRevenue.tsx` | **EDIT** — Fee breakdown, payout tracking |
| `src/components/WhatDoINeed.tsx` | **EDIT** — Error handling, rebrand |
| `supabase/functions/onenotary/index.ts` | **EDIT** — Align with v2 API spec |
| `supabase/functions/onenotary-webhook/index.ts` | **EDIT** — Signature verification, event names |
| `supabase/functions/client-assistant/index.ts` | **EDIT** — Rebrand system prompt |
| `supabase/functions/notary-assistant/index.ts` | **EDIT** — Rebrand system prompt |
| `src/pages/OneNotarySession.tsx` | **EDIT** — Correct status lifecycle, new actions |
| ~20 additional page files | **EDIT** — Nav/footer rebrand (SG→N, Shane Goble→Notar) |
| `src/assets/jurat-example.jpg` | **COPY** — Upload reference image |

**Estimated scope:** ~30 files modified/created, 1 migration, 2 edge function rewrites.

