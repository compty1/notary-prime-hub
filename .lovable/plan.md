

# Comprehensive Platform Audit — DOCX Report & CSV Gap Tracker

## What This Delivers
Two artifacts:
1. **DOCX Report** (~50+ pages): Organized audit of every gap, bug, missing feature, dead code, icon issue, theme inconsistency, settings gap, and compliance concern found across the entire codebase.
2. **CSV Tracker** (2000+ rows): Every finding as an actionable row with columns: ID, Category, Severity, Title, Description, File(s) Affected, Fix Steps, Expected Outcome, Testing Method, Status.

## Audit Scope & Categories

### 1. UI/Theme & Typography Consistency (~200+ items)
- Font inconsistency: `font-sans` vs `font-heading` vs `font-display` all resolve to DM Sans — some components use hardcoded font families or `font-semibold` instead of `font-bold`
- Icon transparency issues: `newsletter-megaphone.jpg`, `globe-docs.jpg`, `checklist-docs.jpg`, `email-notif-2.jpg`, `ron-service.jpg`, `newsletter.jpg` — all JPGs with opaque backgrounds instead of transparent PNGs
- Duplicate icon assets: `doc-shield.png` vs `doc-shield-clean.png`, `identity-verify.png` vs `identity-verify-clean.png`, `globe-docs.jpg` vs `globe-docs.png` — dead/unused variants
- Hero animation only visible on `lg:` breakpoint — hidden on mobile/tablet
- About Us copy says "branding, content, and design" — generic placeholder, not notary-specific
- Inconsistent border radius: mix of `rounded-xl`, `rounded-[24px]`, `rounded-[32px]`, `rounded-2xl`
- Dark mode gaps across public pages (hero gradient, about section, admin services section)

### 2. Admin Dashboard & Settings (~150+ items)
- Missing settings keys not seeded in `platform_settings`: social media URLs, SEO defaults, branding overrides, feature toggles
- AdminSettings.tsx is 880 lines — God Component, needs decomposition
- No global font/typography controls in settings
- No logo upload preview in settings (seal preview exists but not logo)
- Missing maintenance mode redirect enforcement (setting exists but no route guard)
- No settings for: hero text, about text, homepage section visibility toggles
- AdminOverview stats may hit 1000-row query limit
- Build Tracker uses SSE streaming which may fail silently

### 3. Missing/Dead Functionality (~300+ items)
- `CookieConsent` component causes React ref warning (console error confirmed)
- 299+ `console.log/warn/error` statements in production code across 37 files
- Offline queue (`offlineQueue.ts`) stores actions but never replays them on reconnect
- `SessionTimeoutWarning` component exists but isn't rendered anywhere
- `ComplianceWatchdog` component — not imported/used on any page
- `SignNowStatusPanel` — referenced but SignNow integration incomplete
- `GoogleCalendarWidget` — exists but Google Calendar sync edge function lacks OAuth flow
- `RonRecordingPanel` — no actual WebRTC/recording implementation
- `KBAVerification` — UI only, no actual KBA provider integration
- `IDScanAssistant` — UI only, no ID scanning API connected
- `TechCheck` — exists but not used in RON session flow
- `SessionWaitingRoom` — not integrated into RON session
- `DocumentReadinessScore` — component exists, not used
- `ClientProgressTracker` — exists but not rendered in portal
- `RevenueForecast` — component exists, not used in AdminRevenue
- `StyleMatchPanel` — exists, not connected
- `TranslationPanel` — UI only, no translation API
- `RichTextEditor` — exists but DocuDex uses TipTap directly
- `InvoicePDFExport` — component exists but no PDF generation library connected

### 4. Edge Function & API Issues (~100+ items)
- 18 database triggers listed in schema but `db-triggers` section says "no triggers" — potential sync issue
- `google-calendar-sync` function exists but no Google OAuth credentials configured
- `signnow` and `signnow-webhook` — SIGNNOW_API_KEY/TOKEN set but no end-to-end signing flow
- `hubspot-sync` — HubSpot keys set but sync not triggered from CRM UI
- `scan-id` — no actual ID scanning provider API configured
- `discover-leads` and `scrape-social-leads` — likely violate platform ToS
- `ionos-email-sync` and `ionos-email` — IONOS credentials set but email sync UI incomplete
- `process-email-queue` — PGMQ functions exist but cron trigger not configured
- `stripe-webhook` — webhook endpoint registered but no Stripe dashboard webhook URL set
- Missing health check monitoring/alerting

### 5. Database & RLS Gaps (~80+ items)
- Functions reference `notary_journal` table but journal entries table is `journal_entries`
- `crm_log_payment` trigger references `auth.uid()` which may be null in webhook contexts
- `handle_new_user` hardcodes email for admin role — security concern
- Missing RLS verification for newer tables
- `audit_log` allows anonymous inserts from global error handler (no auth context)
- `booking_drafts` table referenced in code but may lack RLS

### 6. Compliance & Security (~60+ items)
- RON session lacks actual video recording implementation (Ohio ORC §147.63 requires it)
- No actual KBA provider integration (Ohio ORC §147.66 requires credential analysis)
- E-seal generation is UI-only, no cryptographic signing
- Document hash verification (`documentHash.ts`) not integrated into seal verification flow
- CSRF protection exists but not applied to all mutation forms
- Session security helpers exist but `sessionSecurity.ts` not used in AuthContext
- Rate limiter client-side only — server-side needed for auth endpoints

### 7. Icon System Analysis & Grading (~50+ items)
- 6 JPG icons with white/colored backgrounds need PNG transparency conversion
- 5 duplicate icon files (clean vs original variants)
- `newsletterMegaphone` imported as `.jpg` — should be `.png`
- Missing icons for: subscription, API, white-label, witness, travel, data-entry services
- Icon sizing inconsistent: mix of 56px, 64px, 72px, 80px, 110px across sections
- No icon for admin sidebar items (uses Lucide, not 3D icons — intentional but inconsistent with homepage)

### 8. Navigation, Routing & SEO (~40+ items)
- `/contact` redirects to `/#contact` which may not scroll correctly with lazy loading
- `/dashboard` redirects to `/portal` but some email templates may reference `/dashboard`
- Missing 404 handling for `/admin/*` sub-routes
- `sitemap.xml` likely static and not auto-generated from routes
- Missing canonical URLs on many pages
- `robots.txt` may not block admin routes

### 9. Professional/Notary Pages (~30+ items)
- Professional pages (`/n/:slug`) — gallery management UI exists but storage bucket permissions may block public access
- QR code generation uses external API (`api.qrserver.com`) — no fallback
- Google Font injection on notary pages — no CSP allowance
- Professional service enrollments lack price validation on client side

### 10. Performance (~30+ items)
- LongTask warnings in console (280ms, 185ms, 207ms, 343ms)
- 3354 regex matches for TODO/FIXME/HACK across 102 files
- No code splitting for admin pages within the admin layout (all lazy-loaded at route level but large bundles)
- `Hero3DAnimation` runs `requestAnimationFrame` continuously even when off-screen
- No `will-change` or GPU acceleration hints on animated elements

## Technical Approach

1. Parse uploaded PDF for any remaining plan items
2. Cross-reference with codebase findings above
3. Generate Python script to create DOCX with professional formatting (cover page, TOC, categorized sections, severity badges)
4. Generate CSV with all findings (ID, Category, Severity, Title, Description, Files, Fix Steps, Outcome, Test Method, Priority, Status)
5. QA both artifacts visually before delivery

## Output
- `/mnt/documents/notar-platform-audit-report.docx`
- `/mnt/documents/notar-platform-audit-tracker.csv`

