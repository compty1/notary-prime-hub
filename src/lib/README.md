# `src/lib` — Utility Module Index

This folder holds framework-agnostic utilities, domain logic, and platform helpers.
Components and pages should import from here rather than re-implementing logic.

## Categories

### Compliance & Legal (Ohio ORC §147)
- `ohioCompliance.ts`, `ohioComplianceLib.ts`, `ohioDocumentEligibility.ts` — statutory rules, fee caps, RON eligibility.
- `uplGuard.ts` — Unauthorized Practice of Law guardrails.
- `legalGlossary.ts` — terminology surfaced in tooltips and help text.

### Notarial Workflow
- `appointmentStateMachine.ts` — 14-transition state machine for appointment lifecycle.
- `appointmentReminders.ts` — Reminder cadence (24h / 2h / 15m).
- `pricingEngine.ts` — Centralized price calculation across services and zones.
- `notarizationCertificate.ts` — Generates state-compliant certificate JSON.

### Security & Auth
- `security.ts`, `accessibility.ts`, `aiGuardrails.ts` — input sanitization, A11y helpers, AI safety.
- `signedUrls.ts` — short-lived signed URL helper for IDOR prevention.

### Marketing & Analytics
- `analytics.ts`, `analyticsEvents.ts`, `acquisitionCost.ts`, `abTesting.ts`, `utmCapture.ts`.

### Admin / Ops
- `adminBatchOperations.ts`, `adminBulkOperations.ts`, `adminExportHelpers.ts`.
- `accountingExport.ts` — Schedule C export.

### Internationalization
- `i18n.ts` — Locale config, translations, RTL support (en / es / fr / de / ar).

### Misc Utilities
- `utils.ts` — `cn()` class merger, password strength, formatters.
- `animations.ts` — framer-motion presets honouring `prefers-reduced-motion`.
- `apiClient.ts` — typed wrapper around `supabase.functions.invoke`.

## Conventions

- Pure functions where possible — no React imports unless the file ends in `.tsx`.
- Re-export shared types from a single named export per module.
- Co-locate unit tests as `*.test.ts` next to the module.
- When you add a new module, add it here under the most relevant category.
