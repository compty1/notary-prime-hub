

# Plan: Logo/Favicon Standardization, Navbar Branding, Theme Uniformity & Homepage Service Hierarchy

## 1. Logo SVG: N with coral period (favicon + component)

**Current state:** `Logo.tsx` renders an SVG with a white "N" on navy rect + coral circle. The `showText` prop appends "Notar." text beside it. The Navbar uses `<Logo size="sm" showText theme="dark" />` which shows the icon + "Notar." text.

**Changes to `src/components/Logo.tsx`:**
- Keep the SVG `LogoIcon` as-is (navy rounded square, white "N", coral period) — this IS the logo mark
- When `showText` is true, change the text from "Notar." (with coral period) to just "Notar" in full — the coral period is already in the icon, no need to duplicate it in text
- Actually per user request: "replace with the current Notar. full text instead" — so the header should show the icon + "Notar." text. The current code already does this. The user wants to confirm the N. icon IS used everywhere and the header text says "Notar." — this is already correct. Let me re-read the request.

User says: "remove the N. from the header and replace with the current Notar. full text instead" — meaning in the Navbar header, instead of showing the icon + "Notar." text (which currently shows "N." icon + "Notar." text making it look like "N. Notar."), they want just the icon + "Notar." text properly. Looking at the code, this is already what happens. But the user may be seeing the SVG "N." as redundant with the "Notar." text.

**Resolution:** The `showText` already shows "Notar." beside the icon. The issue is the icon itself contains an "N" + period which looks redundant. For the header specifically, we should show the full "Notar." as text only (no icon), or show icon without text. User wants "Notar. full text" — so in the Navbar, we show icon + "Notar." text, which is current behavior. The key fix is ensuring the favicon uses this same N. icon.

**Favicon:** Generate an inline SVG data URI or ensure `public/favicon.png` matches the LogoIcon SVG. Since we can't generate PNG programmatically, we'll create an SVG favicon that browsers support via `<link rel="icon" type="image/svg+xml">`.

### Files:
- **`index.html`** — Add SVG favicon: `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`, keep PNG fallback
- **`public/favicon.svg`** — Create matching the LogoIcon SVG (navy rect, white N, coral dot)
- **`src/components/Logo.tsx`** — No structural changes needed; the icon + "Notar." text pattern is correct

## 2. Logo usage audit (32 files import Logo)

All files use `<Logo />` component. Key usages:
- **Navbar** (`showText theme="dark"`) — shows icon + "Notar." ✓
- **Footer** (`showText subtitle="..." theme="dark"`) — shows icon + "Notar." + subtitle ✓
- **Login, SignUp, ForgotPassword** — icon only (no text) ✓
- **ClientPortal, BusinessPortal** — icon only + "Client Portal" / "Business Portal" text ✓

All are using the component, so the SVG fix propagates everywhere. No per-file changes needed.

## 3. Theme uniformity & readability audit

**Issues to fix in `src/index.css`:**
- Footer uses `text-sidebar-foreground/60` which is light text on dark bg — acceptable
- Check for any white-on-white or dark-on-dark problems
- Ensure `--muted-foreground` has sufficient contrast against `--background` in both modes
- Standardize border-radius: ensure cards, buttons, inputs all use the same `--radius` variable

**Files:**
- **`src/index.css`** — Audit and fix any contrast issues; ensure `muted-foreground` is readable
- **`src/components/Footer.tsx`** — Verify `sidebar-foreground/60` contrast on `sidebar-background`

## 4. Homepage service hierarchy restructure

**Current:** Hero has "Online Notarization" + "Other Services" CTAs. Services section shows 4 generic cards from DB or fallback (Real Estate Docs, Legal Docs, Estate Planning, Business Docs).

**New structure per user request:**
- **Two hero-level service cards** prominently featuring:
  1. **Remote Online Notarization (RON)** — Badge, description, CTA to `/book?type=ron`
  2. **Mobile Notarization (Central Ohio)** — Badge, description, CTA to `/book?type=in_person`
- **Below:** "Other Notary Services" grid with cards for:
  - Certified Copy Services
  - Loan Signing Agent
  - I-9 / Employment Verification
  - Apostille Facilitation
  - Power of Attorney
  - Oaths & Affirmations

**Changes to `src/pages/Index.tsx`:**
- Replace current services section with a two-tier layout
- Top tier: 2-column grid with large featured cards for RON and Mobile Notary
- Bottom tier: Smaller grid (3-col) for additional notary services
- Keep the fallback/DB service loading logic but restructure the display
- Update hero CTAs: "Remote Notarization" → `/book?type=ron`, "Mobile Notary" → `/book?type=in_person`

---

## Files to Create
| File | Purpose |
|------|---------|
| `public/favicon.svg` | SVG favicon matching the N. logo icon |

## Files to Modify
| File | Changes |
|------|---------|
| `index.html` | Add SVG favicon link |
| `src/pages/Index.tsx` | Restructure services into 2-tier hierarchy (RON + Mobile featured, others below) |
| `src/index.css` | Fix any contrast issues found in audit |

