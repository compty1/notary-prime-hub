# Comprehensive List of Unfinished / Unimplemented Items

Compiled from the **Build Tracker** database (28 open items), the **Admin To-Do** flags (10), recent plan notes, and code-level audits. Grouped by domain and priority.

---

## 🔴 Critical — Ohio Compliance (must fix before public launch)

1. **RON session recording consent verification** — verify ORC §147.63 mandatory recording-consent capture & 5-yr retention enforcement on every RON session.
2. **Ohio ORC §147.66 KBA limit enforcement** — hard-cap KBA attempts and block sessions that exceed statutory limits.

## 🟠 High Priority — Payments, Data Integrity, Security

3. **Refund Workflow** — add refund button in `AdminRevenue` wired to Stripe Refunds API + audited justification dialog.
4. **Stripe Subscription Management** — wire subscription API + plan management UI in `SubscriptionPlans`.
5. **DocuDex missing save-to-database** — persistence not wired to backend; documents currently local-only.
6. **`build_tracker_items` RLS verification** — confirm admin-only policies (currently flagged as unverified).
7. **3 active services show $0 pricing** — clean pricing for affected service rows.
8. **6 duplicate service entries** (5 + 1) — deduplicate `services` table.

## 🟡 Medium — Content, SEO, UX

9. **38 public pages may lack SEO meta tags** — sweep `usePageMeta` coverage on public routes.
10. **3 active services missing detailed descriptions**.
11. **356 active services missing documented requirements** (130 + 126 + 100) — populate `requirements`.
12. **Multi-Language Support** — i18n framework + Spanish translations.
13. **Admin "Active Animations" panel** — page in admin dashboard to view, toggle, and upload site-wide animations (per tracker note).

## 🔵 Low — Nice-to-Have / Backlog

14. **Email Template Versioning** — versioned templates in `platform_settings` with rollback.
15. **Document OCR Enhancement** — pre-processing + batch support in `ocr-digitize` edge fn.
16. **Offline Mode for Mobile** — service worker + IndexedDB caching for appointments/documents.
17. **HubSpot Deal Bidirectional Sync** — push deal-stage changes + poll for HubSpot updates.
18. **API Rate Monitoring Dashboard** — edge-function invocation counts + error rates.
19. **552 active services have no FAQs** (16 + 159 + 155 + 119 + 103) — generate per-service FAQ entries.
20. **280 active services missing estimated turnaround** (103 + 99 + 78) — populate ETA fields.

## 🛠 Code-Level Loose Ends Detected

21. **`src/pages/ComingSoon.tsx` placeholder** — confirm every route pointing here either has a real page or is removed from nav.
22. **Hard-coded color sweep (theme migration leftovers)** — per `.lovable/plan.md`, designer pages, PDF/canvas modules (`InvoicePDFExport`, `NotarizationCertificate`, `receiptGenerator`, Recharts) still ship private palettes; `themeColors.ts` runtime resolver was planned but not confirmed implemented.
23. **`useBrandColors` cleanup verification** — confirm CSS-var wipe-on-unmount fix held after later edits.
24. **Status color maps** (`statusColors.ts`, `crmAutoTagging.ts`, `appointmentStateMachine.ts`) — still use raw Tailwind palette names instead of semantic tokens.
25. **`BRAND_CONFIG.palette` + `DocuDexBrandKit` `DEFAULT_KIT`** — should be re-pointed at the new HSL tokens (single source of truth).
26. **Logo / favicon** — verify navy-badge + lime-check refresh applied to `Logo.tsx` (favicon was updated).

---

## Suggested Next Action

Tackle in this order for fastest risk reduction:

```text
Tier 1 (block public launch):  1, 2, 6, 5
Tier 2 (revenue + data):       3, 4, 7, 8
Tier 3 (polish + SEO):         9, 10, 11, 13, 22-26
Tier 4 (backlog):              12, 14-20
```

Tell me which tier (or specific item numbers) to start on and I'll implement.
