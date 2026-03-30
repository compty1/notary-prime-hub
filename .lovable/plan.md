

## Plan: AI SaaS Tab, Services Fix, Command Palette, and Remaining Plan Items

### Problem Summary
1. **Services not loading**: The DB has only 14 virtual assistant services but zero core notarization/document services. The Services page shows empty categories for notarization, verification, document_services, authentication, business, recurring, consulting, and business_services.
2. **No "Do It Yourself" AI SaaS tab**: User wants a prominent tab on /services for AI-powered self-service tools (AI Writing, Document Generator, AI-enhanced everything).
3. **No command palette**: Cmd+K navigation not implemented.
4. **Multiple unfinished plan items** from .lovable/plan.md still outstanding.

---

### Implementation Steps

#### Step 1: Seed Core Services into Database
Insert ~25-30 core notary and document services via migration to populate the empty categories:
- **notarization**: Remote Online Notarization, In-Person Notarization, Mobile Notarization, Certified Copy, Witness Services, Oath/Affirmation
- **verification**: ID Verification / KYC Checks, I-9 Employment Verification, Background Check Coordination
- **document_services**: Clerical Document Preparation, Document Cleanup & Formatting, Form Filling Assistance, PDF Services, Document Scanning & Digitization, Document Translation
- **authentication**: Apostille Facilitation, Consular Legalization Prep, Notarized Translation Coordination
- **business**: Business Subscription Plans, API & Integration Services, White-Label Partner Programs
- **recurring**: Document Storage Vault, Virtual Mailroom, Template Library & Form Builder
- **consulting**: RON Onboarding Consulting, Workflow Audit & Automation
- **business_services**: Email Management & Correspondence, Certified Document Prep for Agencies, Registered Agent Coordination

These match the names already referenced in `INTAKE_ONLY_SERVICES`, `SAAS_LINKS`, and `SUBSCRIPTION_SERVICES` sets so the Smart CTA routing works immediately.

#### Step 2: Add "Do It Yourself" AI SaaS Tab on Services Page
Add a new prominent tab at the top of the Services page (above category tabs) with three AI tool cards:

1. **AI Writing Tools** — Generate professional emails, social media posts, and documents. Links to a new `/ai-writer` page.
2. **Document Generator** — Build resumes, invoices, and contracts with templates and PDF export. Links to `/builder`.
3. **Document Digitization** — AI-powered OCR to convert scans to editable text. Links to `/digitize`.

Each card will have an icon, description, "AI-powered" badge, and CTA button. This section appears as a visually distinct hero-style band before the traditional services catalog.

#### Step 3: Create AI Writer Page (`/ai-writer`)
New page with three modes:
- **Email Generator**: Select tone (professional/friendly/formal), purpose, key points → AI generates email via existing `client-assistant` edge function
- **Social Media Post**: Platform selector (LinkedIn/Twitter/Facebook), topic, hashtag suggestions
- **Document Draft**: Type (letter/memo/proposal), context → AI generates draft

Uses the existing `client-assistant` edge function with streaming. Includes copy-to-clipboard, download as .txt, and save-to-portal actions.

#### Step 4: Command Palette (Cmd+K)
Create a `CommandPalette.tsx` component using the existing `cmdk` + `Command` UI component:
- Triggered by Cmd+K (Mac) or Ctrl+K (Windows)
- Searches all public routes + admin routes (filtered by role)
- Quick actions: Book Appointment, View Portal, AI Writer, Digitize Document
- Integrated into `App.tsx` globally
- Shows recent pages and fuzzy search

#### Step 5: Fix Payment Integration (create-payment-intent)
The edge function uses `supabase.auth.getClaims()` which doesn't exist in Supabase JS v2. Replace with `supabase.auth.getUser()`. Stripe keys are now available in secrets.

#### Step 6: Remaining High-Impact Plan Items
- **Index.tsx hero image**: The `import heroImage from "@/assets/hero-notary.jpg"` will 404 if missing. Add a fallback gradient/SVG.
- **Stripe webhook signature verification**: Add `Stripe.webhooks.constructEvent()` validation in `stripe-webhook/index.ts`.
- **Admin command palette integration**: Include admin-specific shortcuts (new appointment, view journal, etc.).

---

### Technical Details

**Files to create:**
- `src/pages/AIWriter.tsx` — AI writing tools page with email/social/document modes
- `src/components/CommandPalette.tsx` — Global Cmd+K navigation component

**Files to modify:**
- `src/pages/Services.tsx` — Add "Do It Yourself" AI tools section above categories
- `src/App.tsx` — Add `/ai-writer` route, integrate CommandPalette globally
- `src/components/Navbar.tsx` — Add "AI Tools" nav link
- `supabase/functions/create-payment-intent/index.ts` — Fix getClaims() → getUser()
- `src/pages/Index.tsx` — Add fallback for missing hero image

**Database migration:**
- Insert ~28 core services with proper categories, pricing, icons, and display_order values

**No new edge functions needed** — AI Writer reuses `client-assistant` function.

