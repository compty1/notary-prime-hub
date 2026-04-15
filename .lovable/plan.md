

# Comprehensive Theme, Icons, Style & Tools Audit — Remediation Plan

## Current State Summary

After thorough audit, the project is in **strong shape** across most areas. Here are the specific remaining issues found:

---

## Issues Found

### 1. Duplicate `prefers-reduced-motion` block in `index.css`
Lines 462–469 and 549–558 are **identical** `@media (prefers-reduced-motion: reduce)` blocks. The second is redundant.

**Fix:** Remove lines 549–559 (the duplicate block).

### 2. Duplicate `:focus-visible` rule in `index.css`
Lines 126–130 (`*:focus-visible`) and 282–285 (`:focus-visible`) and 561–564 (`:focus-visible`) — three overlapping focus-visible rules. The base layer one is correct; the other two are redundant and could cause specificity confusion.

**Fix:** Remove lines 281–289 and 561–565.

### 3. Unused `Palette` import in `AdminMicroTools.tsx`
`Palette` is imported from `lucide-react` (line 11) but never used in the component.

**Fix:** Remove `Palette` from the import.

### 4. Unused `Textarea` import in `AdminMicroTools.tsx`
`Textarea` is imported (line 9) but never used in any of the six micro-tools.

**Fix:** Remove `Textarea` from the import.

### 5. `chart.tsx` uses unsanitized `dangerouslySetInnerHTML`
The shadcn chart component injects CSS via `dangerouslySetInnerHTML` without sanitization. This is **safe** because the content is entirely generated from code (THEMES constant), not user input — but should have a comment noting this.

**Fix:** Add a safety comment confirming the source is static/trusted.

### 6. Hardcoded HSL in `AdminOverview.tsx` CHART_COLORS
Line 23 still has `"hsl(43, 74%, 49%)"` — a hardcoded value mixed with CSS variable references.

**Fix:** Replace with `"hsl(var(--accent-warm))"` for consistency.

### 7. Hardcoded gradient HSL values in `index.css` utilities
`text-gradient-primary` (line 186), `bg-gradient-hero` (line 191), `interactive-card` hover (line 315), `gradient-mesh` (lines 326-328), and `grid-pattern` (lines 334-335) use hardcoded HSL values instead of CSS custom properties.

**Fix:** Replace with `var(--primary)` / `var(--primary-glow)` / `var(--border)` references where possible, or add a comment explaining why static values are required (e.g., gradient interpolation).

### 8. Dark mode toggle not in public Navbar
The `DarkModeToggle` component exists and works well, but is only rendered in the admin dashboard header — not in the public-facing Navbar.

**Fix:** Add `DarkModeToggle` to the Navbar's right-side actions area.

### 9. `sonner.tsx` imports from `next-themes`
Line 1: `import { useTheme } from "next-themes"` — this is a Next.js package in a Vite/React project. It likely works as a standalone hook, but it's an unnecessary dependency tied to another framework.

**Fix:** Replace with the project's own localStorage-based theme detection from `DarkModeToggle` logic, or keep as-is with a comment (next-themes works standalone).

---

## Already Verified (No Action Needed)

| Area | Status |
|------|--------|
| CSS custom properties (light + dark) | Complete — 63 variables defined |
| Semantic Tailwind tokens (no hardcoded hex in components) | Clean — zero `bg-[#...]` / `text-[#...]` matches |
| `sanitizeHtml` / `DOMPurify` on all `dangerouslySetInnerHTML` | 16/17 files use sanitization; 1 (chart.tsx) is safe static CSS |
| `SafeMotion` + `useReducedMotion` | Implemented |
| `animations.ts` respects `prefers-reduced-motion` | Implemented |
| WCAG focus indicators | Implemented |
| Touch targets (44px on coarse pointers) | Implemented |
| High contrast mode | Implemented |
| Forced colors mode | Implemented |
| Skip-to-content link | Implemented |
| Print stylesheet | Comprehensive |
| Dark mode variables (light + dark) | Complete |
| Brand config centralization | Complete (`brand.ts` + `brandConfig.ts`) |
| `useBrandColors` hook wired to `PageShell` | Complete |
| Font stack (DM Sans / DM Serif Display / DM Mono) | Consistent |
| Logo component | Clean, uses `notar-logo.png` asset |
| Footer with UPL disclaimer | Complete |
| Micro-tools (6 tools) | Functional |
| XSS sanitization library | Comprehensive (`sanitize.ts`) |

---

## Implementation Summary

| # | Task | Files |
|---|------|-------|
| 1 | Remove duplicate `prefers-reduced-motion` block | `src/index.css` |
| 2 | Remove duplicate `:focus-visible` rules | `src/index.css` |
| 3 | Remove unused `Palette` + `Textarea` imports | `AdminMicroTools.tsx` |
| 4 | Add safety comment to `chart.tsx` | `chart.tsx` |
| 5 | Replace hardcoded HSL in `AdminOverview.tsx` | `AdminOverview.tsx` |
| 6 | Convert hardcoded gradients to CSS var references | `src/index.css` |
| 7 | Add `DarkModeToggle` to public Navbar | `Navbar.tsx` |
| 8 | Fix `next-themes` import in `sonner.tsx` | `sonner.tsx` |

All changes are small, surgical fixes — no architectural changes needed.

