

# Plan: Admin & Settings Recommendation Audit CSV

Generate a comprehensive CSV audit file covering all admin pages, account settings, controls wiring, gaps, bugs, and recommendations across the entire admin panel and settings infrastructure.

## Scope of Audit

The CSV will cover these domains with up to 1000 items:

1. **Route Security & Access Control** — adminOnly flags, ProtectedRoute wiring, missing guards
2. **Admin Settings Page** — platform_settings controls, validation, missing fields, Ohio compliance checks
3. **Account Settings** — password change, data export, delete account, notification prefs, MFA
4. **Admin Overview/Dashboard** — stats accuracy, chart wiring, calendar integration, commission alerts
5. **User Management** — role toggling, self-demotion guard, pagination, search
6. **Team & Invites** — notary onboarding, certifications, avatar handling
7. **Audit Log** — filter coverage, export, entity linking, retention
8. **Admin Sidebar Navigation** — item ordering, role visibility, missing links
9. **All 33 Admin Sub-pages** — controls wiring, data fetching patterns, error handling
10. **Cross-cutting Concerns** — loading states, empty states, responsive layout, dark mode, a11y

## CSV Structure

Columns: `ID, Category, Page/Component, Severity, Type, Title, Current State, Recommended Fix, Wiring Notes, Ohio Compliance`

## Implementation

Single script execution to generate `/mnt/documents/admin_settings_audit.csv` with all findings organized by category and severity (Critical → Low).

## Key Areas of Focus

- **Security gaps**: Routes without `adminOnly` that should have it (e.g., `/admin/docudex-pro` accessible to notaries), delete account cascade missing some tables
- **Settings controls**: Missing validation for URLs, missing TOTP/MFA enablement, no settings backup/restore
- **Wiring issues**: Admin sidebar nav items vs actual route guards mismatch, HubSpot buttons lacking loading states
- **Missing admin features**: No bulk user operations, no settings change history, no admin activity dashboard
- **Ohio compliance**: Commission/bond/E&O expiration alerts not triggering emails, no Secretary of State verification link

