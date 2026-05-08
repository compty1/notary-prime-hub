## Goal
Produce a CSV audit document cataloging gaps, bugs, and needed implementations across the entire Notar build, up to 800 rows.

## Approach
1. **Static scan** of the codebase across these dimensions:
   - **Routing & pages**: dead routes, missing pages referenced in nav, orphaned components
   - **Auth & RBAC**: ProtectedRoute coverage, role checks, MFA enforcement gaps
   - **Supabase/RLS**: tables without policies, overly permissive policies, missing indexes, linter warnings
   - **Edge functions**: missing error handling, unverified webhooks, missing JWT checks, secret usage
   - **Forms & validation**: zod schema coverage, sanitization, file upload validation
   - **Compliance (Ohio ORC 147)**: fee cap enforcement, 10-yr retention, KBA limits, journal fields, UPL guards, refusal logging
   - **Security**: signed URL usage, IDOR, PII masking, CSP, rate limiting, CSRF, brute force
   - **Accessibility (WCAG 2.1 AA)**: alt text, ARIA labels, keyboard nav, focus rings, contrast, reduced-motion
   - **SEO**: title/meta length, single H1, JSON-LD coverage, sitemap freshness, canonical tags
   - **Performance**: large bundles, missing lazy loading, image optimization, query N+1
   - **Design system**: hardcoded colors/HSL violations, non-semantic tokens, inconsistent typography
   - **Trust components rollout**: pages still missing TrustBar/OrcChip/NotaryOnCall
   - **Icon migration**: pages still using Icon3D/lucide where NotarMark applies
   - **Error handling**: toast coverage, error boundaries, retry logic, offline queues
   - **Testing**: missing vitest coverage on critical lib/* modules
   - **Documentation**: missing JSDoc on public utilities, missing READMEs in subsystems
   - **Realtime**: improper table inclusion in supabase_realtime publication
   - **Webhook resilience**: DLQ coverage, idempotency keys
   - **Dead code**: unused imports, deprecated components, orphaned hooks

2. **Tools used**:
   - `rg` searches across `src/`, `supabase/functions/`
   - `supabase--linter` for DB warnings
   - `security--get_scan_results` for active findings
   - File reads for spot-checks on suspect files

3. **CSV schema** (one row per finding):
   ```
   id, category, severity, area, file_or_route, title, description, implementation_steps, effort, ohio_compliance_impact, references
   ```
   - **severity**: critical / high / medium / low / info
   - **effort**: XS / S / M / L / XL
   - **ohio_compliance_impact**: yes / no

4. **Output**: `/mnt/documents/notar_audit_v1.csv` — target 400–800 rows depending on real findings (will not pad with junk).

5. **Summary deliverable**: After CSV, brief inline breakdown by category + severity histogram, and the `<lov-artifact>` tag for download.

## Out of scope
- No code changes will be made (audit only).
- Will not run security scan that mutates state.
- Findings about external services (Stripe webhook secrets, IONOS) limited to detectable misconfig in code/config.

## Confirmation needed
Approve to proceed and I will run the scans and produce the CSV in one pass.