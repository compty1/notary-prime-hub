# Comprehensive Gaps & Bugs CSV — Plan

Produce a single deliverable artifact: `/mnt/documents/gaps_and_bugs.csv` containing up to **800 rows** of every currently-known gap, bug, incomplete implementation, polish item, and compliance/security follow-up across the project, each with a concrete fix.

## CSV schema (10 columns)

```
ID, Category, Area, Route/File, Severity, Status, Title, Description, Recommended Fix, Effort
```

- **Category**: Bug | Gap | Polish | Compliance | Security | Performance | A11y | SEO | UX | Test | DX | Content
- **Area**: Homepage, Solutions, Services, Booking, RON, Admin/<sub>, Portal, Shop, Academy, Auth, Backend/Edge, Storage, CMS, AI Tools, Analytics, Notifications, Marketing, Print, etc.
- **Severity**: P0 / P1 / P2 / P3
- **Status**: Open | In Progress | Verified Open | Needs Investigation
- **Effort**: XS (<30m) | S (~1h) | M (~half day) | L (1–2d) | XL (>2d)

## Coverage targets (~800 rows total)

Synthesized from the project memory index, recent audits, the 5-pass polish plan in `.lovable/plan.md`, route inventory (≈55 public + 80+ admin + 40+ services + 7 solutions), prior audit history, and standard Ohio RON compliance + Block Shadow brand obligations.

| Bucket | Rows |
|---|---|
| Homepage + marketing routes polish, image/picture wiring, Block Shadow drift | 80 |
| Solutions pages (×7) — CTA, hero, copy, schema, FAQ, JSON-LD | 70 |
| Services pages (×40+) — pricing surface, AI tool wiring, FAQ, prerequisites | 120 |
| Booking + RON flow — state machine edges, KBA, witnesses, retention, e-seal | 80 |
| Admin suite (CRM, Ops, Financials, Inventory, Automation, Settings, etc.) | 140 |
| Compliance (ORC §147, UPL, retention, refusal logs, journal) | 60 |
| Security (RLS, signed URLs, MFA, IDOR, webhook DLQ, PII masking) | 60 |
| Performance (Picture rollout, bundle, LCP, lazy, prefetch) | 40 |
| Accessibility (WCAG 2.1 AA gaps, focus order, ARIA, contrast, reduced-motion) | 40 |
| SEO (titles, meta, JSON-LD, sitemap, canonicals, OG) | 30 |
| Tests (visual regression coverage, Playwright, vitest gaps) | 30 |
| DX/build (asset checks, CI, lint, types, docs) | 30 |
| Content/CMS, email templates, transactional copy | 20 |

## Method

1. Walk the memory index (~100 features) and emit 5–10 rows per memory file covering known sub-items.
2. Cross-reference `src/pages/` route inventory; emit polish + bug rows per route.
3. Pull the 5 unfinished items from `.lovable/plan.md` (visual snapshots, Lighthouse run, remaining hero illustrations + wiring, CTA verification, asset-import CI hook) as P0/P1 anchors.
4. Append standing Ohio compliance + security rows from `mem://compliance/*` and `mem://tech/security-*`.
5. Deduplicate by `(Area, Title)`, cap at 800, write CSV with UTF-8 BOM for Excel.

## Deliverable

- `/mnt/documents/gaps_and_bugs.csv` — surfaced via `<presentation-artifact>`.
- Short chat summary with row counts per Category + top 10 P0 items.

## Out of scope

- No source code changes in this pass.
- No backend/RLS migrations.
- No image generation; assets only referenced by ID.
