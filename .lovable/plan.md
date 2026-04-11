

# Notar Brand Identity Correction Plan

## Overview

The uploaded Brand Identity v2.0 document identifies 10 specific gaps (B-001 through B-010) between the current codebase and the intended brand identity. This plan implements all corrections without changing unrelated functionality.

## Changes

### 1. Fix Primary Gold Color (B-001) — Highest Priority

**`src/index.css`**: Replace all `48 91% 52%` with `45 86% 48%` across both `:root` and `.dark` blocks. This affects `--primary`, `--ring`, `--accent-warm`, `--warning`, `--sidebar-primary`, `--sidebar-ring`. Also update `--primary-glow` from `48 91% 62%` to `45 86% 58%`. In dark mode, also change `--accent` from `48 91% 52%` to the correct dark accent value `30 10% 16%` (currently it incorrectly uses primary gold).

**`tailwind.config.ts`**: Update all hardcoded `hsl(48 91% 52%)` in `boxShadow` and `keyframes.glow-pulse` to `hsl(45 86% 48%)`.

**`public/favicon.svg`**: Update the gold circle fill from `hsl(43, 74%, 49%)` to `hsl(45, 86%, 48%)`.

### 2. Fix Background Cream (B-004)

**`src/index.css`**: Change `:root` `--background` from `45 100% 97%` to `48 100% 97%` (#FFFCF0).

### 3. Fix Secondary/Border Colors (B-005)

**`src/index.css`**: Change `:root` `--secondary` from `45 30% 90%` to `44 22% 90%` and `--border` from `45 20% 90%` to `44 22% 90%`.

### 4. Fix Hardcoded Gradient HSL Values (B-009)

**`src/index.css`**: Update all hardcoded HSL references:
- `.text-gradient-primary`: `hsl(48 91% 52%)` → `hsl(45 86% 48%)`, `hsl(42 100% 65%)` → `hsl(42 92% 60%)`
- `.bg-gradient-hero`: `hsl(48 100% 95%)` → `hsl(48 95% 93%)`, `hsl(48 91% 70%)` → `hsl(45 86% 65%)`
- `.interactive-card:hover box-shadow`: `hsl(48 91% 52% / 0.12)` → `hsl(45 86% 48% / 0.12)`
- `.gradient-mesh`: all old gold values → corrected equivalents
- `.text-primary-accessible`: update to `hsl(38 82% 31%)` per the document's accessible amber spec

### 5. Fix Hero Gradient (B-010)

**`src/index.css`**: Update `.bg-gradient-hero` to: `linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(48 100% 97%) 40%, hsl(48 95% 93%) 100%)` — creating the white-to-cream wash.

### 6. Add DM Serif Display Font (B-006)

**`src/index.css`**: Extend the Google Fonts import to include `family=DM+Serif+Display:wght@400`. Add `.font-display` utility class.

**`tailwind.config.ts`**: Update `fontFamily.display` to `['"DM Serif Display"', 'Georgia', 'serif']`.

**`src/pages/Index.tsx`**: Apply `font-display` class to the hero headline ("Legal Online Notarization") for warmth and authority.

### 7. Add DM Mono Font (B-007)

**`src/index.css`**: Extend Google Fonts import to include `family=DM+Mono:wght@400;500`.

**`tailwind.config.ts`**: Add `mono: ['"DM Mono"', 'monospace']` to `fontFamily`.

### 8. Update Accessible Amber Text Class

**`src/index.css`**: Update `.text-primary-accessible` to use `hsl(38 82% 31%)` in light mode (per document spec of #8F630E).

### 9. Favicon SVG Color Fix

**`public/favicon.svg`**: Update the background rect fill and gold accent circle to use corrected brand colors.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/index.css` | Color tokens, fonts, gradients, accessible amber |
| `tailwind.config.ts` | Font families, hardcoded shadow HSL values |
| `src/pages/Index.tsx` | Hero headline font class |
| `public/favicon.svg` | Brand gold color |
| `src/lib/brand.ts` | Update tagline to "Legal Online Notarization" |

## What Is NOT Changed

- No pages removed or restructured
- No components deleted
- No routing changes
- No database changes
- No admin dashboard modifications
- Dark mode warm charcoal base retained as-is (only gold references updated)
- All existing functionality preserved

