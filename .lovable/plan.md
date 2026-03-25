

# Visual Theme Overhaul — Clinical High-Tech Aesthetic

Retheme the entire application to match the provided brand guidelines: a clean, light, clinical interface with navy/blue/cyan accents, Inter + Fira Code typography, and the new gradient logo mark. No functionality changes.

---

## Summary of Changes

**From**: Dark electric blue-violet glassmorphism with Space Grotesk / DM Sans / JetBrains Mono
**To**: Light clinical surfaces with navy (#0F172A), trust blue (#2563EB), tech cyan (#06B6D4), slate (#64748B), Inter sans-serif, Fira Code monospace

---

## Files to Modify

### 1. Font & CSS Variables — `index.html` + `src/index.css`
- Replace Google Fonts import: `Inter:wght@300;400;600;800` + `Fira Code:wght@400;500`
- Update all CSS custom properties:
  - Light: background `210 40% 98%` (#F8FAFC), foreground navy `222 47% 11%` (#0F172A), primary blue `217 91% 60%` (#2563EB), accent cyan `192 91% 42%` (#06B6D4), muted slate `215 16% 47%` (#64748B)
  - Dark: keep dark mode but shift to navy-based palette instead of violet
- Replace gradient utilities: `bg-gradient-hero` becomes a light gradient with subtle blue wash, `bg-gradient-primary` becomes blue→cyan
- Update glass utilities to match lighter style: `rgba(255,255,255,0.9)` + subtle border
- Add scanline animation keyframe from brand guidelines

### 2. Tailwind Config — `tailwind.config.ts`
- Font families: `sans: ['"Inter"', 'system-ui', 'sans-serif']`, `mono: ['"Fira Code"', 'monospace']`
- Remove `display` font family (Inter serves both heading and body)
- Keep all existing keyframes/animations, adjust `glow-pulse` to use blue instead of violet

### 3. Logo — `src/components/Logo.tsx`
- Replace SVG: rounded-lg square with blue→cyan gradient background, centered white "N" letter (clean sans-serif, not stroked paths)
- Text shows "Notar" (keep existing brand name)

### 4. Navbar — `src/components/Navbar.tsx`
- No structural changes, just inherits new theme via CSS variables
- Brand text already uses `font-display` → will become Inter via removal of display font

### 5. Hero Section — `src/pages/Index.tsx`
- Change hero from `bg-gradient-hero` (dark) to light background with subtle blue wash
- Text colors: headings become navy, subtext becomes slate
- Pill toggle: light glass style instead of dark `bg-white/10`
- Trust badges: navy/blue borders instead of white/10
- Keep all animations (blurIn, fadeUp, scaleReveal, AnimatedCounter)

### 6. Footer — `src/components/Footer.tsx`
- Inherits new palette via CSS variables; `font-display` references become Inter automatically

### 7. Global class reference updates
- Replace all `font-display` with `font-sans` (since Inter handles both) across ~67 files
- Replace `font-mono-accent` with `font-mono`
- `text-gradient-primary` utility: update gradient from violet to blue→cyan
- Cards get `interactive-card` hover behavior (translateY(-6px) + blue border glow)

### 8. Admin & Portal pages
- All admin pages inherit new colors via CSS variables — no individual file changes needed for basic theming
- Badge color utilities in `src/lib/statusColors.ts` keep their semantic colors (green/amber/red) — only primary accent shifts

### 9. Login/SignUp pages
- Background gradient shifts from violet to blue tint
- Button gradients become blue→cyan

---

## Technical Details

### CSS Variable Mapping (Light Mode)
```
--background: 210 40% 98%    /* #F8FAFC */
--foreground: 222 47% 11%    /* #0F172A */
--primary: 217 91% 60%       /* #2563EB */
--primary-glow: 192 91% 42%  /* #06B6D4 (cyan) */
--muted-foreground: 215 16% 47%  /* #64748B */
--border: 214 32% 91%        /* #E2E8F0 */
```

### CSS Variable Mapping (Dark Mode)
```
--background: 222 47% 11%    /* #0F172A navy */
--foreground: 210 40% 98%    /* #F8FAFC */
--primary: 217 91% 65%       /* lighter blue */
--primary-glow: 192 91% 50%  /* brighter cyan */
```

### Font Stack Change
```
sans: Inter (headings + body)
mono: Fira Code (technical accents, step numbers)
No separate display font needed
```

### Files touched (~12 core + bulk class rename across ~60 files)
- `index.html` — font links
- `src/index.css` — variables, utilities, gradients
- `tailwind.config.ts` — fonts, animation colors
- `src/components/Logo.tsx` — new SVG
- `src/pages/Index.tsx` — hero styling
- All files with `font-display` → `font-sans` (search-replace)
- All files with `font-mono-accent` → `font-mono` (search-replace)

