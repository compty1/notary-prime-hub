

# Expanded Plan: 650+ Gaps, Enhancements & Full Implementation Roadmap

This extends the existing 450-item audit with 200+ additional recommendations, 20+ new gaps per category, and comprehensive admin portal enhancements. Nothing from the current plan is removed.

---

## EXISTING PHASES 1-9 (UNCHANGED)

All existing Phases 1 through 9 remain exactly as written in the current plan.

---

## NEW CATEGORY EXPANSIONS (20+ additional per existing category)

### Category A Expansion: SEO & Meta (Items 451-475)

451. No `hreflang` tag for English-US locale specificity
452. No XML sitemap auto-generation from routes in `App.tsx`
453. No `og:locale` meta tag on any page
454. No Twitter card meta tags (`twitter:card`, `twitter:site`)
455. Missing `robots` meta on admin pages (should be `noindex,nofollow`)
456. No breadcrumb JSON-LD schema despite `Breadcrumbs.tsx` component existing
457. `sitemap.xml` is static and missing `/signer-rights`, `/about`, `/fee-calculator`, solution pages
458. No `alternate` canonical for mobile vs desktop
459. Missing `article:published_time` OG tags for content_posts
460. No `og:image` fallback image configured globally
461. `NotFound.tsx` returns 200 status — should signal 404 to crawlers via meta
462. No page-level `description` meta for any admin page (SEO irrelevant but good practice)
463. Service detail pages use DB id in URL not SEO slug
464. No auto-generated `meta description` from first 160 chars of content_posts body
465. No FAQ schema on individual service detail pages despite FAQ data existing
466. No `Review` schema markup on testimonials section
467. Missing `WebSite` schema with `SearchAction` for sitelinks
468. No dynamic OG image generation per service/page
469. Blog route `/blog` not registered in `App.tsx`
470. No AMP version of landing page for mobile search priority
471. No `last-modified` header or `lastmod` in sitemap entries
472. No internal linking strategy between service pages and blog content
473. Solution pages (`ForHospitals`, etc.) lack industry-specific schema markup
474. No video schema for RON session explanation content
475. Missing `GeoCoordinates` in LocalBusiness schema

**Implementation:** Create `src/lib/seoSchemas.ts` with reusable schema generators. Update `usePageMeta` hook to accept schema objects. Add dynamic sitemap generation via edge function. Register `/blog` and `/blog/:slug` routes.

---

### Category B Expansion: Console Errors & Warnings (Items 476-496)

476. `supabase.auth.onAuthStateChange` listener not cleaned up in some components
477. React Query devtools may log warnings in production build
478. `motion.div` exit animations fire after unmount causing React warnings
479. Missing `displayName` on `forwardRef` components (`AdminDocuments`)
480. `useEffect` dependency arrays missing variables in portal tabs
481. `Date` constructor with date-only string (`"2024-01-01"`) varies by timezone
482. `parseInt` without radix in time formatting functions across admin pages
483. Unhandled promise rejections in `fetchData` calls without `.catch()`
484. `any` type used extensively — over 200 instances suppress TypeScript safety
485. `localStorage` access without try/catch (throws in private browsing)
486. `window.location.href` assignment in auth flow triggers full page reload warnings
487. `QRCodeSVG` rendered with dynamic props may cause re-render storms
488. `ReactMarkdown` in chat renders unsanitized HTML — XSS vector
489. `Recharts` tooltip components not memoized — expensive re-renders
490. Missing error boundaries around individual admin page components
491. `Framer Motion` layout animations on list items without `layoutId`
492. Console warning: `Select` component receives empty string as value
493. `useCallback` dependencies stale in `AdminOverview.fetchData`
494. Edge function URL constructed without validation
495. `scrollIntoView` called on null ref in chat auto-scroll
496. Memory leak: realtime channel subscriptions not unsubscribed on unmount in portal

**Implementation:** Add `.catch()` to all promise chains. Replace `any` with typed interfaces for top 50 occurrences. Wrap `localStorage` access. Add `displayName` to forwardRef components. Fix dependency arrays.

---

### Category C Expansion: Auth & Security (Items 497-518)

497. No brute-force protection on login endpoint (server-side)
498. Password reset token has no server-side expiry validation display
499. No "sign out all devices" button in AccountSettings
500. Auth tokens stored in localStorage — vulnerable to XSS (consider httpOnly cookies)
501. No security headers in edge function responses (X-Content-Type-Options, X-Frame-Options)
502. No CSP (Content Security Policy) header
503. Admin route `/admin/users` allows notary role — should be admin-only
504. No audit log entry for password changes
505. No audit log entry for email changes
506. No session fingerprinting (user-agent + IP combo)
507. SignUp form allows disposable email domains
508. No email domain validation (MX record check)
509. `ProtectedRoute` doesn't check if user email is verified for sensitive operations
510. No re-authentication required before changing email/password
511. OAuth state parameter not validated in Google Calendar callback
512. Edge functions don't validate `Authorization` header format
513. No API key rotation mechanism for edge function secrets
514. `admin-create-user` edge function doesn't enforce password complexity
515. No login history page for users to review
516. Supabase anon key exposed in client — normal but RLS must be bulletproof
517. No rate limiting on `forgot-password` endpoint
518. Chat messages not sanitized before rendering (ReactMarkdown XSS)

**Implementation:** Add `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` to all edge function CORS headers. Create `src/lib/security.ts` with email validation, input sanitization. Add audit log entries for auth events. Add admin-only guard to AdminUsers route.

---

### Category D Expansion: Booking Flow (Items 519-540)

519. No time zone selector — assumes EST for all clients
520. Booking doesn't show notary's bio/photo for assigned notary
521. No "express" booking option for returning clients (skip intake)
522. Guest checkout creates account without explaining this clearly
523. No document count validation — allows 0 documents
524. Booking step transitions have no animation/transition
525. No "book for someone else" option (legal representative booking)
526. No corporate PO number field for business bookings
527. No group booking discount logic
528. No intake form for specific service types (loan signing has unique fields)
529. Booking doesn't validate service availability (some services may be paused)
530. No "preferred notary" selection for returning clients
531. Calendar picker allows selecting past dates
532. No holiday blackout dates support
533. Booking flow doesn't persist across login/logout
534. No email validation on guest booking (typo detection)
535. No phone validation (US format enforcement)
536. Service type dropdown doesn't show service description
537. No "Why do we need this?" help tooltips on form fields
538. Emergency/ASAP booking option not available
539. No booking modification window enforcement (e.g., no changes within 2 hours)
540. Booking confirmation email template not customizable per service type

**Implementation:** Add timezone picker using `Intl.supportedValuesOf('timeZone')`. Add past-date validation. Add holiday blackout dates from `platform_settings`. Add service-specific intake fields. Add "book for someone else" checkbox with representative name/relationship fields.

---

### Category E Expansion: Client Portal (Items 541-562)

541. No client onboarding checklist (profile completion, ID upload, payment method)
542. No appointment preparation reminder banner (24hr before)
543. No document annotation/commenting capability
544. No portal notification preferences (email vs. in-app)
545. No file rename capability after upload
546. Portal doesn't show estimated wait time for pending appointments
547. No appointment feedback after completion (star rating)
548. No document sharing between portal users (e.g., spouse)
549. No portal session timeout warning specific to document upload
550. Chat doesn't support image/file sharing from client side
551. No payment plan view for split payments
552. No referral code display/share in portal
553. Portal overview doesn't show "time until next appointment" countdown
554. No quick-action buttons on overview (Upload Doc, Book Appointment, Message)
555. No portal deep-link support (sharing specific tab URL)
556. Tab state not persisted in URL search params when switching
557. No accessibility: screen reader doesn't announce tab changes
558. No portal dark mode specific color adjustments for badges
559. Document expiration warning exists but no re-upload CTA
560. No signed document download section separate from uploaded documents
561. No portal usage analytics for admin to see engagement
562. Chat scroll-to-bottom button missing when scrolled up

**Implementation:** Add onboarding checklist component checking profile completeness, ID upload status, first appointment. Add tab state to URL search params. Add countdown timer for next appointment. Add quick-action cards to overview.

---

### Category F Expansion: Business Portal (Items 563-584)

563. No role-based permissions within business (viewer/editor/admin)
564. No business billing dashboard (invoices, statements)
565. No volume discount display based on monthly usage
566. No department/division support for large organizations
567. No custom branding (logo on documents) for business tier
568. No SSO/SAML integration for enterprise accounts
569. No usage quotas or plan limit display
570. No automated monthly usage reports emailed to business admin
571. No document retention policy settings per business
572. No shared document library across business members
573. No approval chain for document submissions
574. Business registration doesn't validate state of incorporation
575. No webhook/API integration for business systems
576. No white-label portal option
577. Team member list doesn't show last login date
578. No business-specific service pricing (contract rates)
579. No multi-currency support for international businesses
580. No batch appointment booking for multiple signers
581. No business compliance dashboard (notarizations per quarter, etc.)
582. No audit trail export for business compliance officers
583. No business portal mobile app prompts
584. No account manager/dedicated contact assignment

**Implementation:** Add `business_roles` table with `viewer/editor/admin` roles. Add approval workflow table `document_approvals`. Add business billing dashboard component. Add usage tracking queries aggregating appointments/documents per business.

---

### Category G Expansion: RON Session (Items 585-606)

585. No credential analysis log table (`ron_credential_analysis`)
586. No signer location attestation (IP geolocation + state confirmation)
587. No audio-only fallback if video fails during session
588. No session bandwidth quality indicator
589. No co-signer simultaneous session support
590. No document page-by-page walkthrough mode
591. No session pause/resume with audit logging
592. No oath administration audio recording
593. No signing order enforcement for multi-document sessions
594. No document comparison (before/after notarization) view
595. No session timeout warning at configurable intervals
596. No credential expiration check during session (ID expired mid-flow)
597. No session transcript generation from recording
598. No e-seal revocation checking before application
599. No foreign language interpreter joining capability
600. No session handoff (notary swap) for emergencies
601. No session quality feedback from signer after completion
602. No automated notary certificate attachment to signed documents
603. No session cost display before and during session
604. No "I do not understand" button for signer rights during oath
605. No session cancellation mid-flow with proper audit logging
606. No re-identification requirement for sessions exceeding 30 minutes

**Implementation:** Create `ron_credential_analysis` table with RLS. Add signer location attestation step using IP geolocation API. Add session quality metrics tracking. Add session pause/resume state management with audit log entries. Create `ron_sessions` table if not exists.

---

### Category H Expansion: Admin Dashboard (Items 607-628)

607. No admin notifications for new client signups
608. No "requires attention" filtered view across all entities
609. AdminOverview stat cards not clickable (should deep-link to filtered views)
610. No weekly/monthly report auto-generation
611. No admin-to-admin internal notes system
612. No appointment drag-and-drop rescheduling on calendar view
613. No keyboard navigation in admin tables
614. Admin pages don't remember filter/sort preferences
615. No admin page tour/onboarding for new team members
616. No bulk email send from client list
617. No admin bookmark/favorites for frequently accessed records
618. AdminClients has no "merge duplicate" capability
619. AdminDocuments has no "assign to appointment" quick action
620. No system health dashboard (edge function status, DB connection)
621. No admin mobile-optimized views (sidebar doesn't collapse properly)
622. Admin session doesn't have its own timeout separate from client
623. No admin changelog/release notes display
624. No print-friendly views for admin reports
625. AdminAppointments calendar view doesn't color-code by status
626. No admin quick-create keyboard shortcut (Ctrl+N)
627. No admin "recent items" sidebar section
628. No admin search across all entities (global admin search)

**Implementation:** Make stat cards in AdminOverview into `<Link>` components with query params for filtering. Add `useLocalStorage` hook for persisting filter preferences. Add global admin search to CommandPalette. Add color-coding to calendar cells based on appointment status.

---

### Category I Expansion: Edge Functions & API (Items 629-650)

629. No edge function health monitoring dashboard
630. No request/response logging for debugging
631. No edge function versioning or rollback capability
632. `build-analyst` rate limiter Map never cleaned up (memory leak on long-running instance)
633. No webhook signature verification on `signnow-webhook`
634. No idempotency keys on payment operations
635. No circuit breaker pattern for external API calls (Google, Stripe, IONOS)
636. No retry with exponential backoff on transient failures
637. No edge function timeout handling (Deno default is 150s)
638. No request validation middleware shared across functions
639. No structured error response format (should use RFC 7807)
640. No API documentation (OpenAPI/Swagger) for edge functions
641. No edge function integration test suite beyond manual testing
642. `ionos-email-sync` doesn't handle IMAP connection pool exhaustion
643. No content-length limit on request bodies
644. No CORS origin allowlist (currently `*` on all functions)
645. No API versioning scheme
646. No edge function warm-up/keep-alive for latency-sensitive operations
647. No dead letter queue for failed async operations
648. No edge function dependency auditing (Deno imports)
649. `extract-email-leads` has no duplicate detection
650. No edge function execution time tracking/metrics

**Implementation:** Create shared `_shared/middleware.ts` with CORS (origin allowlist), rate limiting, request validation, error formatting. Add Zod schemas to all edge function request bodies. Add structured error responses with error codes.

---

## 200 NEW RECOMMENDATIONS (Items 651-850)

### S. Admin Portal Deep Enhancements (651-710)

651. **Admin Quick Actions Bar** — Add a persistent action bar at top of AdminOverview with one-click buttons: New Appointment, New Client, New Journal Entry, Quick Invoice. Each opens a pre-filled dialog.
652. **Admin KPI Scorecard** — Replace simple stat cards with trend-aware KPIs showing week-over-week change arrows and percentage deltas.
653. **Admin Revenue Goal Tracker** — Add monthly/quarterly revenue targets in settings. Show progress bar on overview with current vs goal.
654. **Admin Appointment Heatmap** — Add a heatmap visualization showing busiest days/times across all historical appointments using Recharts.
655. **Admin Client Lifetime Value** — Calculate and display CLV per client (total fees paid, number of appointments, average fee). Show on client detail view.
656. **Admin Automated Follow-up Queue** — Auto-generate follow-up tasks for: incomplete appointments, pending documents > 7 days, leads without contact > 3 days.
657. **Admin Document Review Queue** — Separate queue view for documents with status `pending_review`, with approve/reject actions and inline preview.
658. **Admin Real-time Activity Feed** — Replace polling-based activity with Supabase realtime subscription on `audit_log` table.
659. **Admin Notification Preferences** — Let admins configure which events trigger notifications (new appointment, new lead, document uploaded, payment received).
660. **Admin Two-Panel Layout for Appointments** — Split view: list on left, detail on right. Clicking appointment shows full details without dialog.
661. **Admin Appointment Timeline View** — Horizontal timeline showing appointment lifecycle (created -> confirmed -> in_session -> completed) with timestamps.
662. **Admin Client Communication Hub** — Unified view per client showing all emails, chat messages, documents, appointments, and payments in chronological order.
663. **Admin Daily Planner View** — Day-by-day view showing appointments, tasks, and follow-ups for the current day.
664. **Admin Journal Auto-Complete** — When creating journal entry from appointment, auto-fill all fields: client name, date, service type, document type, fee.
665. **Admin Journal PDF Export** — Generate a paginated PDF of journal entries for a date range, formatted per Ohio SOS requirements.
666. **Admin Revenue Dashboard Enhancements** — Add: revenue by service type chart, revenue by month comparison (this year vs last), average fee per appointment, payment method breakdown.
667. **Admin Lead Scoring Algorithm** — Auto-score leads based on: service type (high-value = higher score), response time, email domain (business vs personal), number of documents.
668. **Admin Lead Auto-Assignment** — Automatically assign new leads to team members round-robin based on workload.
669. **Admin Email Campaign Manager** — Create and schedule bulk email campaigns from admin. Use `process-email-queue` with template rendering.
670. **Admin Client Segmentation** — Tag clients by segment (individual, business, law firm, hospital) and filter/analyze by segment.
671. **Admin Appointment Conflict Detector** — Before confirming, check for overlapping appointments considering service duration estimates.
672. **Admin Service Duration Tracking** — Log actual session duration vs estimated. Show accuracy metrics.
673. **Admin Document Expiry Dashboard** — Central view of all client IDs approaching expiry with notification triggers.
674. **Admin Compliance Scorecard** — Single-page compliance health check: journal completion rate, KBA pass rate, recording consent rate, commission status.
675. **Admin Team Performance Dashboard** — Per-notary metrics: appointments completed, average rating, revenue generated, journal compliance rate.
676. **Admin Customizable Sidebar** — Let admins reorder, hide, or favorite sidebar menu items. Persist to `platform_settings`.
677. **Admin Bulk Actions Toolbar** — When multi-selecting rows in any admin table, show floating toolbar with context-specific bulk actions.
678. **Admin Saved Filters** — Let admins save frequently used filter combinations with names for quick recall.
679. **Admin Data Export Center** — Centralized export page for all data types (appointments, clients, journal, revenue, leads) in CSV/PDF.
680. **Admin Print Views** — CSS `@media print` styles for appointment details, journal entries, invoices, and client records.
681. **Admin System Status Page** — Show edge function health, database connection status, storage usage, email delivery status.
682. **Admin Onboarding Checklist** — For new admin/notary accounts: complete profile, upload seal, set availability, configure email, test RON session.
683. **Admin Quick Notes** — Sticky notes widget on dashboard for admin to jot reminders. Store in `platform_settings` as JSON.
684. **Admin Calendar Sync Status** — Show last Google Calendar sync time, number of events synced, any sync errors.
685. **Admin Appointment Cost Breakdown** — Show fee breakdown per appointment: base fee, travel fee, after-hours fee, document count multiplier, discounts applied.
686. **Admin Service Analytics** — Per-service metrics: bookings per month, average fee, cancellation rate, FAQ view count.
687. **Admin Client Risk Flags** — Flag clients who: cancelled multiple times, had KBA failures, disputed payments. Show on client card.
688. **Admin Document Batch Processing** — Select multiple documents, apply same status change, add same tag, or send to same appointment.
689. **Admin Correspondence Log** — Track all outbound emails/SMS per client with delivery status.
690. **Admin Availability Templates** — Create weekly availability templates (e.g., "Standard Week", "Holiday Schedule") and apply with one click.
691. **Admin Fee Override Log** — Track when admin manually adjusts fees, with reason and audit trail.
692. **Admin Recurring Appointment Manager** — UI to manage `recurrence_rule` on appointments, showing future occurrences.
693. **Admin Appointment Prep Checklist** — Admin-side checklist per appointment: documents received, ID verified, payment collected, journal entry created.
694. **Admin Lead Import from CSV** — Parse CSV with lead data, map columns, preview, and bulk import to leads table.
695. **Admin Client Export Mailing List** — Export client emails in a format compatible with Mailchimp/SendGrid.
696. **Admin Service Request SLA Tracking** — Track time from submission to first response, first response to completion. Show SLA metrics.
697. **Admin Apostille Shipment Tracking** — Integration with USPS/UPS tracking APIs. Show tracking status inline.
698. **Admin Chat Analytics** — Track: average response time, messages per conversation, resolution rate.
699. **Admin Revenue Projections** — Based on confirmed upcoming appointments, project expected revenue for next 7/30/90 days.
700. **Admin Abandoned Booking Report** — Show booking_drafts that were never completed, with contact info for follow-up.
701. **Admin Client Retention Report** — Track repeat client rate, churn indicators, time between appointments.
702. **Admin Email Bounce Handler** — Track bounced emails, flag invalid email addresses on client profiles.
703. **Admin Notary Workload Balancer** — Visual workload distribution across team with rebalancing suggestions.
704. **Admin Payment Reconciliation** — Match Stripe payments to appointments/invoices with discrepancy detection.
705. **Admin Custom Report Builder** — Drag-and-drop report builder with field selection, date ranges, grouping, and chart types.
706. **Admin Scheduled Tasks Dashboard** — Show all configured cron jobs/scheduled edge functions with last run time and status.
707. **Admin Template Versioning** — Track changes to document templates with version history and rollback.
708. **Admin Client Notes Timeline** — Per-client notes with timestamps, author, and category (general, compliance, payment, service).
709. **Admin RON Session Replay Viewer** — Play back RON session recordings with timeline markers for key events (consent, KBA, signing).
710. **Admin Platform Analytics** — Page views, feature usage, popular services, conversion funnel from landing to booking.

**Implementation approach for 651-710:**
- Database: Add `admin_preferences` JSON column to profiles for sidebar/filter customization. Add `sla_metrics` view joining service_requests with timestamps. Add `client_segments` column to profiles.
- Components: Create `AdminQuickActions.tsx`, `AdminKPICard.tsx`, `AdminComplianceScorecard.tsx`, `AdminDocReviewQueue.tsx` as reusable components.
- Edge functions: Create `admin-daily-report` for automated summaries. Enhance `process-email-queue` with campaign support.
- Each admin page gets: saved filters (localStorage), bulk action toolbar, print stylesheet, two-panel responsive layout.

---

### T. Public-Facing Experience (711-760)

711. **Progressive Web App (PWA)** — Add `manifest.json`, service worker, install banner. Cache landing page, booking flow, and portal login for offline access.
712. **Landing Page A/B Testing** — Test hero CTA copy, button color, and social proof placement. Store variant assignments in cookies.
713. **Animated Statistics Counter** — Show live counts on landing page: "X Documents Notarized", "Y Satisfied Clients" with counting animation.
714. **Service Comparison Table** — Side-by-side comparison of RON vs In-Person vs Mobile notarization on a dedicated page.
715. **Client Testimonial Video Embeds** — Add video testimonial support to TestimonialsSection with YouTube/Vimeo embeds.
716. **Interactive RON Demo** — Step-by-step walkthrough showing what a RON session looks like, with screenshots and animations.
717. **Pricing Calculator Widget** — Embeddable pricing calculator for business websites that links back to booking.
718. **Multi-Step Lead Qualification** — Replace simple contact form with multi-step qualifier asking: service type, urgency, document count, then routing to appropriate booking flow.
719. **Live Chat Widget on Public Pages** — Add floating chat bubble on public pages connecting to `client-assistant` edge function for instant AI answers.
720. **Social Share Buttons** — Add share buttons to service pages, blog posts, and completion pages for social proof.
721. **Customer Story/Case Study Pages** — Dedicated pages for use cases: "How [Law Firm] Saved 20 Hours/Month with RON"
722. **FAQ Search** — Add search functionality to FAQ sections with instant filtering.
723. **Service Area Map** — Interactive Ohio map showing service areas, counties covered, and local notary availability.
724. **Trust Badge Bar** — Horizontal bar below hero showing: Ohio SOS Commissioned, E&O Insured, AAMN Member, BBB Accredited.
725. **Countdown Timer for Promotions** — Configurable countdown timer for limited-time offers on landing page.
726. **Exit-Intent Popup** — Show a discount offer or free consultation CTA when user moves to leave the page.
727. **Resource Download Center** — Gated content (PDFs, checklists) requiring email to download for lead generation.
728. **Webinar/Event Registration** — Page for upcoming educational webinars about notarization. Store registrations in DB.
729. **Notary Blog with Comments** — Public blog from `content_posts` with moderated comments section.
730. **Service Booking Mini-Widget** — Compact booking form embeddable on any page: select service, pick date, enter email.
731. **Client Dashboard Embed for Businesses** — iFrame-able portal view for business clients to embed in their own systems.
732. **Dynamic Pricing Display** — Show "Starting at $X" on service cards with real-time price from `services` table.
733. **Multi-Language Landing Page** — Spanish translation of landing page for Ohio's Hispanic population.
734. **Accessibility Statement Page** — Dedicated page describing WCAG 2.1 AA compliance commitment and accommodations.
735. **Contact Form with Department Routing** — Multi-department contact form: General, Billing, Technical, Legal.
736. **Knowledge Base / Help Center** — Searchable help center with categorized articles pulled from `content_posts`.
737. **Service Status Page** — Public status page showing system uptime, scheduled maintenance, and incident history.
738. **Mobile App Download Banner** — Smart banner detecting mobile browsers and suggesting PWA installation.
739. **Chatbot Personality Customization** — Configure AI chatbot tone/personality in admin settings.
740. **Seasonal Promotions Engine** — Auto-display seasonal banners (tax season, year-end, real estate peak) based on date ranges in settings.
741. **Client Portal Custom URL** — Vanity URL for business clients: `portal.notarydex.com/[business-slug]`.
742. **Document Preparation Guides** — Per-service guide pages: "How to Prepare Your Power of Attorney for Notarization".
743. **Notary Availability Widget** — Show "Next Available: Today at 2:00 PM" on landing page from availability data.
744. **Speed Booking** — One-click rebooking for returning clients based on last appointment parameters.
745. **Appointment Reminder Landing Page** — When client clicks email reminder, land on a page showing appointment details + prep checklist.
746. **Estimated Wait Time Display** — On booking page, show current queue length and estimated processing time.
747. **Social Proof Counter** — "234 notarizations completed this month" badge on landing page.
748. **Mobile-First Booking Redesign** — Rebuild booking as a swipeable card-based flow for mobile users.
749. **Voice Search for Services** — Add speech-to-text search on services page for accessibility.
750. **Cookie-less Analytics** — Privacy-respecting analytics using Plausible or Fathom instead of Google Analytics.
751. **Document Validity Checker** — Public tool: upload a document to check if it's eligible for notarization in Ohio.
752. **Notary Commission Verification Widget** — Public page where clients can verify notary commission via Ohio SOS API.
753. **Client Referral Landing Page** — Dedicated referral page with shareable link, explanation of benefits, and signup form.
754. **Emergency Notarization Request** — Urgent booking path with same-day availability check and priority fee.
755. **Service Area Expansion Waitlist** — Collect emails for areas outside current service range.
756. **After-Hours Booking** — Allow booking after-hours appointments with clear fee disclosure.
757. **Document Translation Service Page** — Dedicated page for translation + notarization bundle service.
758. **Corporate Demo Request** — Dedicated page for enterprise sales with meeting scheduler integration.
759. **RON Technology Requirements Page** — Detailed page listing browser/device requirements for RON sessions.
760. **Client Success Metrics** — Public page showing: "Average session time: 15 minutes", "99% first-attempt completion rate".

**Implementation approach for 711-760:**
- PWA: Create `public/manifest.json`, register service worker in `main.tsx`, add install prompt component.
- Blog: Register `/blog` and `/blog/:slug` routes, create `BlogList.tsx` and `BlogPost.tsx` pages querying `content_posts`.
- Components: `TrustBadgeBar.tsx`, `ServiceComparisonTable.tsx`, `SpeedBooking.tsx`, `EmergencyBooking.tsx`.
- Edge functions: `check-document-validity` using Ohio document rules from `ohioDocumentEligibility.ts`.

---

### U. Data Integrity & Database (761-800)

761. Add composite index on `appointments(client_id, scheduled_date)` for portal queries
762. Add index on `documents(uploaded_by, created_at)` for portal document listing
763. Add index on `leads(status, created_at)` for pipeline queries
764. Add index on `chat_messages(sender_id, created_at)` for chat performance
765. Add index on `payments(client_id, status)` for billing queries
766. Add `updated_at` auto-update trigger on all tables missing it
767. Add `prevent_double_booking` trigger on `appointments` table
768. Add `generate_confirmation_number` trigger for new appointments
769. Add `validate_email` trigger on profiles table
770. Add `enforce_kba_limit` trigger checking `kba_attempts` count
771. Add `crm_log_appointment_status` trigger for CRM activity feed
772. Add `crm_log_payment` trigger for payment activity tracking
773. Create materialized view `client_summary` aggregating appointments, documents, payments per client
774. Add `ron_sessions` table for RON-specific data (recording URL, credential analysis, signer location)
775. Add `witnesses` table (name, address, id_type, appointment_id)
776. Add `document_annotations` table for inline comments on documents
777. Add `notification_queue` table for async notification delivery
778. Add `scheduled_tasks` table tracking cron job executions
779. Add `email_delivery_log` table tracking sent/bounced/opened status
780. Add `client_segments` enum and column on profiles
781. Add `appointment_duration_actual` column to appointments
782. Add `signer_location_state` column to appointments for RON jurisdiction tracking
783. Add `kba_provider_response` JSONB column to appointments for KBA audit trail
784. Add `recording_url` column to appointments for RON session recordings
785. Add `fee_adjustments` table tracking manual fee overrides with reason
786. Add `business_contracts` table for business tier pricing agreements
787. Add foreign key from `payments.appointment_id` to `appointments.id`
788. Add check that `signer_count` >= 1 via validation trigger
789. Add `booking_source` column to appointments (web, phone, business-portal, referral)
790. Add `client_preferred_language` column to profiles
791. Add `document_hash` column to documents for tamper detection
792. Add `session_recording_duration` column to appointments
793. Add `notary_journal_exported_at` column for tracking compliance exports
794. Add `commission_number` and `commission_expiry` to a `notary_profiles` table
795. Add row-level security policy review: verify all tables have appropriate policies
796. Add `pg_cron` job for booking_drafts cleanup (delete drafts older than 30 days)
797. Add `pg_cron` job for session recording retention alerting (10-year per Ohio ORC)
798. Add database function `get_client_lifetime_value(client_id uuid)` returning total fees
799. Add database function `get_notary_workload(notary_id uuid, date_range)` returning appointment count
800. Add partial index on `appointments WHERE status = 'scheduled'` for upcoming queries

**Implementation:** Single large migration with all indexes, triggers, new tables, and functions. Use `IF NOT EXISTS` guards. Attach triggers to existing tables. Create materialized view with refresh schedule.

---

### V. Email & Communication (801-825)

801. **Appointment Confirmation Email** — HTML template with appointment details, prep checklist, and calendar invite attachment
802. **24-Hour Reminder Email** — Automated reminder with session prep tips and tech check link
803. **1-Hour Reminder Email** — Short reminder with direct session join link
804. **Post-Session Thank You Email** — Thank you with review request, referral link, and next-steps
805. **Document Ready Notification** — Email when notarized document is available for download
806. **Payment Receipt Email** — Itemized receipt with service details, fees, and payment method
807. **Refund Confirmation Email** — Email confirming refund amount and expected processing time
808. **Lead Follow-up Drip Sequence** — 5-email sequence: Welcome → Educational → Social Proof → Offer → Last Chance
809. **Abandoned Booking Recovery Email** — "You left something behind" email with deep link to resume booking
810. **Commission Renewal Reminder** — Internal emails at 90/60/30/7 days before notary commission expiry
811. **Client ID Expiry Warning** — Email clients when their uploaded ID is approaching expiration
812. **Business Monthly Statement** — Automated monthly summary email for business accounts
813. **Email Unsubscribe Integration** — Wire `Unsubscribe.tsx` page to update `notification_preferences` table
814. **Email Template Preview/Test** — In-app preview and test-send for all email templates
815. **SMS Integration (Twilio)** — Create `send-sms` edge function for appointment reminders and alerts
816. **Push Notifications** — Service worker-based push for appointment updates, document status changes
817. **In-App Notification Center** — Bell icon in portal header showing unread notifications with mark-as-read
818. **Email Signature Generator** — Admin tool to generate branded email signatures with notary credentials
819. **Automated Weekly Digest** — Weekly email to admin: appointments summary, revenue, pending items, compliance alerts
820. **Client Communication Preferences** — Let clients choose: email only, SMS only, both, or none per category
821. **Email Analytics Dashboard** — Track open rates, click rates, bounce rates per template
822. **Cron Trigger for Reminders** — Configure `pg_cron` or external scheduler to trigger `send-appointment-reminders`
823. **Email Queue Priority** — Add priority levels to email queue (urgent, normal, low) with processing order
824. **Transactional Email Logging** — Log every sent email with content, recipient, status, and timestamps
825. **Multi-Channel Notification Router** — Central function that decides email vs SMS vs push based on client preferences

**Implementation:**
- Edge functions: `send-sms` (Twilio), `daily-admin-summary`, `commission-renewal-check`, `abandoned-booking-recovery`
- Database: `notification_preferences` table updates, `email_delivery_log` table, `notification_queue` table
- Secrets needed: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Frontend: NotificationCenter component in portal header, email analytics charts in admin

---

### W. Payments & Billing (826-850)

826. **Stripe Customer Creation** — Create Stripe Customer object on first payment, store `stripe_customer_id` on profiles
827. **Saved Payment Methods** — Allow clients to save cards via Stripe SetupIntents for faster future payments
828. **Subscription Billing** — Implement subscription plans (SubscriptionPlans.tsx exists) with Stripe recurring billing
829. **Invoice PDF Generation** — Generate professional PDF invoices using the existing `InvoiceGenerator.tsx` component
830. **Partial Payments** — Allow clients to pay a portion with balance due later
831. **Payment Plans** — Split large fees into 2-3 installments with scheduled charges
832. **Late Payment Reminders** — Auto-send payment reminders for unpaid invoices after 7/14/30 days
833. **Tax Calculation** — Add tax rate configuration in settings, calculate and display tax on invoices
834. **Tax-Exempt Handling** — Business clients can upload tax-exempt certificates to waive tax
835. **Coupon/Discount Codes** — Create `discount_codes` table with percentage/fixed discounts, usage limits, expiry
836. **Refund Reason Collection** — Add reason dropdown and notes field when processing refunds
837. **Refund Confirmation Email** — Send email with refund details and expected processing timeline
838. **Financial Reporting** — Monthly P&L, revenue by service type, payment method breakdown, outstanding balances
839. **ACH/Bank Transfer Support** — Add bank account payments via Stripe ACH for business clients
840. **Pro Bono Tracking** — Mark appointments as pro bono with reason, track for tax deduction reporting
841. **Fee Schedule Management** — Admin page to manage base fees per service type with effective dates
842. **Deposit/Retainer System** — Collect deposits at booking, apply to final invoice
843. **Payment Dispute Management** — Track and manage Stripe disputes/chargebacks in admin
844. **Revenue Sharing for Multi-Notary** — Calculate and track revenue splits for team notary assignments
845. **Business Billing Address** — Separate billing address for business accounts
846. **Payment Webhook Signature Verification** — Add `stripe.webhooks.constructEvent` validation
847. **Automatic Payment Retry** — Retry failed payments after 24/48/72 hours
848. **Financial Dashboard Enhancements** — Add: AR aging report, cash flow projection, payment success rate
849. **Tip/Gratuity Support** — Optional tip field on payment form
850. **Gift Certificate System** — Purchase, track, and redeem gift certificates for notary services

**Implementation:**
- Database: `discount_codes`, `payment_plans`, `gift_certificates`, `fee_schedules` tables with RLS
- Edge functions: `create-stripe-customer`, `setup-payment-method`, `process-subscription`, `late-payment-reminder`
- Frontend: Update PaymentForm.tsx with saved cards, discount code field, tip option. Add FinancialReports admin page.
- Stripe: Add webhook signature verification using `STRIPE_WEBHOOK_SECRET`.

---

## IMPLEMENTATION BATCH PLAN

| Batch | Items | Scope | Estimated Size |
|-------|-------|-------|----------------|
| 1 | 761-800 | Database migration (indexes, triggers, tables) | 1 large migration |
| 2 | 451-475 | SEO schemas, sitemap, meta tags | ~15 files |
| 3 | 476-496 | Console error fixes, ref cleanup | ~20 files |
| 4 | 497-518 | Security hardening | ~10 files + edge functions |
| 5 | 519-540 | Booking flow enhancements | BookAppointment + related |
| 6 | 541-562 | Client portal gaps | ClientPortal + portal tabs |
| 7 | 563-584 | Business portal gaps | BusinessPortal + migration |
| 8 | 585-606 | RON session completeness | RonSession + migration |
| 9 | 607-628 | Admin dashboard core | AdminOverview + all admin pages |
| 10 | 629-650 | Edge function hardening | All edge functions |
| 11 | 651-710 | Admin portal deep enhancements | New components + admin pages |
| 12 | 711-760 | Public-facing experience | New pages, PWA, blog |
| 13 | 801-825 | Email & notifications | Edge functions + UI |
| 14 | 826-850 | Payments & billing | PaymentForm, new pages, Stripe |
| 15 | Original 391-450 | Previously planned missing features | Various |

**Google Calendar:** Edge function code exists and is ready. Secrets (`GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN`) will be configured when user provides them.

**Total tracked items:** 850 (450 original + 200 new recommendations + 200 category expansions)

