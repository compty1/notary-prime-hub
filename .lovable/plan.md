

# Plan: Comprehensive Integration Management Hub

## Overview

Replace the current "Integration Testing" page with a full **Integration Management** dashboard. It will show every active integration as a card with live status, editable settings, test buttons, real-time diagnostics, and troubleshooting guidance — all in one place.

---

## Current State

- **AdminIntegrationTest.tsx** — Has 3 tabs: Connection Tests (6 test cards), Webhooks (SignNow), Process Flows. Tests work but show no settings, no troubleshooting, and no integration overview.
- **AdminSettings.tsx** — Has a "Platform Integration" section with SignNow status, webhook URL, KBA config. Settings are scattered.

## What Changes

### New Tab: "Integrations Overview" (default tab)

A grid of integration cards — one per service. Each card shows:

| Integration | Secret(s) Used | What It Does |
|---|---|---|
| **Database** | (built-in) | Core data storage |
| **File Storage** | (built-in) | Document bucket |
| **SignNow** | SIGNNOW_API_TOKEN, SIGNNOW_WEBHOOK_SECRET | E-signing, KBA, webhooks |
| **Stripe** | STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY | Payments |
| **IONOS Email** | IONOS_EMAIL_ADDRESS, IONOS_EMAIL_PASSWORD, IONOS_IMAP_HOST, IONOS_SMTP_HOST | IMAP/SMTP email |
| **OneNotary** | ONENOTARY_API_TOKEN | Notary platform API |

Each card includes:
1. **Status indicator** — Green/yellow/red dot based on last test result (cached in component state)
2. **"Test" button** — Runs the connectivity check, shows response time and result inline
3. **"Settings" expandable section** — Shows relevant editable fields (e.g., webhook URL for SignNow, KBA provider, IONOS host/email). Save updates to `platform_settings`.
4. **"Troubleshoot" button** — When test fails, shows real-time diagnostic panel:
   - Error message with explanation
   - Specific fix instructions (e.g., "Token expired — re-enter SIGNNOW_API_TOKEN in Lovable Cloud secrets")
   - Link to relevant docs/settings
   - "Re-test" button

### Enhanced existing tabs

- **Connection Tests tab** — Keep as-is but add a "Run All + Report" that generates a summary card at top showing pass/fail counts
- **Webhooks tab** — Keep as-is
- **Process Flows tab** — Keep as-is

---

## File Changes

| File | Changes |
|---|---|
| `src/pages/admin/AdminIntegrationTest.tsx` | Add "Integrations" tab as default. Build `IntegrationCard` component inline with status, settings panel, test, and troubleshoot sections. Define integration configs array with test functions, settings fields, and troubleshooting maps. |

## Technical Details

- **Integration config array**: Each entry defines `id`, `name`, `icon`, `description`, `secrets` (list of secret names — display as masked), `testFn` (async function returning StepResult), `settings` (array of field configs that read/write `platform_settings`), and `troubleshootMap` (error pattern → fix instruction).
- **Settings editing**: Uses existing `platform_settings` table pattern from AdminSettings — fetch on mount, save on button click via `supabase.from("platform_settings").upsert()`.
- **Troubleshooting diagnostics**: When a test fails, parse the error message against known patterns (e.g., "401" → "API token expired or invalid", "ECONNREFUSED" → "Service unreachable", "Missing publishable key" → "Stripe not configured"). Display fix steps in an alert box below the test result.
- **Real-time analysis**: Each test shows response time, HTTP status, and parsed error details. For IONOS, test both IMAP connectivity (via ionos-email-sync dry run) and SMTP (via ionos-email dry run).
- **No new database tables or migrations needed** — all state is component-local or uses existing `platform_settings`.

