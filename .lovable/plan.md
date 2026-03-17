

# Comprehensive Platform Enhancement Plan

This request covers 8+ distinct feature areas. Given the scope, here is a prioritized implementation plan broken into manageable phases.

---

## Phase 1: Template Library Enhancement

**Current state**: 6 hardcoded templates with a generic legal disclaimer.

**Changes**:
- Add 6-8 more templates: Power of Attorney (General/Healthcare), Loan Signing Acknowledgment, Deed of Trust Acknowledgment, I-9 Employment Verification Statement, Vehicle Bill of Sale (Ohio BMV-specific), Name Change Affidavit, Guardianship Consent
- Add a prominent disclaimer section at the top of `DocumentTemplates.tsx` explaining:
  - What users CAN legally use these for (general informational starting points, standard notarial certificates, common personal/business documents)
  - What MAY need attorney review or specific adaptation (estate planning docs, real property transfers, court filings)
  - Reminder to check with local county officials or the receiving entity
- Add a "View All Services" quick-link banner and cross-promotion of professional document prep services

---

## Phase 2: RON Eligibility Checker Tool

**New page**: `src/pages/RonEligibilityChecker.tsx` (route: `/ron-check`)

Interactive tool where users select:
1. **State** where the document will be used (all 50 states dropdown)
2. **Document type** (real estate, power of attorney, will, affidavit, business contract, court filing, etc.)
3. **Entity/recipient** that needs the notarized document (county recorder, bank/lender, court, government agency, employer, private party)
4. **Purpose/reason** (real estate closing, estate planning, legal filing, personal use, business transaction)

Based on selections, display a result:
- Green: "RON is widely accepted for this use case" with details
- Yellow: "RON may be accepted — verify with the receiving entity" with guidance
- Red: "This entity/situation may require in-person notarization" with explanation

Include accurate data about Ohio RON acceptance rules based on ORC §147.65-.66, Full Faith & Credit Clause, and known entity-specific restrictions. Add a CTA to book a RON session or contact for clarification.

Also mention other business/document services and include a quick link to `/services`.

---

## Phase 3: Loan Signing Services Page

**New page**: `src/pages/LoanSigningServices.tsx` (route: `/loan-signing`)

Dedicated landing page for title companies, lenders, and signing services seeking loan signing agent partnerships:
- Overview of loan signing capabilities (certified NSA, RON-capable, E&O insured)
- Partnership inquiry form collecting: company name, contact name, email, phone, volume estimate, signing types needed, preferred contact method
- Form submits to `leads` table with `source: 'loan_signing_inquiry'` and `lead_type: 'business'`
- Business hours displayed: Mon/Tue/Wed 10 AM – 7 PM
- Response commitment: business calls returned within 24 hrs, client support typically within 2 hrs
- Add corresponding RLS policy for anonymous insert with `source = 'loan_signing_inquiry'`

---

## Phase 4: Individual Service Detail Pages

**Current state**: Services page links each service to `/book`. No individual service info pages.

**Changes**:
- Create `src/pages/ServiceDetail.tsx` (route: `/services/:serviceId`)
- Fetches service data, requirements, and workflows from DB using the service ID
- Displays: full description, requirements checklist, workflow steps, pricing, Ohio statute references, related services
- "Book This Service" and "Contact Us" CTAs
- Update Services page cards to include a "More Info" button linking to `/services/{id}`
- Keep the existing "Get Started" button for direct booking

---

## Phase 5: Services Page Title Fix & KBA Placeholder

**Services page**: Change hero title from "Our Services" to "Services"

**KBA placeholder**: 
- Add a section on the BlueNotarySession page and RonInfo page noting that KBA is required under Ohio law (ORC §147.66) for RON
- Add a placeholder KBA service reference noting accepted providers (e.g., IDology, which is widely used and accepted in Ohio)
- This is a placeholder — actual KBA integration would require a third-party provider API

---

## Phase 6: Admin Content Management & Email Configuration

**Current state**: Admin can edit platform settings but not page content directly. AdminEmailManagement manages correspondence but not automated confirmation templates.

**Changes**:
- In `AdminSettings.tsx`, add a section for managing email notification templates (confirmation, reminder, follow-up) stored in `platform_settings` as keys like `email_template_confirmation`, `email_template_reminder`
- Ensure the `send-appointment-emails` edge function reads these templates from `platform_settings`
- Add admin ability to set business hours display text (stored as `business_hours` in platform_settings)

---

## Phase 7: SEO Content & Professional Authority

**Changes to `index.html`**:
- Add proper title, meta description, Open Graph tags for social sharing
- Add structured data (JSON-LD) for LocalBusiness schema

**Content additions across pages**:
- Add an "Industry Insights" or "Resources" section on the homepage with 3-4 informational blurbs:
  - "Why Remote Notarization is Growing 300% Year-Over-Year"
  - "Understanding Ohio's Electronic Notarization Standards"  
  - "What Title Companies Should Know About RON Closings"
  - "Common Notarization Mistakes and How to Avoid Them"
- These are static content blocks that establish expertise and improve SEO keyword density
- Add industry context mentions throughout (MISMO standards, ALTA best practices, MISMO RON standards compliance)

---

## Phase 8: Link Audit & Functional Verification

- Audit all `Link` and `<a>` tags across pages to ensure correct routing
- Ensure `/verify/:id` works (currently uses VerifySeal with proper DB query)
- Verify `/builder` route exists and DocumentBuilder is functional
- Ensure all nav links on all pages are consistent and working
- Fix any external links that may be broken or placeholder

---

## New Routes Summary

| Route | Component | Purpose |
|-------|-----------|---------|
| `/ron-check` | RonEligibilityChecker | RON acceptance checker tool |
| `/loan-signing` | LoanSigningServices | B2B loan signing partnership page |
| `/services/:serviceId` | ServiceDetail | Individual service info pages |

## Database Changes

- New RLS policy on `leads` for `loan_signing_inquiry` source (anonymous insert)
- New `platform_settings` keys: `email_template_confirmation`, `email_template_reminder`, `business_hours`

## Files to Create
- `src/pages/RonEligibilityChecker.tsx`
- `src/pages/LoanSigningServices.tsx`
- `src/pages/ServiceDetail.tsx`

## Files to Modify
- `src/App.tsx` — add 3 new routes
- `src/pages/DocumentTemplates.tsx` — add templates, disclaimer, cross-links
- `src/pages/Services.tsx` — title change, "More Info" buttons per service
- `src/pages/RonInfo.tsx` — KBA provider info, link to RON checker
- `src/pages/BlueNotarySession.tsx` — KBA placeholder note
- `src/pages/Index.tsx` — SEO content blurbs, business hours, cross-links
- `src/pages/admin/AdminSettings.tsx` — email template management section
- `index.html` — SEO meta tags, Open Graph, JSON-LD structured data
- `supabase migration` — RLS policy for loan signing inquiry inserts

