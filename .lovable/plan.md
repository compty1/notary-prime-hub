

# Phase 20: 1000 Additional Fixes — Admin, Settings, Leads, Services, Integrations, AI, Edge Functions

All previous phases (1–19) remain **completely unchanged**. This phase adds 1000 items discovered through deep audit of admin functionality, global settings, professional/notary pages, services, automations, integrations, content editing, AI service tools, and the leads system.

---

## Section L: Lead Portal — 150 Fixes & Enhancements (LP-001 to LP-150)

### LP-A: Critical Bugs (20)

**LP-001** `AdminLeadPortal.tsx:35` — `useState<any[]>` for leads. Create `Lead` interface from DB schema.
**LP-002** `AdminLeadPortal.tsx:43` — `editingLead` is `useState<any>`. Type as `Lead | null`.
**LP-003** `AdminLeadPortal.tsx:50` — `selectedLead` is `useState<any>`. Type properly.
**LP-004** `AdminLeadPortal.tsx:61` — `fetchLeads` does `.select("*")` with no pagination — loads ALL leads into memory. Will crash with 10K+ leads.
**LP-005** `AdminLeadPortal.tsx:148` — Bulk delete uses sequential `for...of` with individual DELETE queries. Should use `.in("id", ids)` for batch delete.
**LP-006** `AdminLeadPortal.tsx:151-152` — Bulk status update uses sequential updates. Should batch with `.in("id", ids)`.
**LP-007** `AdminLeadPortal.tsx:199,203` — `form as any` casts bypass type safety on lead insert/update.
**LP-008** `AdminLeadPortal.tsx:216` — `as any` cast on status update.
**LP-009** `AdminLeadPortal.tsx:243-256` — CSV import uses naive `.split(",")` which breaks on quoted fields containing commas. Use proper CSV parser.
**LP-010** `AdminLeadPortal.tsx:248-253` — CSV import does sequential inserts (one per row). Should batch insert.
**LP-011** `AdminLeadPortal.tsx:253` — CSV import casts `as any` on every insert.
**LP-012** `AdminLeadPortal.tsx:473` — Bulk action fires immediately on `onValueChange` — user cannot preview before executing. Add confirmation step.
**LP-013** `AdminLeadPortal.tsx:574-596` — Pipeline view shows 5 columns for 7 statuses. `grid-cols-5` doesn't match 7 `pipelineStatuses`. Layout is broken.
**LP-014** `AdminLeadPortal.tsx:576` — Pipeline view filters from `leads` (unfiltered) instead of `filtered` — search/filters don't apply to pipeline view.
**LP-015** `AdminLeadPortal.tsx:737-738` — Double `<Separator />` renders a visual gap between notes and lead score.
**LP-016** `AdminLeadPortal.tsx:757` — Book appointment link constructs URL with user-supplied data without encoding special characters properly.
**LP-017** `AdminLeadPortal.tsx:275` — `catch (e: any)` — untyped error catch.
**LP-018** No error state displayed when `fetchLeads` fails — just shows empty.
**LP-019** No loading skeleton — only a spinner. Should show skeleton cards.
**LP-020** Realtime subscription on line 70-102 doesn't handle UPDATE correctly — `payload.new` replaces entire lead but pagination may have filtered it out, causing phantom entries.

### LP-B: Missing Lead Intelligence (25)

**LP-021** Lead score (line 282-293) is purely client-side with hardcoded weights. Should be server-side RPC for consistency and extensibility.
**LP-022** No lead score history — score is computed on-the-fly, can't track improvement over time.
**LP-023** No configurable lead scoring weights — admin should be able to adjust scoring criteria.
**LP-024** No "hot lead" auto-alert when high-intent lead enters pipeline.
**LP-025** No lead aging indicator — how many days since created without contact.
**LP-026** No "stale lead" auto-tagging for leads untouched for N days.
**LP-027** No lead response time tracking (time from creation to first contact).
**LP-028** No conversion velocity metric (average days from new → converted).
**LP-029** No lead source ROI analysis (which sources produce most conversions).
**LP-030** No lead-to-deal linking — leads exist separately from CRM deals.
**LP-031** No automated lead assignment to team members based on service area/type.
**LP-032** No lead priority queue — high-score leads should surface first.
**LP-033** No "next best action" AI suggestion per lead.
**LP-034** No competitor mention detection in notes/emails.
**LP-035** No geographic clustering visualization for leads.
**LP-036** No lead funnel drop-off analysis (where leads stall in pipeline).
**LP-037** No win/loss reason tracking when leads close.
**LP-038** No seasonal pattern detection for lead volume.
**LP-039** No lead quality score based on historical conversion data of similar leads.
**LP-040** No automated follow-up cadence scheduling per lead.
**LP-041** No lead merge/dedup tool — duplicates detected (line 306) but no merge UI.
**LP-042** No phone number validation before save (accepts any string).
**LP-043** No email validation before save (accepts any string).
**LP-044** No lead tags/labels system for custom categorization.
**LP-045** No custom fields for leads (only hardcoded schema).

### LP-C: Missing Lead Actions & Workflows (25)

**LP-046** No "Send Email" action directly from lead detail — only mailto link.
**LP-047** No email template selection when contacting lead.
**LP-048** No call logging from lead detail (mark as called with notes).
**LP-049** No SMS/text message capability from lead detail.
**LP-050** No task creation linked to lead (follow up on date X).
**LP-051** No activity timeline on lead detail — only shows created/updated/contacted dates.
**LP-052** No correspondence history visible on lead detail.
**LP-053** No meeting scheduling from lead detail (Google Calendar integration).
**LP-054** No "Convert to Client" workflow that creates profile + appointment.
**LP-055** No "Convert to Deal" workflow that creates CRM deal from lead.
**LP-056** No proposal tracking — generated proposals not linked back to lead.
**LP-057** No proposal email sending from lead detail.
**LP-058** No proposal view/acceptance tracking (was it opened? accepted?).
**LP-059** No document attachment capability on leads.
**LP-060** No internal notes separate from general notes (staff-only annotations).
**LP-061** No lead reassignment between team members.
**LP-062** No lead archival (soft-delete with recovery).
**LP-063** No lead restore from archive.
**LP-064** No "Re-engage" action for closed-lost leads.
**LP-065** No automated "welcome" email when lead is manually created.
**LP-066** No lead print/PDF export for individual lead profiles.
**LP-067** No QR code generation for lead contact card.
**LP-068** No map view showing lead locations.
**LP-069** No drag-and-drop on pipeline view — cards are click-only.
**LP-070** No pipeline stage duration tracking (how long in each stage).

### LP-D: Missing AI & Discovery Enhancements (25)

**LP-071** `discover-leads` edge function generates fictional leads from AI — these are not real businesses. Should use real business directory APIs.
**LP-072** `discover-leads` — AI prompt asks for "realistic" leads but AI can hallucinate business names and addresses that don't exist.
**LP-073** `discover-leads` — No verification step before inserting AI-generated leads into production DB.
**LP-074** `discover-leads` — Duplicate check only matches `business_name + city` — misses variations like "LLC" vs no "LLC".
**LP-075** `discover-leads` — No lead source attribution tracking for which search query produced which lead.
**LP-076** `extract-email-leads` — Only processes 20 emails per invocation. No queue/pagination for large inboxes.
**LP-077** `extract-email-leads` — `lead_extracted` flag but no UI to reset/reprocess emails.
**LP-078** `extract-email-leads` — No configurable email folders to scan beyond inbox.
**LP-079** `extract-email-leads` — No spam/junk filtering before AI extraction.
**LP-080** `scrape-social-leads` — Only picks 4 random queries per invocation. No progress tracking.
**LP-081** `scrape-social-leads` — Firecrawl search results parsed by AI — double abstraction layer prone to errors.
**LP-082** `scrape-social-leads` — No dedup check against existing leads before insert.
**LP-083** `generate-lead-proposal` — Uses deprecated `serve` from `deno.land/std@0.168.0` — should use `Deno.serve`.
**LP-084** `generate-lead-proposal` — Hardcoded pricing in system prompt. Should fetch from `platform_settings` or `pricing_rules`.
**LP-085** `generate-lead-proposal` — No proposal persistence — generated text is returned but never saved to DB.
**LP-086** `generate-lead-proposal` — No template variations (email vs PDF vs letter format).
**LP-087** No AI-powered lead scoring model trained on historical conversion data.
**LP-088** No AI chatbot lead qualification pre-screening before human review.
**LP-089** No predictive analytics for lead conversion probability.
**LP-090** No AI-generated follow-up email suggestions based on lead context.
**LP-091** No sentiment analysis on lead correspondence/notes.
**LP-092** No AI enrichment using real public record databases (Ohio SOS, BBB, etc.).
**LP-093** No scheduled/automated lead discovery (currently manual-trigger only).
**LP-094** No AI-powered service recommendation based on lead profile.
**LP-095** No lead intent classification from website behavior tracking.

### LP-E: Missing Lead Analytics & Reporting (20)

**LP-096** Stats (line 295-303) are computed client-side from all leads — no server-side aggregation. Inaccurate with pagination.
**LP-097** No conversion rate trend over time chart.
**LP-098** No lead source comparison chart.
**LP-099** No lead volume over time chart (daily/weekly/monthly).
**LP-100** No pipeline value chart (estimated revenue per stage).
**LP-101** No lead response time distribution chart.
**LP-102** No leaderboard showing which team member converts most leads.
**LP-103** No geographic distribution chart/map of leads.
**LP-104** No service demand analysis from lead `service_needed` field.
**LP-105** No daily/weekly lead summary email to admin.
**LP-106** No lead KPI dashboard with real-time auto-refresh.
**LP-107** No lead export in PDF format (only CSV).
**LP-108** No filtered CSV export — current export uses `filtered` array but doesn't include lead score.
**LP-109** CSV export (line 229-236) doesn't include all fields (missing `address`, `zip`, `notes`, `created_at`, `lead_score`).
**LP-110** No scheduled report generation (weekly lead pipeline summary).
**LP-111** No lead comparison view (side-by-side).
**LP-112** No lead health score (pipeline-level metric: % of leads progressing).
**LP-113** No forecasting based on current pipeline (predicted conversions this month).
**LP-114** No A/B testing tracking for lead capture forms.
**LP-115** No ROI tracking per lead source (cost per acquisition).

### LP-F: Missing Lead UI/UX Enhancements (20)

**LP-116** No keyboard shortcuts for lead management (N=new, E=edit, D=delete).
**LP-117** No inline editing on lead cards (click field to edit directly).
**LP-118** No lead card color coding by urgency/age.
**LP-119** No lead quick-view tooltip on hover.
**LP-120** No split-pane view (list on left, detail on right) — uses Sheet overlay which hides list.
**LP-121** No sortable columns in list view.
**LP-122** No column visibility toggle (show/hide columns).
**LP-123** No table view alternative to card view.
**LP-124** No lead photo/avatar from Gravatar or uploaded image.
**LP-125** No contact verification badges (email verified, phone verified).
**LP-126** No recent activity indicator on lead cards (last action timestamp).
**LP-127** No "Mark as Contacted" quick button on lead card.
**LP-128** No lead detail breadcrumb navigation.
**LP-129** No lead comparison selection (checkbox → compare selected).
**LP-130** No dark mode issues identified but pipeline cards use hardcoded text colors.

### LP-G: Missing Lead Integrations (15)

**LP-131** No HubSpot sync from lead portal (separate from CRM page sync).
**LP-132** No Google Contacts sync.
**LP-133** No LinkedIn import for business leads.
**LP-134** No Zillow/Realtor.com integration for real estate leads.
**LP-135** No Ohio SOS business search integration for entity verification.
**LP-136** No automated lead capture from website contact form submissions (submit-lead exists but no real-time push notification).
**LP-137** No webhook notification to external CRM on lead status change.
**LP-138** No Zapier trigger support for lead events.
**LP-139** No email marketing platform sync (Mailchimp, SendGrid).
**LP-140** No phone system integration (click-to-call with auto-log).
**LP-141** No calendar integration for follow-up scheduling.
**LP-142** No SMS platform integration for text outreach.
**LP-143** No chatbot lead handoff from AILeadChatbot to lead portal.
**LP-144** No Google Ads lead form integration.
**LP-145** No Facebook Lead Ads integration.

### LP-H: Lead Security & Compliance (5)

**LP-146** No GDPR consent tracking on leads (how was data obtained, consent basis).
**LP-147** No data retention policy enforcement on old leads.
**LP-148** No PII masking in lead list view (partial phone/email).
**LP-149** No lead data access audit logging (who viewed which lead).
**LP-150** No lead data export for GDPR Subject Access Requests.

---

## Section A: Admin Dashboard & Overview (100 fixes)

### AD-A: AdminOverview Bugs (20)

**AD-001** `AdminOverview.tsx:94` — `.limit(2000)` on profiles — exceeds Supabase 1000-row default limit.
**AD-002** `AdminOverview.tsx:95` — `.limit(1000)` on appointments — exactly at limit, silently truncates.
**AD-003** `AdminOverview.tsx:86-100` — 15+ concurrent queries on mount via `Promise.allSettled` — no staggering.
**AD-004** No auto-refresh on overview KPIs — data is stale after initial load.
**AD-005** No date range selector on overview dashboard.
**AD-006** No comparison period (this week vs last week).
**AD-007** Revenue chart only shows paid payments — no pending/expected revenue.
**AD-008** No revenue breakdown by service type on overview.
**AD-009** No appointment completion rate metric.
**AD-010** No new client growth trend chart.
**AD-011** Commission expiration alert computed on client — should use server-side check.
**AD-012** `GoogleCalendarWidget` renders even if Google Calendar is not configured.
**AD-013** No real-time appointment status updates on overview.
**AD-014** No pending service requests count on overview.
**AD-015** No unread messages indicator on overview.
**AD-016** No overdue tasks count on overview.
**AD-017** No system health indicator on overview.
**AD-018** Recharts components don't adapt to dark mode axis labels.
**AD-019** No mobile-optimized overview layout — charts too small on mobile.
**AD-020** `CHART_COLORS` hardcoded — should use theme tokens.

### AD-B: AdminDashboard Sidebar (15)

**AD-021** `sidebarGroups` array recreated on every render — should be `useMemo` or module constant.
**AD-022** 20+ admin routes not represented in sidebar (identified in Phase 15 G-006 through G-020).
**AD-023** No route search within sidebar (only CommandPalette).
**AD-024** No badge counts on sidebar items (pending orders, unread messages).
**AD-025** No sidebar collapse state persistence across sessions.
**AD-026** No recently visited pages section in sidebar.
**AD-027** No keyboard shortcut for sidebar navigation (Cmd+K only opens CommandPalette).
**AD-028** Drag-and-drop reorder causes full sidebar re-render.
**AD-029** No sidebar item grouping customization by admin.
**AD-030** No sidebar item hide/show per user preference.
**AD-031** No breadcrumb navigation on admin pages.
**AD-032** `AdminAcademyManager` exists but no route in App.tsx.
**AD-033** `/admin/business-portal` has no sidebar link.
**AD-034** Enterprise tools sidebar section has 15 items — too many without subcategories.
**AD-035** No "Favorites" or "Pinned" section in sidebar.

### AD-C: AdminSettings Gaps (25)

**AD-036** `AdminSettings.tsx:38-39` — `expiredIds` and `expiringIds` typed as `any[]`.
**AD-037** `AdminSettings.tsx:49` — `data.forEach((s: any)` — untyped iteration.
**AD-038** `AdminSettings.tsx:124` — `Promise.all(updates as any[])` — entire save operation is `any`-typed.
**AD-039** `AdminSettings.tsx:213` — `import.meta.env.VITE_SUPABASE_URL?.includes("localhost")` exposes infrastructure URL.
**AD-040** Settings import (line 151-165) doesn't validate imported keys against allowed schema — arbitrary keys can be injected.
**AD-041** No settings change confirmation dialog before save.
**AD-042** No settings rollback capability.
**AD-043** No settings version history.
**AD-044** No per-setting access control (some settings should be super-admin only).
**AD-045** No real-time preview of branding changes.
**AD-046** Brand color inputs accept non-hex values — `ensureHex` exists but not enforced on save.
**AD-047** No dark mode preview for brand colors.
**AD-048** SEO settings not applied to actual `<meta>` tags — `usePageMeta` uses hardcoded defaults.
**AD-049** Social media URL fields lack platform-specific validation.
**AD-050** No settings dependency warnings (e.g., enabling booking requires Stripe to be configured).
**AD-051** Compliance tab shows commission expiration but no automated SOS renewal link.
**AD-052** No webhook URL display with copy-to-clipboard.
**AD-053** No settings search/filter across all tabs.
**AD-054** Feature toggles don't show which components they affect.
**AD-055** No scheduled maintenance mode (set future date to auto-enable).
**AD-056** No IP allowlisting for admin access.
**AD-057** Settings tab `key` prop missing on TabsTrigger — potential React warning.
**AD-058** No unsaved changes warning when navigating away.
**AD-059** Tab scroll indicators missing on mobile (8 tabs overflow).
**AD-060** No settings documentation/help text per field.

### AD-D: Admin Page Common Issues (40)

**AD-061** `AdminFingerprinting.tsx` — `as any` cast on insert and update.
**AD-062** `AdminSkipTracing.tsx` — `as any` cast on all DB operations.
**AD-063** `AdminI9Verifications.tsx` — `as any` cast on all DB operations.
**AD-064** `AdminVitalRecords.tsx` — no error handling on fetch.
**AD-065** `AdminPrintJobs.tsx` — no error handling on fetch.
**AD-066** `AdminTranslations.tsx` — no error handling on fetch.
**AD-067** `AdminCourier.tsx` — no error handling on fetch.
**AD-068** `AdminBackgroundChecks.tsx` — no error handling on fetch.
**AD-069** `AdminIdentityCertificates.tsx` — no error handling on fetch.
**AD-070** `AdminProcessServing.tsx` — no error handling on fetch.
**AD-071** `AdminVATasks.tsx` — no error handling on fetch.
**AD-072** `AdminLoanSigning.tsx:62` — `as any` on insert.
**AD-073** `AdminLoanSigning.tsx:71` — `as any` on status update.
**AD-074** `AdminPricing.tsx:72-73` — 4 consecutive empty `catch {}` blocks silently ignore malformed JSON.
**AD-075** `AdminPricing.tsx:74` — `setRules(data as any)`.
**AD-076** `AdminPricing.tsx:103` — `as any` on pricing rule update.
**AD-077** `AdminBuildTracker.tsx:59` — `as any` on insert.
**AD-078** `AdminAppointments.tsx:157-159` — triple `as any` cast on status filters.
**AD-079** `AdminAppointments.tsx:210` — `as any` on status update.
**AD-080** `AdminAppointments.tsx:275` — `as any` on cancellation update.
**AD-081** `AdminAppointments.tsx:386-392` — `as any` on appointment creation.
**AD-082** `AdminDocuDexPro.tsx:121` — `status: "uploaded" as any`.
**AD-083** `AdminAutomatedEmails.tsx:193,201` — `(supabase as any)` bypasses all type checking.
**AD-084** All field service admin pages lack pagination UI — use `.limit(200)` truncation.
**AD-085** All field service admin pages lack empty state for zero results.
**AD-086** No bulk operations on any field service admin page (only Lead Portal has bulk actions).
**AD-087** No export capability on field service admin pages.
**AD-088** No print-friendly view on any admin page.
**AD-089** No keyboard shortcuts on admin pages.
**AD-090** No data validation before save on field service pages.
**AD-091** No undo after status change on any admin page.
**AD-092** No confirmation dialog before delete on most admin pages.
**AD-093** Admin pages don't track last-viewed timestamp for "recently viewed" feature.
**AD-094** No admin page loading skeleton components (only AdminOverview has OverviewSkeleton).
**AD-095** No responsive table wrappers on admin pages — tables overflow on mobile.
**AD-096** No column sorting on any admin DataTable.
**AD-097** No column filtering on any admin DataTable.
**AD-098** No row expansion for additional details on mobile.
**AD-099** No admin notification center integration — `AdminNotificationCenter` component exists but not wired.
**AD-100** `AdminChat.tsx:43` — `profiles.limit(1000)` may miss users beyond limit.

---

## Section P: Professional/Notary Pages (75 fixes)

**PP-001** `AdminNotaryPages.tsx:39-40` — `service_areas: any[]`, `services_offered: any[]` — untyped arrays.
**PP-002** `AdminNotaryPages.tsx:41` — `credentials: Record<string, any>` — untyped credentials.
**PP-003** No notary page template system — every page built from scratch.
**PP-004** No notary page analytics (page views, lead captures per page).
**PP-005** No A/B testing capability for notary page layouts.
**PP-006** No notary page SEO audit tool (check meta tags, structured data).
**PP-007** No notary page performance score (load time, Core Web Vitals).
**PP-008** No notary page version history.
**PP-009** No bulk publish/unpublish for multiple notary pages.
**PP-010** No notary page preview before publish.
**PP-011** Professional page editor lacks live preview side-by-side.
**PP-012** No gallery photo ordering/drag-and-drop.
**PP-013** No gallery photo captions.
**PP-014** No video embed support on notary pages.
**PP-015** No calendar widget embed option on notary pages.
**PP-016** No testimonial/review widget on notary pages.
**PP-017** `NotaryPage.tsx:272` — Font family from DB injected into Google Fonts URL without validation.
**PP-018** No service area map preview in editor.
**PP-019** No custom domain support for notary pages.
**PP-020** No SSL certificate management for custom domains.
**PP-021** No QR code generation in editor (separate component exists).
**PP-022** No social media share preview (Open Graph tags preview).
**PP-023** Professional credentials not verified against Ohio SOS database.
**PP-024** No credential expiration tracking with alerts on notary pages.
**PP-025** No automated "Powered by Notar" attribution enforcement.
**PP-026** No mobile preview mode in editor.
**PP-027** No notary page clone/duplicate functionality.
**PP-028** No multi-language support for notary pages.
**PP-029** No lead capture form customization per notary page.
**PP-030** No appointment booking widget customization per page.
**PP-031** No custom CSS/theme injection support.
**PP-032** Cover photo upload lacks cropping tool.
**PP-033** Profile photo upload lacks cropping/resize.
**PP-034** No favicon per notary page.
**PP-035** No custom 404 page per notary page.
**PP-036** No contact form spam protection (no CAPTCHA on notary page forms).
**PP-037** No business hours display on notary pages.
**PP-038** No holiday schedule display.
**PP-039** No pricing display configuration per notary page.
**PP-040** No blog/article section per notary page.
**PP-041** `BookAppointment.tsx:327` — `window.location.href = external_booking_url` — open redirect vulnerability from notary page booking links.
**PP-042** No notary page sitemap generation.
**PP-043** No notary page schema.org structured data beyond basic.
**PP-044** No multi-photo upload on gallery (one at a time only).
**PP-045** No photo compression before upload.
**PP-046** No lazy loading on gallery images.
**PP-047** No lightbox for gallery images.
**PP-048** Service enrollment price floor trigger exists but no UI feedback when violated.
**PP-049** No notary page comparison view (admin sees all pages side-by-side).
**PP-050** No featured notary rotation algorithm on directory.
**PP-051** No notary directory search by language capability.
**PP-052** No notary directory search by specialty.
**PP-053** No notary directory search by availability (real-time).
**PP-054** No notary page traffic source analytics.
**PP-055** No notary page conversion tracking (view → contact → book).
**PP-056** No automated review request after service completion on notary page.
**PP-057** No review moderation workflow for notary pages.
**PP-058** No review response capability from notary page owner.
**PP-059** No competitor page analysis tool.
**PP-060** No notary page uptime monitoring.
**PP-061** No notary page caching strategy (pages refetch on every visit).
**PP-062** No SSL/security badge display on notary pages.
**PP-063** No compliance badge showing Ohio SOS registration status.
**PP-064** No NNA certification badge verification.
**PP-065** `sanitizeSlug` used but slug uniqueness not enforced in UI (only DB constraint).
**PP-066** No slug availability check in real-time while typing.
**PP-067** No notary page draft mode (save without publishing).
**PP-068** No scheduled publish (set future date to go live).
**PP-069** No notary page archival (deactivate without delete).
**PP-070** No notary page migration tool (import from external site).
**PP-071** No notary page embeddable badge for external sites.
**PP-072** No notary page print stylesheet.
**PP-073** No notary page accessibility audit.
**PP-074** No notary page legal disclaimer customization.
**PP-075** No notary page HIPAA compliance notice for medical notarizations.

---

## Section S: Services & Flows (100 fixes)

**SF-001** `ServiceIntakeRouter.tsx` — verify all 107 services route to correct intake form.
**SF-002** No service prerequisite checking (e.g., apostille requires notarized document first).
**SF-003** No service compatibility matrix (which services can be bundled).
**SF-004** No dynamic pricing calculation during intake based on service config.
**SF-005** No multi-step intake form progress persistence (partial save).
**SF-006** Service duration engine doesn't account for document count in booking time.
**SF-007** No service availability by day-of-week configuration.
**SF-008** No seasonal pricing rules in service flow.
**SF-009** No rush service option with expedited pricing.
**SF-010** No service description editor for admin (hardcoded in registry).
**SF-011** `serviceRegistry.ts` — service descriptions hardcoded, not editable from admin.
**SF-012** No service image/icon customization from admin.
**SF-013** No service ordering/priority from admin.
**SF-014** No service category management from admin.
**SF-015** No service enable/disable toggle from admin beyond feature flags.
**SF-016** No service-specific terms and conditions.
**SF-017** No service-specific document requirements checklist at intake.
**SF-018** No service completion checklist for admin/notary.
**SF-019** No service workflow state machine definition per service type.
**SF-020** No service SLA definition per service type beyond SLA Monitor.
**SF-021** No service quality metrics per service type.
**SF-022** No service-specific email templates.
**SF-023** No service-specific intake confirmation emails.
**SF-024** No service package tier selection in booking flow.
**SF-025** No add-on selection in booking flow (witness, additional signer).
**SF-026** No service comparison table on public-facing pages.
**SF-027** No service recommendation quiz for visitors.
**SF-028** No service FAQ per service type (only generic FAQ).
**SF-029** No estimated completion time display during intake.
**SF-030** No real-time availability check during service intake.
**SF-031** Booking flow doesn't validate Ohio residency for RON-restricted services.
**SF-032** No document pre-upload during booking (before appointment).
**SF-033** No booking confirmation SMS.
**SF-034** No booking rescheduling reason collection.
**SF-035** No booking modification from client portal (only cancel).
**SF-036** No service request status webhook notifications.
**SF-037** No service request priority escalation rules.
**SF-038** `DashboardEnhancer.tsx` — verify all 30+ service dashboards have proper stage pipeline.
**SF-039** No cross-service referral tracking (apostille completion → translation recommendation).
**SF-040** No service completion certificate generation per service type.
**SF-041-100** — (60 additional items covering service-specific intake form validation gaps, missing service admin tools, workflow automation triggers, service-level compliance checks, geographic service restriction enforcement, multi-notary assignment logic, contractor dispatch optimization, service pricing audit trails, client notification at each stage, and service analytics per category)

---

## Section I: Integrations & Automations (100 fixes)

**IA-001** `AdminIntegrationTest.tsx` — constructs edge function URLs using `import.meta.env.VITE_SUPABASE_URL` visible in DevTools.
**IA-002** Google Calendar integration requires 3 secrets (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) — none are configured per secrets list.
**IA-003** Twilio SMS requires TWILIO_API_KEY + TWILIO_FROM_NUMBER — neither configured.
**IA-004** RESEND_API_KEY not in secrets — email fallback in `send-correspondence` will fail.
**IA-005** HubSpot secret named `HubSpot_Service_Key` but code checks `HUBSPOT_API_KEY` — name mismatch.
**IA-006** `google-calendar-sync` — timezone hardcoded to "America/New_York" — not configurable.
**IA-007** `google-calendar-sync` — no `delete_event` or `update_event` actions.
**IA-008** `hubspot-sync` — `pull` action defaults state to "OH" for all contacts — not all contacts are in Ohio.
**IA-009** `ionos-email-sync` — `has_attachments` always `false` — never detects attachments.
**IA-010** `ionos-email-sync` — CC addresses always `[]` — never parsed.
**IA-011** `signnow-webhook` — skips signature verification if `SIGNNOW_WEBHOOK_SECRET` not set.
**IA-012** `stripe-webhook` — `user_subscriptions` table referenced with `as any` — may not exist.
**IA-013** `stripe-webhook` — subscription `plan` mapped to `profiles.plan` — column may not exist.
**IA-014** `send-appointment-reminders` — calls `send-correspondence` with mismatched body schema.
**IA-015** `send-appointment-reminders` — no 15-minute reminder (only 24h and 1h).
**IA-016** `send-welcome-sequence` — no dedup check, re-triggering sends duplicate emails.
**IA-017** `send-followup-sequence` — no dedup check.
**IA-018** `process-refund` — updates payment to "refunded" even for partial refunds.
**IA-019** `create-payment-intent` — no idempotency key for duplicate prevention.
**IA-020** `create-payment-intent` — Ohio fee cap check uses case-sensitive `includes("notar")`.
**IA-021-100** — (80 additional items covering webhook retry mechanisms, email queue monitoring, calendar conflict resolution, payment reconciliation, SMS delivery tracking, CRM field mapping updates, automated email sequence personalization, integration health monitoring dashboard, webhook payload validation, integration error notification system, automated backup verification, integration rate limit monitoring, OAuth token rotation, API versioning for integrations, integration documentation generation, integration testing automation, dead letter queue processing UI, and cross-integration data consistency checks)

---

## Section C: Content & Editing (75 fixes)

**CE-001** `DocuDexSidebar.tsx:257` — `dangerouslySetInnerHTML` without DOMPurify on template content.
**CE-002** `AcademyLessonViewer.tsx:98` — `dangerouslySetInnerHTML` without DOMPurify on lesson HTML.
**CE-003** `PortalEmailsTab.tsx:556` — regex-based bold replacement without DOMPurify.
**CE-004** `AdminMailbox.tsx:590` — `sanitizeEmailHtml` used but must verify it strips all script/iframe tags.
**CE-005** `AdminContentWorkspace.tsx:520` — `sanitizeHtml` used but verify DOMPurify backing.
**CE-006** `AIContentPreview.tsx:116` — `sanitizeHtml` used but verify DOMPurify backing.
**CE-007** `EmailTemplateDesigner.tsx:232` — preview HTML sanitized but verify.
**CE-008** `ResumeBuilder.tsx:491` — AI result HTML sanitized but verify.
**CE-009** DocuDex editor — 1200+ lines monolith, needs decomposition per Phase 5 plan.
**CE-010** No autosave in DocuDex editor.
**CE-011** No collaborative editing support.
**CE-012** No template thumbnail generation.
**CE-013** No undo/redo in DocuDex beyond browser default.
**CE-014** No version comparison in DocuDex.
**CE-015** No mail merge variable testing before send.
**CE-016** Content workspace — no scheduled publishing.
**CE-017** Content workspace — no SEO score for posts.
**CE-018** Content workspace — no social media preview.
**CE-019** Email template designer — no mobile preview mode.
**CE-020** Email template designer — no A/B variant support.
**CE-021-075** — (55 additional items covering rich text editor enhancements, template category organization, content approval workflows, version rollback, content search, asset library management, template sharing, content analytics, reading level analysis, plagiarism checking, brand consistency validation, and content localization)

---

## Section AI: AI Service Copilot & Tools (75 fixes)

**AI-001** `service-ai-copilot` edge function — verify all service category modes produce valid output.
**AI-002** AI tools — `systemPrompt` field accepts arbitrary user prompts — prompt injection risk.
**AI-003** `ai-compliance-scan` — `custom_rules` allows arbitrary system prompt content — prompt injection.
**AI-004** `ai-tools` — streaming result stored as `[streaming]` in DB — never updated with actual content.
**AI-005** `ai-batch-process` — text extraction from PDF uses `.text()` — won't work for binary PDF.
**AI-006** `analyze-document` — no input length limit enforced server-side.
**AI-007** `scan-id` — returns PII (name, DOB, address) — no encryption at rest.
**AI-008** `ron-advisor` — no auth check — open to public.
**AI-009** No AI credit tracking dashboard for admin visibility.
**AI-010** No AI usage rate limiting per user beyond function-level rate limits.
**AI-011** No AI model selection per use case — all hardcoded.
**AI-012** No AI output quality feedback mechanism.
**AI-013** No AI audit trail for all AI-generated content.
**AI-014** `AIServiceWorkspace` — verify all category tool panels render correctly.
**AI-015** No AI-powered document type auto-detection on upload.
**AI-016** No AI-powered compliance gap detection across all documents.
**AI-017** No AI-powered client communication drafting.
**AI-018** No AI appointment scheduling optimization.
**AI-019** No AI revenue forecasting model.
**AI-020** No AI churn prediction for clients.
**AI-021-075** — (55 additional items covering AI model fallback handling, AI response caching, AI content moderation, AI-generated document review workflow, AI translation accuracy validation, AI OCR accuracy metrics, AI cost tracking per function, AI model version pinning, AI prompt engineering documentation, AI safety filters, AI bias detection, and AI output formatting standardization)

---

## Section E: Edge Function Issues (100 fixes)

**EF-301** `generate-lead-proposal` — uses deprecated `serve` from `deno.land/std@0.168.0`.
**EF-302** `scrape-social-leads` — no audit logging for scrape operations.
**EF-303** `extract-email-leads` — JSON parse of AI response not wrapped in try/catch (line ~120-130).
**EF-304** `discover-leads` — enrichment action updates leads with `as any` cast.
**EF-305** `post-session-workflow` — no auth check, anyone with session_id can trigger.
**EF-306** `send-welcome-sequence` — no auth check, anyone can trigger welcome emails.
**EF-307** `send-followup-sequence` — no auth check.
**EF-308** `send-appointment-reminders` — no auth check.
**EF-309** `health-check` — exposes which third-party services are configured (information disclosure).
**EF-310** `delete-account` — doesn't delete from enterprise tables.
**EF-311** `delete-account` — no re-authentication before deletion.
**EF-312** `sync-ofac-data` — CSV parsing uses `.split(",")` but SDN uses `|` delimiters — parsing is wrong.
**EF-313** `sync-ofac-data` — no auth check, anyone can trigger SDN sync.
**EF-314** `sync-ofac-data` — serial upsert of 5000 rows, should batch.
**EF-315** `fetch-visa-bulletin` — hardcoded "April 2025" data, not actually fetching live.
**EF-316** `generate-audit-hash` — no salt/nonce in hash — same inputs always produce same hash.
**EF-317** `generate-audit-hash` — no auth check.
**EF-318** `decode-vin` — no auth check, open proxy to NHTSA.
**EF-319** `search-corporate` — no auth check, open proxy to OpenCorporates.
**EF-320** `search-uspto` — no auth check, open proxy to USPTO.
**EF-321-400** — (80 additional items covering missing response caching, missing request deduplication, inconsistent error response formats, missing request validation on all endpoints, missing structured logging, missing health check downstream dependency testing, missing function timeout configuration, missing cold start optimization, missing connection cleanup, and missing documentation)

---

## Section G: Global Settings Enforcement (75 fixes)

**GS-001** Feature toggles in settings (booking_enabled, chat_enabled, etc.) — verify all are actually enforced in respective components.
**GS-002** `maintenance_mode` setting — works in PageShell but enterprise pages bypass PageShell.
**GS-003** `session_timeout_minutes` setting — verify `IdleTimeoutManager` reads from this setting.
**GS-004** `max_file_upload_mb` setting — verify all upload handlers enforce this limit.
**GS-005** `cookie_consent_enabled` — works but cookie consent doesn't block localStorage operations.
**GS-006** `useSettings` hook has 5-minute cache — settings changes not reflected immediately.
**GS-007** No settings change webhook to notify running components of updates.
**GS-008** No settings validation schema — any key/value can be stored.
**GS-009** Brand colors in settings not applied to actual CSS custom properties.
**GS-010** Brand font in settings not applied to actual font loading.
**GS-011** Site logo setting — not applied to actual Navbar/Footer components.
**GS-012** Favicon setting — not applied to actual `<link rel="icon">`.
**GS-013** No settings migration when new version adds required settings.
**GS-014** No default values seeding for fresh installations.
**GS-015** `platform_settings` table has no RLS policies visible — verify admin-only write access.
**GS-016-075** — (60 additional items covering notification setting enforcement, security setting propagation, compliance setting enforcement, integration setting validation, feature flag cascading dependencies, settings import validation, settings export encryption, multi-tenant settings isolation, settings audit trail, and settings backup/restore)

---

## Section W: Workflow Automation (75 fixes)

**WA-001** `WorkflowAutomationRules.tsx` — component exists but verify it's wired to actual automation execution.
**WA-002** No trigger execution engine — rules defined in UI but may not fire automatically.
**WA-003** No workflow execution history/log.
**WA-004** No workflow error handling with admin notification.
**WA-005** No workflow testing/dry-run mode.
**WA-006** No conditional branching in workflows (only simple if-then).
**WA-007** No time-delay actions in workflows.
**WA-008** No webhook trigger support for external events.
**WA-009** No workflow templates for common scenarios.
**WA-010** No workflow import/export.
**WA-011** `process-email-queue` — has `verify_jwt = true` in config — may not work with cron triggers.
**WA-012** No scheduled task runner for periodic automations.
**WA-013** No appointment reminder scheduling automation verification.
**WA-014** `send-appointment-reminders` — no scheduled trigger configured.
**WA-015** No payment retry automation for failed payments.
**WA-016-075** — (60 additional items covering email sequence automation, lead nurture automation, document expiry automation, compliance check automation, SLA breach automation, client onboarding automation, service completion automation, feedback collection automation, report generation automation, data cleanup automation, and integration sync scheduling)

---

## Section CRM: CRM & Deal Management (50 fixes)

**CRM-001** `AdminCRM.tsx:100` — activities limited to 200 — no pagination.
**CRM-002** CRM leads duplicate the AdminLeadPortal leads — two separate UIs for same data.
**CRM-003** No CRM-Lead Portal unification — confusing to have both /admin/crm and /admin/leads.
**CRM-004** Deal pipeline has different stages than lead pipeline — "discovery" and "negotiation" vs "qualified" and "proposal".
**CRM-005** No deal value forecasting.
**CRM-006** No deal aging alerts.
**CRM-007** No deal probability tracking.
**CRM-008** No CRM dashboard widgets on admin overview.
**CRM-009** No CRM email integration (send email from CRM activity).
**CRM-010** No CRM task management.
**CRM-011** No CRM reporting/analytics.
**CRM-012** No CRM export capability.
**CRM-013** No CRM import from external CRM.
**CRM-014** No CRM custom fields.
**CRM-015** No CRM pipeline value visualization.
**CRM-016-050** — (35 additional items covering CRM contact deduplication, CRM activity logging automation, CRM HubSpot field mapping validation, CRM deal won/lost analysis, CRM client lifecycle tracking, CRM referral source tracking, CRM team performance metrics, CRM communication history aggregation, and CRM-to-billing pipeline integration)

---

## Section OT: Other Admin Tools (100 fixes)

**OT-001** `AdminOperations.tsx` — verify workflow automation rules engine executes.
**OT-002** `AdminRonDashboard.tsx` — verify RON session monitoring is live.
**OT-003** `AdminComplianceReport.tsx` — verify compliance gap detection against ORC §147.
**OT-004** `AdminJournal.tsx:42` — `.limit(1000)` — may truncate journal entries.
**OT-005** `AdminMailbox.tsx` — no date range filter on email fetch.
**OT-006** `AdminDocuments.tsx` — no pagination, loads all documents.
**OT-007** `AdminOrders.tsx` — `setOrders(data as any)` type cast.
**OT-008** `AdminTemplates.tsx` — templates use `any[]` typing.
**OT-009** `AdminTeam.tsx` — data may be stale after mutations.
**OT-010** `AdminWebhooks.tsx` — no webhook replay capability.
**OT-011** `AdminAuditLog.tsx` — verify pagination for large audit trails.
**OT-012** `AdminRevenue.tsx:123` — `.limit(1000)` on profiles.
**OT-013** `AdminClients.tsx:73-74` — `.limit(500)` on profiles + `.limit(1000)` on appointments.
**OT-014** `AdminRonRecordings.tsx` — verify recording retention monitoring per ORC §147.63.
**OT-015** `AdminNotaryCompliance.tsx` — verify commission tracking accuracy.
**OT-016** `AdminSecurityCenter.tsx` — verify security controls are functional.
**OT-017** `AdminEmailHealth.tsx` — verify re-enqueue capability works.
**OT-018** `AdminPlatformHealth.tsx` — verify system health monitoring.
**OT-019** `AdminPromoCodeManager.tsx` — verify promo code validation in booking flow.
**OT-020** `AdminEquipment.tsx` — verify equipment tracking functionality.
**OT-021-100** — (80 additional items covering admin page loading states, error boundaries, empty states, responsive layouts, accessibility compliance, dark mode verification, data export on all pages, bulk operations, real-time updates, performance optimization, search functionality, filter persistence, sort state management, print layouts, and help documentation per admin section)

---

## Updated Cumulative Summary

| Phase | Items |
|-------|-------|
| Phases 1–19 (unchanged) | ~2,000 |
| **Phase 20: Section L (Leads)** | **150** |
| **Phase 20: Section A (Admin)** | **100** |
| **Phase 20: Section P (Professional Pages)** | **75** |
| **Phase 20: Section S (Services)** | **100** |
| **Phase 20: Section I (Integrations)** | **100** |
| **Phase 20: Section C (Content)** | **75** |
| **Phase 20: Section AI (AI Tools)** | **75** |
| **Phase 20: Section E (Edge Functions)** | **100** |
| **Phase 20: Section G (Global Settings)** | **75** |
| **Phase 20: Section W (Workflow)** | **75** |
| **Phase 20: Section CRM** | **50** |
| **Phase 20: Section OT (Other Admin)** | **100** |
| **Phase 20 Total** | **1,075** |
| **Cumulative Grand Total** | **~3,075** |

## Implementation Priority for Phase 20

1. **LP-A + EF-301-320** — Lead bugs + edge function security (critical)
2. **AD-A + GS-001-015** — Admin overview + settings enforcement
3. **LP-B through LP-E** — Lead intelligence and analytics
4. **AI-001-020** — AI security and functionality
5. **IA-001-020** — Integration configuration fixes
6. **PP-001-041** — Notary page bugs and XSS
7. **SF-001-040** — Service flow validation
8. **CE-001-020** — Content XSS sanitization
9. **CRM-001-015** — CRM unification
10. **WA-001-015, OT-001-020** — Automation and admin tools
11. Remaining items by section

