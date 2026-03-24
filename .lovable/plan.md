

# Comprehensive Fix Plan: Logo, Multi-State Legal Info, Mobile Upload, Compliance Detection, & Remaining Gaps

---

## Note on Logo

I don't see new logo image files attached to this message. The only previously uploaded image was the jurat example (`th.jpeg`). Please upload your logo inspiration images and I'll integrate them. In the meantime, I'll plan for:
- Creating an SVG logo based on the "N" initial with a professional notary aesthetic
- Generating a matching favicon (`.ico` and `.png` variants)
- Replacing all hardcoded `<div>N</div>` logo blocks with a shared `<Logo />` component

---

## 1. Create Shared Logo Component + Favicon

**Problem:** Every page has an inline `<div className="flex h-10 w-10 ..."><span>N</span></div>` repeated ~25 times. No actual logo image or favicon exists.

**Plan:**
- Create `src/components/Logo.tsx` — a reusable component that renders an SVG logo (navy square with gold "N" in Playfair Display style, matching the brand). Accepts `size` prop for nav vs. footer vs. admin sidebar usage.
- Create `public/favicon.svg` and `public/favicon.png` — matching the logo mark
- Update `index.html` to reference the new favicon
- Replace all inline logo blocks across ~25 pages with `<Logo />` import

**Files:**
| File | Action |
|------|--------|
| `src/components/Logo.tsx` | **CREATE** |
| `public/favicon.svg` | **CREATE** |
| `index.html` | **EDIT** — favicon reference |
| ~25 page files | **EDIT** — replace inline logo with `<Logo />` |

---

## 2. Multi-State Notarization Legal Information

**Problem:** The site is Ohio-focused but users from other states need to understand RON legality, document acceptance, and state-specific requirements. Currently `RonInfo.tsx` has a basic state list but no detail.

**Plan:**

### A. Expand `RonInfo.tsx` with comprehensive state-by-state data
Add a detailed, searchable state reference section with real legal data for all 50 states:
- **RON status**: Permanent law, temporary authorization, or no law
- **Governing statute**: e.g., "Virginia Code §47.1-2" 
- **Key restrictions**: e.g., "California — no self-executing RON law; relies on executive orders"
- **Accepted document types**: Which states restrict certain documents (wills, real estate)
- **Recording requirements**: Duration of record retention by state
- **KBA requirements**: MISMO-compliant required vs. alternative methods

Add an interactive state selector/search so users can look up their state.

### B. Add state-specific guidance to `NotaryGuide.tsx`
Add a section: "If You're Outside Ohio" explaining:
- Ohio RON is valid nationwide under Full Faith & Credit
- Some receiving entities (county recorders, banks) may have specific requirements
- Document types that commonly face acceptance issues by state
- Practical advice for out-of-state signers

### C. Add legal reference section to `AdminResources.tsx`
Add a "Multi-State RON Laws" resource category with links to:
- MISMO RON standards
- National Conference of State Legislatures RON tracker
- State-specific SOS pages for the most common states (FL, TX, CA, NY, VA)

**Files:**
| File | Action |
|------|--------|
| `src/pages/RonInfo.tsx` | **EDIT** — Add comprehensive 50-state legal reference with search |
| `src/pages/NotaryGuide.tsx` | **EDIT** — Add out-of-state guidance section |
| `src/pages/admin/AdminResources.tsx` | **EDIT** — Add multi-state RON law resources |

---

## 3. Ohio Compliance Auto-Detection in Admin Settings

**Problem:** No automated check to verify the platform meets Ohio RON requirements.

**Plan:**
Add an "Ohio RON Compliance" card to `AdminSettings.tsx` that auto-evaluates:
- ✓/✗ Commission Number present
- ✓/✗ Commission not expired
- ✓/✗ RON Authorization Number present
- ✓/✗ E&O Insurance not expired
- ✓/✗ Bond not expired
- ✓/✗ OneNotary API configured (always true since secret exists)
- ⚠ KBA integration configured

### KBA Integration Setup
Add collapsible KBA config section:
- Provider dropdown (OneNotary Built-in, IDology, Evident)
- API key field (stored in `platform_settings`)
- Note: "Ohio ORC §147.66 requires KBA for all RON sessions — OneNotary handles this natively"

**Files:**
| File | Action |
|------|--------|
| `src/pages/admin/AdminSettings.tsx` | **EDIT** — Add compliance checker + KBA config |

---

## 4. Mobile Upload QR Code Fix + Realtime Sync

**Problem:** QR code URL points to `/portal` which redirects to OAuth login on mobile, not a focused upload experience.

**Plan:**
- Create `src/pages/MobileUpload.tsx` — mobile-optimized page with:
  - Simple email/password login (no OAuth redirect)
  - Camera capture + file upload
  - Recently uploaded documents list
  - Minimal UI optimized for phone screens
- Update QR URL in `ClientPortal.tsx` from `/portal` to `/mobile-upload`
- Add realtime listener in `ClientPortal.tsx` on the `documents` table so desktop auto-updates when mobile uploads complete
- Add route in `App.tsx`

**Files:**
| File | Action |
|------|--------|
| `src/pages/MobileUpload.tsx` | **CREATE** |
| `src/pages/ClientPortal.tsx` | **EDIT** — QR URL + realtime subscription |
| `src/App.tsx` | **EDIT** — Add route |

---

## 5. Remaining Gaps Found

### Gap A: `callback_url` still sent in OneNotarySession.tsx (line 159)
The edge function was updated to remove `callback_url` support (webhooks are account-level), but `OneNotarySession.tsx` still passes `callback_url` in the create session call. Harmless but confusing dead code.
**Fix:** Remove `callback_url` and `webhookUrl` from `OneNotarySession.tsx`.

### Gap B: Old branding in User-Agent strings (4 locations)
- `FeeCalculator.tsx` line 96: `"ShaneGobleNotary/1.0"`
- `BookAppointment.tsx` line 411: `"ShaneGobleNotary/1.0"`
- `AddressAutocomplete.tsx` line 112: `"ShaneGobleNotary/1.0"`
**Fix:** Change to `"Notar/1.0"`.

### Gap C: Personal email in `LoanSigningServices.tsx` (line 198)
`shane@shanegoble.com` hardcoded in the loan signing contact section.
**Fix:** Import `BRAND` and use `BRAND.defaultEmail`.

### Gap D: AdminSettings placeholder still says `shane@shanegoble.com` (line 283)
The placeholder text for business email input.
**Fix:** Change to `contact@notardex.com`.

### Gap E: `notarization_sessions` table still has `bluenotary_session_url` column
Legacy column name. Not breaking but confusing for future developers.
**Fix:** Migration to rename or drop the column (low priority — no code references it).

### Gap F: No realtime enabled on `documents` table
Needed for the mobile upload auto-sync feature.
**Fix:** Migration to add `documents` to `supabase_realtime` publication.

### Gap G: `About.tsx` not importing BRAND for team lead name
Still uses hardcoded "Shane Goble" string.
**Fix:** Already in the prior plan but may not have been applied — verify and fix.

---

## 6. Implementation Order

1. **Create `Logo.tsx` + favicon** — shared component, update all pages
2. **Fix remaining branding gaps** (User-Agent strings, email placeholders, LoanSigningServices)
3. **Remove `callback_url` from OneNotarySession.tsx**
4. **Add Ohio compliance checker + KBA config to AdminSettings**
5. **Create MobileUpload page + fix QR + add realtime**
6. **Expand RonInfo.tsx with 50-state legal reference**
7. **Add multi-state sections to NotaryGuide + AdminResources**
8. **DB migration** — enable realtime on documents, drop `bluenotary_session_url` column

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/Logo.tsx` | **CREATE** — Shared logo component |
| `public/favicon.svg` | **CREATE** — Brand favicon |
| `src/pages/MobileUpload.tsx` | **CREATE** — Mobile upload page |
| `index.html` | **EDIT** — Favicon |
| `src/pages/RonInfo.tsx` | **EDIT** — 50-state legal reference |
| `src/pages/NotaryGuide.tsx` | **EDIT** — Out-of-state guidance |
| `src/pages/admin/AdminResources.tsx` | **EDIT** — Multi-state RON resources |
| `src/pages/admin/AdminSettings.tsx` | **EDIT** — Compliance checker + KBA + placeholder fix |
| `src/pages/OneNotarySession.tsx` | **EDIT** — Remove callback_url |
| `src/pages/ClientPortal.tsx` | **EDIT** — QR URL + realtime |
| `src/pages/LoanSigningServices.tsx` | **EDIT** — Use BRAND.defaultEmail |
| `src/pages/FeeCalculator.tsx` | **EDIT** — User-Agent string |
| `src/pages/BookAppointment.tsx` | **EDIT** — User-Agent string |
| `src/components/AddressAutocomplete.tsx` | **EDIT** — User-Agent string |
| `src/pages/About.tsx` | **EDIT** — Verify BRAND import for team lead |
| `src/App.tsx` | **EDIT** — Add mobile-upload route |
| ~25 page files | **EDIT** — Replace inline logo with `<Logo />` |
| DB migration | **CREATE** — Enable realtime on documents, drop legacy column |

**Total: ~35 file changes, 3 new files, 1 migration**

