

# Comprehensive Gap Analysis & Fix Plan

After auditing every file, route, edge function, database schema, and UI component, here are all identified gaps organized by severity.

---

## Critical Gaps

### 1. Dead BlueNotary Page (orphaned file, no route)
`src/pages/BlueNotarySession.tsx` — 625-line file still exists and references "BlueNotary" throughout. The route was removed from `App.tsx` but the file remains. If a user had bookmarked `/bluenotary-session`, they'd hit NotFound, which is fine — but the file is dead weight and confusing.
**Fix:** Delete `src/pages/BlueNotarySession.tsx`.

### 2. BlueNotary references in active admin pages
- `AdminResources.tsx` line 487: "Choose an approved RON technology provider (like BlueNotary)"
- `AdminResources.tsx` line 513: "BlueNotary RON Platform" link in external resources
- `AdminJournal.tsx` line 236: placeholder text says "KBA + BlueNotary fees"
**Fix:** Replace BlueNotary with OneNotary in all three locations.

### 3. "Shane Goble" hardcoded in apostille cover sheet
`AdminApostille.tsx` line 147: `Prepared by: Shane Goble, Ohio Notary Public`. Should use `BRAND.teamLead.name` from brand config.
**Fix:** Import BRAND and use `BRAND.teamLead.name`.

### 4. DB default: `e_seal_verifications.notary_name` defaults to `'Shane Goble'`
The database column has a hardcoded default. New e-seal records will always say "Shane Goble" even for future notaries.
**Fix:** Migration to change default to `'Notar'` or remove the default and require explicit value.

### 5. DB service description: RON service says "Secure video notarization via BlueNotary"
The `services` table row for RON has `short_description = 'Secure video notarization via BlueNotary'` (visible in network response).
**Fix:** Migration to update the `short_description` to "Secure video notarization via OneNotary".

---

## Moderate Gaps

### 6. Unused ReactMarkdown import in Index.tsx
Imported on line 17 but never used (no `<ReactMarkdown>` JSX in file). Causes unnecessary bundle overhead.
**Fix:** Remove the import.

### 7. Unused ReactMarkdown import in Services.tsx
Same issue — imported but never rendered.
**Fix:** Remove the import.

### 8. Console warning: Select ref forwarding in Index.tsx
The contact form's `<Select>` component triggers a React warning about function components not accepting refs. This is a known Radix UI issue but produces visible console noise.
**Fix:** Low priority — can be suppressed by wrapping or upgrading Radix. Note for awareness.

### 9. NotaryProcessGuide not linked from admin sidebar
The `/notary-guide-process` route exists but there's no sidebar link in `AdminDashboard.tsx` nav items. Notaries can't discover it.
**Fix:** Add a nav item in `adminNavItems` pointing to `/notary-guide-process`.

### 10. FAQ still says "I serve" (first person singular)
`Index.tsx` line 53: "I serve Franklin County and the greater Columbus, Ohio metropolitan area." Should be "We serve" or "Notar serves."
**Fix:** Update to company voice.

### 11. FAQ line 54: "Contact me" → "Contact us"
Same first-person issue.
**Fix:** Replace "me" with "us".

### 12. `platform_settings` still has personal email/phone
Network response shows `notary_phone = "(614) 6360136"` and `notary_email = "shanegoble@gmail.com"`. These are the DB values, not code — but they override the brand defaults.
**Fix:** User action — update via Admin Settings to use business contact info.

### 13. Login page has Google OAuth but no Google provider configured in auth
`Login.tsx` imports `lovable` from integrations but the Google sign-in flow would need OAuth provider config.
**Fix:** Verify Google OAuth is configured, or remove the Google sign-in button if not set up.

### 14. `e_seal_verifications.notary_name` default `'Shane Goble'`
(Same as gap 4 — DB level fix needed.)

---

## Minor Gaps / Polish

### 15. `About.tsx` references "Shane Goble" directly (acceptable, but not from brand.ts)
Lines 109, 138 mention Shane by name. This is intentional for the company page, but should import from `BRAND.teamLead.name` for maintainability.
**Fix:** Import BRAND and use dynamic reference.

### 16. Dead `DarkModeToggle` import duplication
Both `Index.tsx` nav and `AdminDashboard.tsx` header import it — this is fine, but verify it actually toggles correctly.

### 17. No link to NotaryProcessGuide from public NotaryGuide page
`NotaryGuide.tsx` doesn't link to `/notary-guide-process` for the detailed process guide.
**Fix:** Add a link/button from NotaryGuide to the process guide.

### 18. `RonInfo.tsx` doesn't mention OneNotary as the platform
The RON information page explains RON generally but doesn't reference which platform Notar uses.
**Fix:** Add a brief mention of OneNotary as the platform used.

### 19. Contact form Select doesn't include all current services
The `Index.tsx` contact form hardcodes 7 service options but there are 20+ services in the DB. Consider making this dynamic or at least more complete.
**Fix:** Low priority — add "Witness Services", "Background Check", "Virtual Mailroom" to the dropdown.

### 20. `WhatDoINeed.tsx` print title may still reference old branding
Need to verify the print stylesheet header uses BRAND config.
**Fix:** Verify and update if needed.

---

## Implementation Plan

### Step 1: Delete dead file
- Delete `src/pages/BlueNotarySession.tsx`

### Step 2: Fix BlueNotary → OneNotary references
- `src/pages/admin/AdminResources.tsx` — 2 locations
- `src/pages/admin/AdminJournal.tsx` — 1 location

### Step 3: Fix brand references
- `src/pages/admin/AdminApostille.tsx` — import BRAND, use `BRAND.teamLead.name`
- `src/pages/About.tsx` — import BRAND, use `BRAND.teamLead.name`
- `src/pages/Index.tsx` — fix FAQ "I serve" → "We serve", "Contact me" → "Contact us"

### Step 4: Remove unused imports
- `src/pages/Index.tsx` — remove `ReactMarkdown` import
- `src/pages/Services.tsx` — remove `ReactMarkdown` import

### Step 5: Add NotaryProcessGuide links
- `src/pages/admin/AdminDashboard.tsx` — add sidebar nav item
- `src/pages/NotaryGuide.tsx` — add link to process guide

### Step 6: Database migrations
- Update `e_seal_verifications` default `notary_name` from `'Shane Goble'` to `'Notar'`
- Update `services` row: RON `short_description` from "via BlueNotary" to "via OneNotary"

### Step 7: Add OneNotary mention to RonInfo.tsx

### Step 8: Expand contact form service options in Index.tsx

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/BlueNotarySession.tsx` | **DELETE** |
| `src/pages/admin/AdminResources.tsx` | **EDIT** — BlueNotary → OneNotary (2 spots) |
| `src/pages/admin/AdminJournal.tsx` | **EDIT** — BlueNotary → OneNotary placeholder |
| `src/pages/admin/AdminApostille.tsx` | **EDIT** — Import BRAND, use dynamic name |
| `src/pages/About.tsx` | **EDIT** — Import BRAND for team lead name |
| `src/pages/Index.tsx` | **EDIT** — Remove unused import, fix FAQ voice |
| `src/pages/Services.tsx` | **EDIT** — Remove unused import |
| `src/pages/admin/AdminDashboard.tsx` | **EDIT** — Add process guide nav item |
| `src/pages/NotaryGuide.tsx` | **EDIT** — Add link to process guide |
| `src/pages/RonInfo.tsx` | **EDIT** — Mention OneNotary platform |
| DB migration | **CREATE** — Fix e_seal default + RON service description |

**Total: 20 gaps identified, 11 files + 1 migration to fix.**

