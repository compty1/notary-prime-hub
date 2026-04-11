

# Brand Theme Overhaul Plan: "Notar" Refresh

## Summary of Desired Theme (from attached PDFs/screenshots)

The target design shifts from the current **dark charcoal + gold "Block Shadow"** aesthetic to a **bright, warm, friendly** visual system characterized by:

- **Background**: Warm yellow/cream (#FFF9E6 to #FFFDF5) instead of near-white #fcfcfc
- **Primary color**: Warm golden-yellow (#F5C518 / hsl(48 91% 52%)) — brighter, more saturated than current amber
- **Accent sections**: Soft yellow panels (#FFF3CD / #FFECB3) for service cards and content blocks
- **Typography**: Clean sans-serif ("Open Sauce" / similar modern rounded sans) — NOT the current Georgia serif wordmark or Space Grotesk headers
- **Icons**: 3D illustrated icons (from Notar.pdf icon set) replacing flat Lucide line icons for feature/service cards
- **Logo**: Gold starburst/seal checkmark badge + "Notar" wordmark (clean sans-serif, not uppercase serif)
- **Cards**: Soft yellow backgrounds with rounded corners, NO block shadows
- **Buttons**: Dark (#1a1a1a) pill-shaped CTAs with white text, secondary outlined buttons
- **Overall feel**: Playful, modern, approachable — similar to Notion, Linear, or Canva marketing pages

## Technical Details

### Phase 1: Design Tokens & CSS Variables

**File: `src/index.css`**
- Update `:root` CSS variables:
  - `--background`: warm cream (48 100% 97%)
  - `--primary`: brighter yellow (48 91% 52%)
  - `--card`: white stays, but add warm yellow card variant
  - `--foreground`: keep dark (#1a1a1a)
  - `--muted`: warm cream tones instead of cool grays
  - `--accent`: warm yellow panel color
  - Remove `shadow-block` usage from base styles
  - Update dark mode variables to complement warm palette
- Update gradient utilities (`.bg-gradient-hero`, `.glass`, `.glass-card`) to warm yellow tones
- Replace `.geo-pattern` diagonal lines with softer dot pattern

**File: `tailwind.config.ts`**
- Update `fontFamily` — replace Space Grotesk/Georgia with a modern rounded sans (e.g., "DM Sans", "Inter", or "Plus Jakarta Sans" as primary for both headings and body)
- Remove `shadow-block` / `shadow-block-lg` box shadows
- Add softer shadow tokens (`shadow-soft`, `shadow-card`)
- Update `borderRadius.card` to larger value (28-32px)
- Adjust animation keyframes if needed

### Phase 2: Logo & Brand Identity

**File: `src/components/Logo.tsx`**
- Replace shield-keyhole icon with gold starburst/seal checkmark (from uploaded logo screenshot)
- Change wordmark from uppercase serif "NOTAR" to clean sans "Notar"
- Generate and save new logo icon asset

**File: `src/lib/brand.ts`**
- Update `name` to "Notar" (not "NotarDex")
- Update taglines and references

### Phase 3: 3D Icon Assets

- Extract all 3D icons from Notar.pdf (there are ~80+ icons)
- Copy key service/feature icons into `src/assets/icons-3d/`
- Create an icon mapping utility (`src/lib/icon3dMap.ts`) that maps service categories to their 3D icon asset paths
- These replace Lucide icons in: service cards, hero sections, feature grids, how-it-works steps

### Phase 4: Component Updates

**Buttons (`src/components/ui/button.tsx`)**
- Update `default` variant: dark bg (#1a1a1a), white text, pill-shaped (rounded-full), no block shadow
- Update `accent`/`dark` variants to match
- Add `secondary` outlined variant with rounded-full

**Cards (`src/components/ui/card.tsx`)**
- Default to softer shadows instead of block shadows
- Add `warm` variant with yellow/cream background

**Badge, Tabs, Accordion** — update to warm color palette

**Navbar (`src/components/Navbar.tsx`)**
- Light/white background with new logo
- Clean sans-serif navigation text

**Footer (`src/components/Footer.tsx`)**
- Update to warm dark or keep dark sidebar with warm accents

### Phase 5: Page-Level Updates

All pages using Lucide icons for service/feature display need 3D icon replacements:
- `src/pages/Index.tsx` — hero, services grid, how-it-works, testimonials
- `src/pages/Services.tsx` — service cards, AI tools section
- `src/pages/About.tsx` — team, values
- `src/pages/admin/AdminDashboard.tsx` — sidebar icons stay Lucide (functional), but dashboard cards get warm styling
- All solution pages (`ForHospitals`, `ForLawFirms`, etc.)
- `src/pages/ClientPortal.tsx`, `src/pages/BusinessPortal.tsx` — portal cards

### Phase 6: Dark Mode Adaptation
- Update `.dark` CSS variables to complement warm palette (warm dark navy/charcoal base with yellow accents preserved)

### Phase 7: CSV Audit & Tracking
- Generate comprehensive CSV at `/mnt/documents/brand_rebrand_audit.csv` listing every file, element, current style, target style, and status

## Deliverables

1. Updated CSS variables and Tailwind config
2. New logo component and assets
3. 3D icon assets extracted and mapped
4. All component variants updated
5. Page-level visual updates across ~30+ pages
6. Dark mode compatibility
7. Full audit CSV with implementation tracking

## What Will NOT Change
- All functionality, routing, data, database, edge functions, auth flows
- Lucide icons in admin sidebar navigation (functional, not decorative)
- Component logic and state management
- All API integrations and Supabase connections

