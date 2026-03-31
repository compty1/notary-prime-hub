

# Plan: Hospital Solutions Page + Comprehensive Solution Pages + Button Audit

## Summary
Create 5 new comprehensive solution pages (Hospitals, Real Estate, Law Firms, Small Business, Individuals), add "For Hospitals" to the Navbar solutions dropdown, register all routes in App.tsx, and fix the runtime error caused by the JSON-LD script tag in Index.tsx.

---

## Part 1: New Hospital Solutions Page

**File:** `src/pages/solutions/ForHospitals.tsx`

Full-featured page following the ForNotaries pattern with 4 sections:
- **Hero:** Badge "For Healthcare Facilities", headline about bedside notarization, CTAs to `/book` and `/services`
- **Features (6 cards):** Bedside & ICU Notarization, HIPAA-Aware Process, Power of Attorney & Healthcare Directives, Urgent/After-Hours Availability, Credential Verification, Digital Document Delivery
- **Use Cases section:** Patient admission docs, advance directives, living wills, healthcare POA, organ donor docs, insurance/billing authorizations, guardianship papers, discharge/transfer docs
- **Compliance section:** Ohio ORC §147 notary standards, HIPAA privacy considerations, patient capacity assessment acknowledgment, witness requirements for healthcare docs, facility coordination protocol
- **CTA:** Book bedside notarization or call directly

---

## Part 2: Flesh Out Remaining Solution Pages

Create comprehensive pages replacing ComingSoon for each vertical:

### `src/pages/solutions/ForRealEstate.tsx`
- Hero: Real estate closings & title services
- Features: Closing Documents, Deed Transfers, Mortgage/Refinance, Title Affidavits, RON for Remote Closings, Bulk Signing Packages
- Compliance: Ohio deed requirements, recording standards
- CTAs: `/book`, `/loan-signing`, `/services?category=notarization`

### `src/pages/solutions/ForLawFirms.tsx`
- Hero: Legal document notarization at scale
- Features: Affidavits & Depositions, Power of Attorney, Court Filings, Witness Coordination, Digital Journal & Audit Trail, Volume Pricing
- Compliance: Ohio Rules of Professional Conduct, UPL boundary, attorney-client privilege safeguards
- CTAs: `/book`, `/services`, `/business-portal`

### `src/pages/solutions/ForSmallBusiness.tsx`
- Hero: Affordable notary & document services for businesses
- Features: Corporate Resolutions, Operating Agreements, Contracts & Vendor Agreements, I-9/Employment Verification, Registered Agent Coordination, Subscription Plans
- CTAs: `/book`, `/subscribe`, `/services?category=business`

### `src/pages/solutions/ForIndividuals.tsx`
- Hero: Personal document services made simple
- Features: Wills & Estate Planning, Vehicle Title Transfers, Affidavits & Sworn Statements, Immigration Documents, RON from Home, ID Verification
- CTAs: `/book`, `/ron-check`, `/fee-calculator`

---

## Part 3: Navigation & Routing Updates

### `src/components/Navbar.tsx`
Add hospital entry to `solutionLinks` array:
```ts
{ to: "/solutions/hospitals", label: "For Hospitals", desc: "Bedside & facility notarization" }
```

### `src/App.tsx`
- Lazy import all 5 new solution pages
- Replace ComingSoon routes with actual components:
  - `/solutions/hospitals` → `ForHospitals`
  - `/solutions/real-estate` → `ForRealEstate`
  - `/solutions/law-firms` → `ForLawFirms`
  - `/solutions/small-business` → `ForSmallBusiness`
  - `/solutions/individuals` → `ForIndividuals`

### `src/components/Breadcrumbs.tsx`
Add label mappings: `solutions: "Solutions"`, `hospitals: "Hospitals"`, etc.

---

## Part 4: Button Audit — All Solution Pages

Every solution page will have buttons that route to real, functional pages:
- "Book Now" / "Get Started" → `/book`
- "Explore Services" → `/services` (with optional `?category=` filter)
- "View Pricing" → `/fee-calculator`
- "Learn About RON" → `/ron-info`
- "Loan Signing" → `/loan-signing`
- "Join Platform" → `/join` (notary page only)
- "Subscribe" → `/subscribe`
- "Call Now" → `tel:6143006890`

No buttons will link to ComingSoon or dead routes.

---

## Part 5: Runtime Error Fix

The `removeChild` error is a known React 18 issue with `<script>` tags injected inside the React tree (JSON-LD in Index.tsx). Fix by wrapping the JSON-LD `dangerouslySetInnerHTML` script in a `<Helmet>` or moving it to a `useEffect` that appends to `document.head` instead of rendering inline.

---

## Files to Create (5)
| File | Purpose |
|------|---------|
| `src/pages/solutions/ForHospitals.tsx` | Hospital/healthcare facility solution page |
| `src/pages/solutions/ForRealEstate.tsx` | Real estate closings solution page |
| `src/pages/solutions/ForLawFirms.tsx` | Law firm solution page |
| `src/pages/solutions/ForSmallBusiness.tsx` | Small business solution page |
| `src/pages/solutions/ForIndividuals.tsx` | Individual/personal services solution page |

## Files to Modify (3)
| File | Changes |
|------|---------|
| `src/App.tsx` | Add 5 lazy imports, replace ComingSoon routes |
| `src/components/Navbar.tsx` | Add "For Hospitals" to solutionLinks |
| `src/components/Breadcrumbs.tsx` | Add solution segment labels |

