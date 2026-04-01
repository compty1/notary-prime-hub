
# Comprehensive Gap Resolution & CRM Build Plan

## Overview
Addresses all identified gaps across security, compliance, UX, CRM, booking, accessibility, SEO, and email systems.

---

## Phase 1: Native CRM System ✅ IN PROGRESS

### 1.1 Admin CRM Dashboard (`/admin/crm`) ✅ IMPLEMENTED
- Full CRM hub with tabs: Pipeline, Contacts, Deals, Activities, Reports
- Lead Kanban board across 7 stages (new → closed-won/lost)
- Contacts table with search, inline status editing
- Deals pipeline with Kanban view and stage management
- Activity timeline with logging (notes, calls, emails, meetings)
- Reports: lead sources, conversion funnel, deal pipeline summary, recent appointments
- KPI cards: total leads, open deals, pipeline value, won revenue

### 1.2 Database Tables ✅ IMPLEMENTED
- `deals` table with stage tracking, value, HubSpot sync
- `crm_activities` table for interaction logging
- RLS: admin-only management, notary view for assigned items

### 1.3 CRM Integration Points — TODO
- Auto-create CRM activity on appointment/email/payment events
- HubSpot deal bidirectional sync

---

## Phase 2: RON Session Notary Guide & Task Queue — TODO
- Session-specific notary guide panel with contextual instructions
- Document-type-aware oath scripts and checklists
- Multi-signer coordination steps
- RON pre-session task queue

## Phase 3: Booking System Fixes — TODO
- Route aliases (/booking, /schedule → /book)
- Ghost CTA fix (replace # hrefs)
- Google Calendar integration
- Draft/resume workflow wiring

## Phase 4: Security & Compliance Hardening — TODO
- IDOR prevention, E-Sign consent, file upload security
- Session timeout, rate limiting, commission expiry enforcement

## Phase 5: Ohio-Specific Compliance — TODO
- Document eligibility logic
- Jurisdictional validation
- Witness coordination workflow
- Statutory technology disclosure

## Phase 6: Accessibility (WCAG 2.1 AA) — TODO
- Focus management, keyboard navigation, color/contrast, screen reader support

## Phase 7: SEO & Performance — TODO
- Unique page titles/meta, breadcrumb schema, srcset images, LCP preload

## Phase 8: Email System Enhancements — TODO
- Visual email template designer with live preview
- Email sync error handling improvements

## Phase 9: SignNow Webhook Enhancements — TODO
- check_webhooks action
- Webhook status indicator in admin RON view

## Phase 10: UX & Navigation Fixes — TODO
- Dead-end elimination, mobile nav, breadcrumbs

## Phase 11: Hardware & Pre-Session Checks — TODO
- Browser version check, WebRTC NAT traversal test

## Phase 12: Remaining Items — TODO
- Age verification, multi-signer pre-config, feedback loop, click-wrap, PWA

---

## Previously Completed ✅
- Email-to-lead pipeline with AI extraction
- HubSpot CRM sync (push/pull/test)
- Lead Portal with real-time, pagination, bulk actions
- Document tagging system
- Inline form validation in booking
- File upload previews
- AI services suite (compliance scan, style match, cross-document, extractors)
- Security headers (CSP, X-Frame-Options, etc.)
- Error boundaries, skip navigation, branded 404
- Dark mode, command palette, legal glossary

## Runtime Error Fixes ✅
- Fixed Select.Item empty string value errors in AdminServiceRequests and AdminDocuments
