

# Visual Rebrand — Match New Brand Identity + Hero Button Updates

## Summary
Update the logo, color theme, and visual accents across the entire app to match the new brand identity, plus update hero section CTAs.

## Color Palette Change

| Token | New Value | Source |
|-------|-----------|--------|
| `--primary` | `181 71% 41%` | #1eaeb2 teal |
| `--foreground` | `216 79% 30%` | #103b87 dark blue |
| `--accent` | `0 100% 71%` | #ff6b6b coral |

Dark mode values adjusted proportionally.

## Changes

### 1. `src/components/Logo.tsx` — New SVG mark + "Notar." wordmark
- Three overlapping rounded strokes forming an architectural "N": teal diagonal, dark blue left stem, mint right stem
- "Notar." text with coral period
- Support `size`, `showText`, `theme` props

### 2. `src/index.css` — Updated CSS custom properties
- Update `:root` and `.dark` with new palette
- Update gradient classes to use new colors

### 3. `src/components/Navbar.tsx` — Logo integration
- Use `<Logo showText />` instead of separate icon + text span

### 4. `src/components/Footer.tsx` — Logo integration
- Same pattern as Navbar

### 5. `src/pages/Index.tsx` — Hero button changes
- Rename "Get Started Free" button to **"Online Notarization"**
- Add a second button next to "Notarize Now" labeled **"Other Services"** linking to `/services`

### 6. `src/pages/ComingSoon.tsx` — Logo integration
- Use updated `<Logo showText />` component

## What Does NOT Change
- Page content, routing, functionality, database, edge functions
- Typography (Space Grotesk + Lato)
- Layout structure, spacing, animations

