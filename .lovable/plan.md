
# Generate Comprehensive Remaining Implementations CSV

## Summary
After deep codebase analysis cross-referenced against all prior gap documents and implementation plans, I'll generate a CSV of all items still needing implementation. Many previously planned items ARE now implemented (annual billing toggle, lead scoring, Kanban board, export format selector, AI tool registry entries, middleware headers, etc.). The remaining gaps fall into these categories.

## What the CSV Will Contain
`/mnt/documents/notardex_remaining_implementations.csv` with columns: ID, Category, Item, Description, Current Status, Priority, Expected Outcome, Implementation Details, Estimated Effort

## Key Remaining Items (~80 rows)

### Already Confirmed as DONE (will NOT be in CSV)
- Annual billing toggle with 20% discount (SubscriptionPlans.tsx lines 103-115, 192-201)
- Lead scoring engine (AdminLeadPortal.tsx line 282)
- Lead-to-appointment booking link (AdminLeadPortal.tsx line 757)
- AI tool registry: ohio-poa-generator, healthcare-directive-builder, session-pdf-report (aiToolsRegistry.ts lines 3025-3080)
- TOOL_IDS in edge function (ai-tools/index.ts line 37)
- Export format selector .md/.txt/.html (ToolRunner.tsx line 317)
- I-9 verification wizard (AdminI9Verifications.tsx line 159)
- Grant Dashboard PDF export (GrantDashboard.tsx line 229)
- Resume Builder uses ai-extract-document (ResumeBuilder.tsx line 204)
- API versioning header X-API-Version: 1.0 (middleware.ts line 21)
- Structured logging helper (middleware.ts line 25)
- CRM 7-stage pipeline (AdminCRM.tsx lines 24-32)
- Estate Plan Bundle in booking (bookingConstants.ts line 54)
- Client feedback/satisfaction survey (ClientFeedbackForm.tsx)

### Still Missing (will be in CSV)
1. **AdminNotaryCompliance dashboard** — not created
2. **Business Formation wizard** — only has simple form, no step-by-step wizard
3. **Promo Code Manager** (admin UI) — promo codes exist in DB but no admin CRUD page
4. **Bulk Invoice Generator** — not implemented
5. **Dynamic Pricing Rules Editor** — not implemented
6. **Notary Stamp/Credential Upload Manager** — not implemented
7. **Session Recording Archive Manager** — not implemented
8. **Client Onboarding Analytics dashboard** — not implemented
9. **Lead enrichment note overwrite bug** — discover-leads edge function still overwrites notes
10. **Email templates still say "NotarDex"** — should be "Notar" per brand update
11. **Document anatomy placeholder images** — all 10 .jpg files are placeholders, not real photographed examples
12. **No service area map visualization** — About page lists areas as text badges only
13. **No booking-to-payment flow** — booking doesn't trigger payment collection
14. **Contractor self-registration public page** — only a settings toggle exists, no public form
15. **Free tier limits on GrantDashboard/ResumeBuilder/DocumentBuilder** — only ToolRunner has limits
16. **CPN Calculator / Amortization / Schedule C financial tools** — referenced in docs but not built
17. **Lead merge wizard** — not implemented
18. **Lead map view** — not implemented
19. **Multi-format lead import (vCard/Excel)** — not implemented
20. **Webhook retry logic** for SignNow/Stripe — not implemented
21. **DocuDex font embedding for PDF export** — not implemented
22. **DocuDex template thumbnails** — not implemented
23. **Apostille client-facing tracking page** — admin page exists but no public tracker
24. **Post-session automated workflow trigger from UI** — edge function exists but no UI trigger
25. **"What to Bring" checklist per service on booking confirmation** — exists in reminder emails but not on confirmation page
26. **ORC statute hyperlinks** — referenced as text but not clickable links to Ohio law
27. **Business hours inconsistency** across pages
28. **Database performance indexes** — no indexes beyond defaults
29. **Zod schema validation** on booking/signup forms
30. **PortalLeadsTab** — only shows service_requests, not actual leads

## Implementation Approach
Generate a Python script that writes all ~80 remaining items to CSV with detailed implementation instructions for each.

## Technical Details
**File created:** `/mnt/documents/notardex_remaining_implementations.csv`
No codebase modifications — CSV generation only.
