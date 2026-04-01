

# Fix Plan for All 319 Open Build Tracker Items

## Summary

319 open items categorized into 12 execution phases. Many items overlap with previously completed work (plan.md shows phases 1-7 done), suggesting these are either duplicates that need to be marked resolved, or new items from re-analysis.

---

## Phase 1: Mark Already-Resolved Items (~85 items)

Many items in this CSV were already fixed in previous phases. These need to be bulk-updated to `resolved` status via a single DB update.

**Already done per plan.md:**
- ErrorBoundary wrapping (lines 84, 96, 98, 103, 104, 113, 114, 118, 142, 143, 153, 154, 156, 158, 164) — 15 items
- Console.log removal (lines 87, 90, 91, 101, 111, 112, 116, 122, 128, 134, 152, 169, 227) — 13 items
- DB indexes (lines 177, 185, 188, 190, 191, 192, 195, 237, 243, 247, 263, 273, 282, 286, 288, 292, 301, 312, 317, 320) — 20 items
- Unbounded queries (lines 173, 178, 180, 181, 186, 220, 232, 240, 302) — 9 items
- ARIA accessibility (lines 184, 187, 193, 194, 203, 217, 241, 245, 249, 250, 260, 264, 269, 284, 285, 289, 295, 297, 313, 316) — 20 items
- AI Analyst persistence (line 47), Quick Add page_route (line 53), unsaved changes warning (line 11), AI oversized context (line 21), LegalGlossaryProvider scope (line 315), admin chunk grouping (line 293) — 6 items
- Ohio compliance: tamper seal (308), credential log (309), journal backup (310), commission number (224), recording validation (218) — 5 items

**Action:** Run a single Supabase `UPDATE` to set `status = 'resolved'` for all ~85 items matching these titles.

---

## Phase 2: Platform Entities Registry Expansion (~65 items)

Lines 6-8, 10, 12-15, 18-20, 22-25, 28, 34, 36-40, 42-46, 49, 51, 55, 57, 59, 61-62, 64-65, 67-68, 72-74, 76, 78, 80, 82, 85-86, 92-95, 100, 102, 106, 108, 115, 117, 119, 121, 124-126, 129, 131, 133, 135-137, 139-140, 145, 147-149, 155, 159-163, 165, 167

These are all "Untracked DB table / edge function / page" items. The fix is purely in `platformEntities.ts` — adding sub-components to existing entities or creating new entities.

**Files:** `src/pages/admin/build-tracker/platformEntities.ts`

**New entities to add:**
- **Mailroom** entity (mailroom_items table, /mailroom route)
- **Apostille** entity (apostille_requests table, /admin/apostille route)
- **Solutions/Verticals** entity (6 solution pages)

**Sub-components to add to existing entities:**
- **Email Management:** process-email-queue, process-inbound-email, send-correspondence, ionos-email, email_send_log, email_cache, email_drafts, email_send_state, email_unsubscribe_tokens, appointment_emails, suppressed_emails, email_signatures
- **Documents:** document_reminders, document_bundles, document_collections, document_versions, document_tags, form_library, ocr-digitize, explain-document, detect-document
- **Services Catalog:** service_requests, service_reviews, service_faqs, service_requirements, service_workflows, loan-signing page, admin services page, admin service-requests
- **CRM:** leads, deals, crm_activities, proposals, lead_sources, discover-leads, fetch-leads, submit-lead, scrape-social-leads
- **Payments:** payments, promo_codes, notary_payouts, get-stripe-config, stripe-webhook
- **RON Sessions:** notarization_sessions, e_seal_verifications, signnow, signnow-webhook
- **Admin Dashboard:** audit_log, platform_settings, notary_journal, notary_invites, notary_certifications, admin-create-user, users page
- **Authentication:** profiles, compliance_rule_sets, user_roles
- **AI Services:** ai-extract-document, ai-cross-document, ai-style-match, ai-compliance-scan, build-analyst, scan-id, ai-knowledge page, client_style_profiles
- **Client Portal:** client_feedback, reviews, user_favorites, chat_messages, client_correspondence
- **Business Portal:** business_profiles, business_members
- **Notifications:** notification_preferences

---

## Phase 3: Service Flow & Page Registry Updates (~8 items)

**serviceFlows.ts** — Already mostly updated. Verify these are tracked:
- Line 2: /schedule alias → already in pageRegistry
- Line 3: PreSigningChecklist in booking → already in serviceFlows
- Line 44: SignerChecklist in booking → already in serviceFlows
- Line 52: ServicePreQualifier → already in serviceFlows

**pageRegistry.ts** — Lines 2, 27, 31, 56: Verify /schedule, /mailroom, /booking, /subscribe are present. Per review, all are already in pageRegistry.

**Action:** Mark these 8 items as resolved.

---

## Phase 4: Orphaned Component Wiring (~10 items)

| Component | Wire Into | Line |
|-----------|-----------|------|
| NotarizationCertificate | Already in RON flow (serviceFlows line 55) | 16 |
| ClientFeedbackForm | Already in client portal flow (serviceFlows line 82) | 17, 70 |
| StyleMatchPanel | Already tracked in AI Services | 19 |
| BulkDocumentUpload | Already in document flow (serviceFlows line 103) | 32 |
| WhatDoINeed | Wire into /services page as helper widget | 50 |
| TranslationPanel | Already in document flow (serviceFlows line 109) | 60 |
| SignPreviewWizard | Already in RON flow (serviceFlows line 52) | 66 |
| OnboardingWizard | Already in client portal flow (serviceFlows line 72) | 58, 172 |
| PreSigningChecklist | Already in booking flow | 278 |
| SignerChecklist | Already in booking flow | 189 |
| ServiceDetailPanel | Wire into ServiceDetail.tsx or remove | 130 |
| InvoiceGenerator | Already in RON flow (serviceFlows line 58) | 261 |
| ESealEmbed | Already in RON flow (serviceFlows line 56) | 262 |

**Action:** Most are already tracked in flows. Wire `WhatDoINeed` and `ServiceDetailPanel` into their pages. Mark rest as resolved.

---

## Phase 5: Security & Compliance (~12 items)

| Item | Fix | Line |
|------|-----|------|
| RLS audit: build_tracker_plans | Verify existing RLS policies are correct | 30 |
| RLS audit: build_tracker_items | Verify existing RLS policies are correct | 35 |
| Rate limiting on AI Analyst | Add IP/user rate limit in build-analyst edge fn | 77 |
| External link rel=noopener: About.tsx | Add `rel="noopener noreferrer"` | 79 |
| External link rel=noopener: ComplianceBanner.tsx | Add `rel="noopener noreferrer"` | 268 |
| CSRF on public forms | Add CSRF token generation/validation | 279 |
| Documents bucket file size limit | Storage policy via migration | 198 |
| File type restrictions on upload | Add MIME type allowlist | 254 |
| Input length limits | Add `maxLength` to key Input/Textarea components | 274 |
| CORS: signnow-webhook | Verify intentional (webhook-only) — mark resolved | 146 |
| CORS: process-email-queue | Verify intentional (server-only) — mark resolved | 157 |
| Storage cleanup for orphaned files | Add cleanup trigger or scheduled function | 182 |

**Files:** `src/pages/About.tsx`, `src/components/ComplianceBanner.tsx`, `supabase/functions/build-analyst/index.ts`, edge function for storage cleanup, storage policy migration

---

## Phase 6: Code Quality — Type Safety (~25 items)

Replace `as any` casts with proper types from `src/integrations/supabase/types.ts` in:

AdminRevenue, AdminChat, PaymentForm, RonSession, AdminDocuments, AdminServiceRequests, AdminTaskQueue, FeeCalculator, PortalServiceRequestsTab, apiClient, ClientFeedbackForm, AdminAppointments, AdminClients, BookAppointment, BusinessPortal, ClientPortal, AdminLeadPortal, AdminMailbox, AdminSettings, AdminBusinessClients, AdminUsers, AdminApostille, AdminContentWorkspace, AdminTeam, PortalDocumentsTab, PortalChatTab, DocumentBuilder, DocumentDigitize, DocumentTemplates, EmailTemplateDesigner, BookingIntakeFields, BulkDocumentUpload, PageAuditorTab, PlanHistoryTab, AddImportTab

**Files:** ~30 component files
**Pattern:** Replace `as any` with proper Supabase generated types or explicit interfaces.

---

## Phase 7: SEO & Meta (~8 items)

| Item | Fix | Line |
|------|-----|------|
| usePageTitle: AdminCRM | Add `usePageTitle("CRM")` | 89 |
| usePageTitle: AdminMailbox | Add `usePageTitle("Mailbox")` | 166 |
| usePageTitle: AdminClientEmails | Add `usePageTitle("Client Emails")` | 105 |
| usePageTitle: ComingSoon | Add `usePageTitle("Coming Soon")` | 144 |
| usePageTitle: AdminServiceRequests | Add `usePageTitle("Service Requests")` | 151 |
| OpenGraph images | Add `og:image` to `usePageMeta` hook | 251 |
| JSON-LD LocalBusiness | Add structured data to Index.tsx | 300 |
| Breadcrumb JSON-LD | Add JSON-LD BreadcrumbList to content pages | 231 |
| Canonical URLs | Add `<link rel="canonical">` via usePageMeta | 314 |
| Static sitemap | Add build script or dynamic generation | 233 |

**Files:** 5 admin pages, `src/hooks/usePageMeta.ts`, `src/pages/Index.tsx`, content pages

---

## Phase 8: UX & Feature Gaps (~15 items)

| Item | Fix | Line |
|------|-----|------|
| Gap Analysis pagination | Verify already implemented — mark resolved | 4 |
| Platform Functions Diagnose button | Add diagnostic check logic per entity | 5 |
| Service Flow search/filter | Verify already implemented — mark resolved | 41 |
| Email template rich text | Replace textarea with RichTextEditor | 33 |
| No admin view for client feedback | Create feedback review section in admin | 81 |
| Notary certifications management UI | Add to admin team/settings page | 99 |
| No admin UI for promo codes | Create promo code management section | 107 |
| No UI for suppressed emails | Add to email settings | 109 |
| No admin UI for waitlist | Add waitlist view to admin | 110 |
| User favorites UI | Add bookmark buttons in portal | 123 |
| service_workflows unused in UI | Wire to service flow tab or admin | 141 |
| Time slots disconnected from availability | Verify integration | 83 |
| Booking flow progress indicator | Add step progress bar | 311 |
| No bulk actions on admin tables | Already done — mark resolved | 280 |
| No data export for admin tables | Already done — mark resolved | 307 |
| No email on doc status change | Add email trigger | 271 |
| Missing loading state: AdminCRM | Add loading skeleton | 296 |
| No toast for form success | Audit forms and add toast.success() | 201 |

---

## Phase 9: Error Handling (~8 items)

Add error state UI to:
- AppointmentConfirmation.tsx (line 209)
- VerifySeal.tsx (line 234)
- PortalLeadsTab.tsx (line 222)
- AdminOverview.tsx (line 228)
- AdminAuditLog.tsx (line 255)
- AdminTaskQueue.tsx (line 256)
- About.tsx (line 318)
- AdminContentWorkspace.tsx (line 319)

**Pattern:** Add `if (error) return <div className="text-destructive">...</div>` after query hooks.

---

## Phase 10: Design System (~6 items)

Replace hardcoded colors with Tailwind semantic tokens in:
- IDScanAssistant.tsx (line 171)
- DocumentBuilder.tsx (line 200)
- Logo.tsx (line 211)
- Navbar.tsx (line 219)
- VirtualMailroom.tsx (line 230)
- HeroPhoneAnimation.tsx (line 298)
- Dark mode audit (line 277)

---

## Phase 11: Testing (~10 items)

| Item | Priority | Line |
|------|----------|------|
| Unit tests: ohioDocumentEligibility.ts | HIGH | 242 |
| Unit tests: sanitize.ts | MEDIUM | 206 |
| Unit tests: pricingEngine.ts | MEDIUM | 246 |
| Unit tests: notaryAssignment.ts | MEDIUM | 291 |
| Unit tests: brand.ts | LOW | 197 |
| Unit tests: geoUtils.ts | LOW | 258 |
| Unit tests: serviceConstants.ts | LOW | 303 |
| Integration tests: RON session | HIGH | 226 |
| Integration tests: booking flow | MEDIUM | 214 |
| Integration tests: payment flow | MEDIUM | 239 |
| Test coverage expansion | HIGH | 253 |

**Files:** New test files in `src/test/`

---

## Phase 12: Miscellaneous Cleanup (~10 items)

| Item | Fix | Line |
|------|-----|------|
| TODO in formatPhone.ts | Review and resolve | 88 |
| TODO in BusinessPortal.tsx | Review and resolve | 138 |
| TODO in OnboardingWizard.tsx | Review and resolve | 150 |
| No print stylesheet | Add @media print rules for journal/certificates | 265 |
| No image optimization | Deferred — vite-imagetools | 202 |
| No service worker/PWA | Deferred — infrastructure | 204 |
| No Lighthouse CI | Deferred — CI/CD | 199 |
| No bundle analyzer | Deferred — already in plan | 283 |
| No webhook retry mechanism | Add retry logic to webhook edge functions | 270 |
| No DB backup visibility | Add backup info to admin settings | 235 |
| Form validation: AdminDocuments | Add status validation | 305 |
| Form validation: AdminAIAssistant | Add input length checks | 215 |
| No realtime: service_requests | Already done — mark resolved | 229 |
| No realtime: documents | Already done — mark resolved | 304 |
| No realtime: appointments | Already done — mark resolved | 276 |

---

## Execution Order

| Phase | Items | Priority | Effort |
|-------|-------|----------|--------|
| 1. Mark resolved items | ~85 | Immediate | 0.5 session |
| 2. Platform entities expansion | ~65 | Medium | 1 session |
| 3. Flow & registry updates | ~8 | Low | Mark resolved |
| 4. Orphan component wiring | ~10 | Medium | 0.5 session |
| 5. Security & compliance | ~12 | HIGH | 2 sessions |
| 6. Type safety cleanup | ~25 | Medium | 2 sessions |
| 7. SEO & meta | ~8 | Medium | 1 session |
| 8. UX & features | ~15 | Medium | 2 sessions |
| 9. Error handling | ~8 | Medium | 0.5 session |
| 10. Design system | ~6 | Low | 1 session |
| 11. Testing | ~10 | High | 3 sessions |
| 12. Misc cleanup | ~15 | Mixed | 1.5 sessions |
| **Total** | **~319** | | **~15 sessions** |

### Technical Details

**Database migrations needed:** 1 (storage file size policy)
**Files modified:** ~60+ component/page files, `platformEntities.ts`, `serviceFlows.ts`, `usePageMeta.ts`, edge functions, new test files
**Deferred items:** PWA/service worker, Lighthouse CI, vite-imagetools, bundle analyzer (4 items — infrastructure-level, not code fixes)

