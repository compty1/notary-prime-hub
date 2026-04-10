

# Theme & Visual Experience Audit — Full Plan

## Audit Findings

### 1. Contrast Issues — Primary Gold on White
The primary color `hsl(43 74% 49%)` (#C9A227) on white backgrounds fails WCAG AA for normal text (contrast ratio ~2.8:1). This affects:
- **Button variant "default"**: `bg-primary text-primary-foreground` — primary-foreground is dark (#212529), so buttons are OK (dark text on gold).
- **`text-primary` links and accents on white**: Gold text on white fails AA. Seen in Footer hover links, FAQ "View All Services →", accordion triggers, and anywhere `text-primary` appears on light backgrounds.
- A `.text-primary-accessible` utility exists (darker gold for text) but is almost never used.

### 2. Hardcoded Colors (Inconsistency)
~50+ instances of hardcoded hex/HSL instead of semantic tokens:
- **`bg-[#212529]`** — Used as CTA button color (hero, services, login, contact form) instead of a semantic token. Should be a named token like `bg-foreground` or a new `bg-brand-dark`.
- **`hover:bg-[#ca9a06]`** — Hardcoded hover for primary buttons (Navbar, ForgotPassword, SignUp). Should use `hover:bg-primary/85` or a token.
- **`bg-[#f8f9fa]`** — Used for input backgrounds, badge backgrounds, search bars. Should map to `bg-muted` or `bg-input`.
- **`bg-[#fcfcfc]`** — Page backgrounds. Should map to `bg-background`.
- **`text-[#212529]`** — Headings everywhere. Should be `text-foreground`.
- **`shadow-[3px_3px_0px_#212529]`** — Hardcoded block shadow in SignUp/ForgotPassword. Should use `shadow-block`.
- **`border-gray-100/200`** — Mixed use instead of `border-border`.
- **`text-gray-400/500`** — Used for body text instead of `text-muted-foreground`.

### 3. Button Style Inconsistency
Three different CTA button patterns exist:
- **Pattern A (Hero/Index)**: `bg-[#212529] text-white shadow-block` — dark charcoal CTA
- **Pattern B (SignUp/ForgotPassword)**: `bg-primary text-white hover:bg-[#ca9a06] shadow-[3px_3px_0px_#212529]` — gold CTA with manual shadow
- **Pattern C (Navbar)**: `bg-primary text-white shadow-block` — gold with token shadow

These should be unified into one or two named button variants.

### 4. Logo Inconsistencies
- `Logo` component `showText` renders "NOTAR" in serif font — consistent.
- Footer uses `<Logo size="sm" showText subtitle="..." theme="dark" />` — OK.
- Login page uses `<Logo size="md" showText />` — no theme prop, defaults to `text-foreground` which is dark on light — OK.
- SignUp uses `<Logo size="lg" />` without `showText` — icon only, no brand text. Inconsistent with Login.
- ForgotPassword uses `<Logo size="lg" />` — icon only, same issue.
- Admin sidebar uses `<Logo size="sm" showText={!collapsed} theme="dark" />` — OK.

### 5. `glow-amber` Uses Old Color
`.glow-amber` and `.glow-amber-lg` use `rgba(245, 158, 11, ...)` (Tailwind amber-500), not the brand gold `hsl(43 74% 49%)`. Should use `hsl(var(--primary))`.

### 6. Dark Mode Gaps
- Navbar: `bg-white/90` hardcoded, won't adapt to dark mode.
- Footer: `bg-[hsl(222_47%_4%)]` hardcoded — works for both modes but bypasses tokens.
- Login/SignUp right panel: `bg-[#212529]` hardcoded — fine since it's intentionally dark.
- Admin header: `bg-white/80` hardcoded — won't adapt.
- Client Portal: `bg-[#f8f9fa]` hardcoded — won't adapt.

### 7. CTA Banner Contrast
The gold CTA section on Index (`bg-primary`) has `text-[#212529]` for heading — OK contrast. But `text-[#212529]/70` for body text on gold is marginal.

---

## Implementation Plan

### Step 1: Establish Missing Semantic Tokens
Add to `index.css` `:root` and `.dark`:
- Map `--background` to exact `#fcfcfc` / dark equivalent (already done)
- Verify `--foreground` = `#212529` equivalent (already `222 47% 11%` ≈ correct)
- Verify `--input` and `--muted` map to `#f8f9fa` equivalents (already close)

### Step 2: Fix `glow-amber` Utilities
Update `.glow-amber` and `.glow-amber-lg` in `index.css` to use `hsl(var(--primary))` instead of hardcoded `rgba(245, 158, 11, ...)`.

### Step 3: Add a Dark CTA Button Variant
Add a `"dark"` variant to `button.tsx`: `bg-foreground text-background shadow-block hover:bg-foreground/90`. This replaces the `bg-[#212529] text-white` pattern used across hero CTAs.

### Step 4: Unify Primary Button Hover
Replace all `hover:bg-[#ca9a06]` with `hover:bg-primary/85` (or the button variant's built-in hover). Remove `shadow-[3px_3px_0px_#212529]` in favor of `shadow-block`.

### Step 5: Replace All Hardcoded Colors
Systematic replacement across all files:
- `bg-[#212529]` → `bg-foreground` (for CTA buttons, use the new dark variant)
- `text-[#212529]` → `text-foreground`
- `bg-[#f8f9fa]` → `bg-muted`
- `bg-[#fcfcfc]` → `bg-background`
- `text-gray-400` → `text-muted-foreground`
- `text-gray-500` → `text-muted-foreground`
- `border-gray-100` → `border-border`
- `hover:bg-[#ca9a06]` → `hover:bg-primary/85`
- `shadow-[3px_3px_0px_#212529]` → `shadow-block`
- `bg-white` (as page/card bg) → `bg-card` or `bg-background`

Files affected: `Index.tsx`, `Login.tsx`, `SignUp.tsx`, `ForgotPassword.tsx`, `Navbar.tsx`, `Footer.tsx`, `ClientPortal.tsx`, `AdminDashboard.tsx`, and any others found in search.

### Step 6: Fix Logo Consistency
- **SignUp.tsx** and **ForgotPassword.tsx**: Add `showText` to Logo so brand name appears alongside icon, matching Login page.

### Step 7: Dark Mode Navbar & Admin Header
- Navbar: `bg-white/90` → `bg-background/90`
- Admin header: `bg-white/80` → `bg-background/80`
- Divider in Login "or": `bg-white` → `bg-background`

### Step 8: Accessible Text-on-Gold
For the CTA banner section (`bg-primary`), ensure body text uses `text-primary-foreground` (dark) instead of `text-[#212529]/70`. Apply the existing `.text-primary-accessible` class wherever `text-primary` appears on white backgrounds, OR darken primary text color in the CSS variable approach.

### Step 9: Footer Token Alignment
Replace `bg-[hsl(222_47%_4%)]` with `bg-sidebar` (which maps to the same dark value). Replace `text-slate-*` variants with sidebar semantic tokens.

### Step 10: Verify & QA
Review all pages at desktop and mobile viewport for visual consistency, confirm dark mode renders correctly, and verify WCAG AA contrast on all interactive elements.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Fix `.glow-amber` colors |
| `src/components/ui/button.tsx` | Add `dark` variant |
| `src/components/Logo.tsx` | No changes needed |
| `src/components/Navbar.tsx` | Replace hardcoded colors, dark mode bg |
| `src/components/Footer.tsx` | Use sidebar tokens |
| `src/pages/Index.tsx` | Replace ~20+ hardcoded color instances |
| `src/pages/Login.tsx` | Replace hardcoded colors |
| `src/pages/SignUp.tsx` | Replace hardcoded colors, add `showText` to Logo |
| `src/pages/ForgotPassword.tsx` | Replace hardcoded colors, add `showText` to Logo |
| `src/pages/ClientPortal.tsx` | Replace hardcoded colors |
| `src/pages/admin/AdminDashboard.tsx` | Fix header dark mode |
| `src/components/ClientSidebar.tsx` | Minor token alignment |

**No functional or layout changes.** Only color token unification, contrast fixes, and dark mode readiness.

