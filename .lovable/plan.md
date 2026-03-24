
# Implementation Status — Updated March 2026

## ✅ Completed

### Logo & Favicon
- Created `src/components/Logo.tsx` — reusable component using uploaded logo images
- Copied logo images to `public/logo-icon.png`, `public/logo-full.png`, `public/favicon.png`
- Updated `index.html` favicon reference
- Replaced inline logo blocks (`<div>N</div>`) across 22 page files with `<Logo />` component

### Branding Fixes
- User-Agent strings: `"ShaneGobleNotary/1.0"` → `"Notar/1.0"` in FeeCalculator, BookAppointment, AddressAutocomplete
- `LoanSigningServices.tsx`: `shane@shanegoble.com` → `contact@notardex.com`
- `AdminSettings.tsx`: placeholder email → `contact@notardex.com`
- `OneNotarySession.tsx`: removed dead `callback_url` / `webhookUrl` code

### Multi-State Legal Information
- `RonInfo.tsx`: Added comprehensive 50-state RON legal reference table with search
- `NotaryGuide.tsx`: Added "If You're Outside Ohio" section
- `AdminResources.tsx`: Added "Multi-State RON Laws & Standards" resource category

### Ohio Compliance Auto-Detection
- `AdminSettings.tsx`: Added "Ohio RON Compliance Check" card

### Mobile Upload & Realtime Sync
- Created `src/pages/MobileUpload.tsx`
- `ClientPortal.tsx`: Realtime document sync with mobile uploads
- Added `/mobile-upload` route in `App.tsx`

### Database Migrations Applied
- `e_seal_verifications.notary_name` default changed to `'Notar'`
- `services` RON description updated to "via OneNotary"
- `documents` table added to `supabase_realtime` publication
- `notary_journal.certificate_photos` jsonb column added
- `user_favorites` table created with RLS

### Consolidated Enhancements (March 2026)

#### Batch 1: Phone Masking, Certificates, Notary Info
- Created `src/lib/formatPhone.ts` — `(XXX) XXX-XXXX` formatting utility
- Applied phone masking to `ClientPortal.tsx` profile edit form
- Added certificate photo upload to `AdminJournal.tsx` journal entry form
- Added "Your Notary" card to `AppointmentConfirmation.tsx` showing notary profile
- Added ID scan tooltip in `BookAppointment.tsx` explaining pre-scan vs OneNotary KBA

#### Batch 2: Navigation Guards & Session UX
- Added `beforeunload` guard to `BookAppointment.tsx` for unsaved form data
- Created `src/components/ScrollToTop.tsx` for scroll position restoration
- Added `ScrollToTop` to `App.tsx` router
- Session expiry warning toast 30s before check in `AuthContext.tsx`
- Clear `localStorage`/`sessionStorage` on sign-out

#### Batch 3: Security Hardening
- Tightened CSP in `index.html`: removed `unsafe-eval`, added `frame-ancestors 'self'`, `base-uri 'self'`
- Added `X-Content-Type-Options: nosniff` and `Referrer-Policy` meta tags
- Created `public/.well-known/security.txt` for vulnerability disclosure
- Fixed `public/robots.txt`: sitemap URL → `notardex.com`, proper disallow paths

#### Batch 4: Accessibility & UX Polish
- Added touch target sizing (44px min) for coarse pointer devices in `index.css`
- Added `:focus-visible` high-contrast outline rules for light/dark mode
- Added CSS micro-interaction transitions for buttons and links (respecting `prefers-reduced-motion`)

#### Batch 5: Template & Document Enhancements
- DB migration: `user_favorites` table with RLS for save-for-later functionality

#### Batch 6: Content Polish
- Added Terms/Privacy links to `DocumentTemplates.tsx` footer
- Legal footer links already present in `Index.tsx`

## ⏳ Remaining

### Template Enhancements (deferred to next iteration)
- Interactive template preview with sample data
- Favorites UI (heart icon) on templates and services
- Session persistence for in-progress templates (localStorage)
- Recency-based sort dropdown
- Template side-by-side comparison

### Low Priority
- Gap 8: Console warning for Select ref forwarding (Radix UI issue, cosmetic)
- Gap 13: Google OAuth provider verification
- Gap 16: DarkModeToggle verification
- Gap 19: Expand contact form service options in Index.tsx
- Gap 20: WhatDoINeed.tsx print title verification
