

# Two-Part Plan: 3D Paper-Cut Icon Regeneration + Full Audit Remediation

## Part 1: 3D Paper-Cut Icon Style Upgrade

The uploaded reference image shows a specific aesthetic: **paper-cut 3D style** with soft white paper surfaces, folded corners, subtle shadows, warm light reflections, and a golden yellow accent seal. All 37 existing icons in `src/assets/icons-3d/` need to be regenerated to match this unified style.

### Approach
- Use the Lovable AI image generation model (`google/gemini-3-pro-image-preview`) to regenerate each icon with a consistent prompt describing the paper-cut 3D style: white paper/document forms, soft ambient occlusion shadows, golden-yellow (#E4AC0F) accent elements, clean white background, light reflections on surfaces
- Replace all 37 PNG files in `src/assets/icons-3d/` with the new renders
- No code changes needed — the `icon3dMap.tsx` imports remain identical since filenames stay the same

### Icons to regenerate (37 total)
`checklist`, `notary-agent`, `identity-verify-clean`, `doc-shield-clean`, `certificate`, `task-list`, `warning`, `folders`, `scroll`, `doc-search`, `receipt`, `lightbulb`, `handshake`, `verified-badge`, `calendar`, `analytics`, `folder-verified`, `rocket`, `video-call`, `cloud-upload`, `pie-chart`, `cloud-security`, `award`, `team-review`, `medal`, `tools`, `password`, `email`, `thumbs-up`, `workflow`, `globe-docs`, `newsletter`, `lock-shield`, `clock-fast`, `legal-doc`, `encryption`, `verified-seal`

---

## Part 2: Full Codebase Audit Remediation (47 findings)

### Sprint 1: P0 Critical Fixes (6 items, ~20h)

| ID | Fix | Files |
|----|-----|-------|
| C-01 | Change all 15 enterprise sidebar links from `/admin/enterprise/*` to `/enterprise/*` | `AdminDashboard.tsx`, `EnterpriseDashboard.tsx`, `EnterpriseLayout.tsx` |
| C-02 | Gate booking/uploads/payments behind `email_confirmed_at` check; add verification interstitial | `ProtectedRoute.tsx`, new `EmailVerificationGate.tsx` |
| C-03 | Add DOMPurify to ClientPortal chat message rendering | `ClientPortal.tsx` |
| C-04 | Add password re-entry before account deletion, 30-day soft-delete with recovery | `ClientPortal.tsx`, `delete-account` edge function |
| C-05 | Audit `user_credentials` table — ensure vault uses Supabase Vault, not reversible encryption | Migration + edge function audit |
| C-06 | Remove dead `dbServices` query from homepage OR render dynamic data | `Index.tsx` |

### Sprint 2: P1 High Fixes (11 items, ~23h)

| ID | Fix |
|----|-----|
| H-01 | Fix 3 dead sidebar links (`/admin/ai-assistant`, `/admin/service-requests`, `/admin/reports`) |
| H-02 | Consolidate `/booking` and `/schedule` to redirect to `/book` |
| H-03 | Align auth gating: `/pricing` public for browsing, `/subscribe` protected for action |
| H-04 | Redirect `/professionals` to `/notaries` |
| H-05 | Refactor ClientPortal monolith — use existing portal tab components with lazy loading |
| H-06 | Add per-section error handling + retry buttons to ClientPortal data fetches |
| H-07 | Fix profile dialog close bug — add "Discard changes?" confirmation |
| H-08 | Fix or remove Remember Me (implement Supabase session config or remove UI) |
| H-09 | Create shared `validatePassword()` utility with strength meter |
| H-10 | Replace `window.location.href = "/"` signout with `navigate("/")` + React Query invalidation |
| H-11 | Require appointment selection for review submission |

### Sprint 3: P2 Medium Fixes (14 items, ~36h)

| ID | Fix |
|----|-----|
| M-01 | Consolidate `feedback`/`client_feedback`/`service_reviews` tables; consolidate financial tables |
| M-02 | Create RPC functions for booking validation, financial reporting, dashboard metrics |
| M-03 | Fix AI tools grid: `md:grid-cols-2 lg:grid-cols-4` |
| M-04 | Add content links to industry insights cards |
| M-05 | Audit and remove redundant `ProtectedRoute` double-wrapping on admin child routes |
| M-06 | Rename package.json from `vite_react_shadcn_ts` to `notar-platform` |
| M-07 | Split App.tsx routes into `publicRoutes`, `adminRoutes`, `enterpriseRoutes`, `serviceRoutes`, `shopRoutes` |
| M-08 | Handle ProtectedRoute auth timeout edge case (show loading state when user exists but role hasn't loaded) |
| M-09 | Implement login redirect parameter reading and post-auth redirect |
| M-10 | Clean up duplicate EstatePlanning imports |
| M-11 | Add error handling to staffUsers query |
| M-12 | Add client-side rate limiting on admin route access |
| M-13 | Deduplicate local `formatDate` — import from shared utils |
| M-14 | Refactor BookAppointment 50+ state variables into `useReducer` or booking context |

### Sprint 4: P3 Low Fixes (8 items, ~8h)

| ID | Fix |
|----|-----|
| L-01 | Add tooltip with description on service card hover |
| L-02 | Implement enhanced hero animation (parallax or particle effects) |
| L-03 | Move cookie consent from PageShell to App.tsx level |
| L-04 | Defer geolocation request until user clicks "Use my location" |
| L-05 | Extract booking draft expiry to named constant `BOOKING_DRAFT_EXPIRY_MS` |
| L-06 | Add `clientAddress` to beforeunload useEffect dependency array |
| L-07 | Look up service_id from services table for waitlist inserts |
| L-08 | Improve NOTARIAL_ACT_MAP matching with priority-ordered exact matches |

### Sprint 5: Verification & Testing (~47h)

- A-06: Establish Vitest + Playwright test baseline for critical booking/payment paths
- A-07: Audit Academy/LMS for real vs stub content
- A-08: Verify all 15 enterprise tools + 8 design studio tools are functional
- End-to-end verification: Stripe payment flow, SignNow/RON flow, IONOS email system
- Full admin sidebar link audit (100+ items vs routes)

---

## Implementation Order

1. **Icon regeneration** (Part 1) — runs in parallel with code fixes since it's asset-only
2. **Sprint 1** (P0 criticals) — security and navigation, must be first
3. **Sprint 2** (P1 highs) — broken UX and auth issues
4. **Sprint 3** (P2 mediums) — architecture and data integrity
5. **Sprint 4** (P3 lows) — polish
6. **Sprint 5** — verification and testing

Each sprint will be implemented incrementally. I will start with the icon regeneration + Sprint 1 critical fixes upon approval.

