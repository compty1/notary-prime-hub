

# Plan: Integration Setup Instructions + DocuDex Canva-Style Redesign

## Part 1: Integration Setup Guide in Automated Emails

The Automated Emails hub currently has no documentation about how the email sending pipeline actually works — which secrets are needed, how edge functions connect, and how to verify the setup. Adding a fourth tab with detailed setup instructions for each integration.

### File: `src/pages/admin/AdminAutomatedEmails.tsx`

**Add a 4th tab: "Setup & Integrations"** after Service Templates.

Contents organized as expandable accordion sections:

1. **IONOS SMTP (Primary Email Provider)**
   - Status indicator: check if `IONOS_EMAIL_ADDRESS`, `IONOS_EMAIL_PASSWORD`, `IONOS_SMTP_HOST` secrets exist (show green/red badges)
   - Setup steps: IONOS account, SMTP credentials, sender address configuration
   - How templates connect: `send-appointment-emails`, `send-correspondence`, `send-document-notification`, `send-followup-sequence`, `send-welcome-sequence` all use IONOS SMTP
   - Test button: invoke `send-correspondence` with a dry-run flag

2. **Stripe Payments (Invoicing & Receipts)**
   - Status: check `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - How it connects: `create-payment-intent` → `stripe-webhook` → triggers receipt email
   - Webhook URL display + setup instructions

3. **SignNow (E-Signing)**
   - Status: check `SIGNNOW_API_KEY`, `SIGNNOW_API_TOKEN`, `SIGNNOW_WEBHOOK_SECRET`
   - Connection: `signnow` + `signnow-webhook` edge functions
   - Webhook setup guidance

4. **HubSpot CRM (Lead Sync)**
   - Status: check `HubSpot_Developer_Key`, `HubSpot_Service_Key`
   - Connection: `hubspot-sync` edge function
   - Field mapping documentation

5. **Google Calendar (Scheduling Sync)**
   - Connection: `google-calendar-sync` edge function
   - OAuth setup guidance

6. **OneNotary (Compliance)**
   - Status: check `ONENOTARY_API_TOKEN`
   - Purpose and data flow

7. **Email Delivery Pipeline Overview**
   - Visual flow: Template Hub → Edge Function → IONOS SMTP → Client Inbox
   - Which edge functions handle which email types (mapping table)
   - Retry logic explanation (exponential backoff)
   - How master branding wraps all outgoing emails

Each section shows a live status badge (configured/not configured) by checking secret existence via a health-check approach, and provides copy-pasteable webhook URLs.

### Implementation approach
- Add a new `IntegrationSetupTab` component within the same file
- Use Accordion for each integration section
- Status checks via `supabase.functions.invoke("health-check")` or display based on known secret names
- Add the tab to the main TabsList (4 columns instead of 3)

---

## Part 2: DocuDex Editor — Canva-Style Redesign

The current editor uses raw `contentEditable` divs with `document.execCommand` (deprecated). It feels like a basic text editor, not a Canva-like design tool. Major UX overhaul needed.

### File: `src/components/DocuDexEditor.tsx` (full rewrite)

**Layout changes (Canva-inspired):**

1. **Left Panel (280px)** — Tool panels with icons-only tab bar along the left edge (like Canva's vertical icon strip):
   - Templates (grid of visual template cards with thumbnails)
   - AI Tools (generation, text actions, chat)
   - Elements (tables, callouts, dividers, signature blocks, images)
   - Design (fonts, colors, page size, margins)
   - Translate
   - History (version snapshots with timestamps)

2. **Center Canvas** — The document editing area:
   - Dark/neutral background with centered white page(s)
   - Zoom controls (50%-200%) with a zoom slider in the bottom bar
   - Page dimensions displayed (Letter 8.5×11" default)
   - Floating formatting toolbar that appears on text selection (like Canva's)
   - Page thumbnails strip along the bottom or right for multi-page navigation

3. **Right Panel (collapsible, 300px)** — AI Chat assistant (currently exists but cramped)

4. **Top Bar** — Simplified:
   - Document title (editable, prominent)
   - File menu (Save, Export .DOC, Export PDF, Print)
   - Share button
   - Zoom percentage display

5. **Bottom Status Bar:**
   - Page count, word count, character count, reading time
   - Zoom slider
   - Current page indicator

**Functional improvements:**
- Replace `document.execCommand` with proper state-managed formatting (the toolbar buttons will update page HTML via controlled manipulation)
- Zoom state: CSS `transform: scale()` on the canvas container
- Floating selection toolbar: detect `selectionchange` events, position a toolbar near the selection with Bold/Italic/Underline/Heading/Color/AI actions
- Page thumbnails: render scaled-down versions of each page for quick navigation
- Drag-to-reorder pages via the thumbnail strip
- Better template cards: show a mini preview of each template instead of text-only buttons

### Files affected:
| File | Change |
|---|---|
| `src/pages/admin/AdminAutomatedEmails.tsx` | Add 4th "Setup & Integrations" tab with accordion guide |
| `src/components/DocuDexEditor.tsx` | Full Canva-style redesign with zoom, floating toolbar, vertical sidebar, page thumbnails |

