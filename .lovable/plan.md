# Theme Migration: Notar Yellow + Dark Navy / Outfit + DM Sans

Replace the current pink/periwinkle "Notarize Now" palette with the attached yellow + dark navy theme, and switch typography from Montserrat/Fraunces to **Outfit** (headings) + **DM Sans** (body).

## Reference palette (from uploaded mockup)

| Brand role | Hex | HSL token value |
|---|---|---|
| Yellow (primary CTA) | `#FBBF24` | `45 96% 56%` |
| Yellow hover | `#F59E0B` | `38 92% 50%` |
| Dark (foreground / dark sections) | `#0F172A` | `222 47% 11%` |
| Slate (body text) | `#475569` | `215 25% 31%` |
| Light (page bg) | `#F8FAFC` | `210 40% 98%` |
| Border | `#E2E8F0` | `214 32% 91%` |
| Blue accent | `#3B82F6` | `217 91% 60%` |

## Token map (`src/index.css`)

Light:
- `--background 210 40% 98%` (was periwinkle)
- `--foreground 222 47% 11%`
- `--card 0 0% 100%`, `--card-foreground 222 47% 11%`
- `--primary 45 96% 56%`, `--primary-foreground 222 47% 11%`
- `--primary-glow 38 92% 50%`, `--primary-light 48 100% 92%`
- `--secondary 222 47% 11%`, `--secondary-foreground 0 0% 100%`
- `--accent 217 91% 60%`, `--accent-foreground 0 0% 100%`
- `--accent-warm 45 96% 56%`
- `--muted 210 40% 96%`, `--muted-foreground 215 25% 31%`
- `--border 214 32% 91%`, `--input 214 32% 91%`, `--ring 45 96% 56%`
- `--marketing-bg 222 47% 11%` (dark hero like mockup)
- `--app-bg 210 40% 98%`
- `--surface 0 0% 100%`, `--surface-muted 210 40% 96%`, `--border-subtle 214 32% 91%`
- `--mint 142 71% 45%` (kept for success accents)
- Sidebar: dark navy `222 47% 11%` bg, `0 0% 100%` fg, yellow primary, slate-700 accents.

Dark:
- `--background 222 47% 11%`
- `--foreground 210 40% 98%`
- `--card 217 33% 17%`
- `--primary 45 96% 56%` (yellow stays)
- `--accent 217 91% 60%`
- `--muted 217 33% 17%`, `--muted-foreground 215 20% 65%`
- `--border 217 33% 24%`, `--input 217 33% 20%`, `--ring 45 96% 56%`
- Sidebar: deeper navy `222 47% 6%`.

Keep success/warning/info/destructive untouched. Keep `--radius: 7px` (existing block-shadow motif).

## Typography

`src/index.css`:
- Replace Google Fonts import line with Outfit (500/600/700/800) + DM Sans (400/500/600/700).
- `--font-heading: 'Outfit', system-ui, sans-serif`
- `--font-body: 'DM Sans', system-ui, sans-serif`
- `--font-display: 'Outfit', system-ui, sans-serif` (alias so existing references resolve; drop Fraunces)
- Update `body { font-family: ... DM Sans }`, headings `Outfit`, `.font-heading/.font-body/.font-display` utility classes.

`tailwind.config.ts`:
- `sans: ['"DM Sans"', ...]`
- `heading: ['"Outfit"', ...]`
- `display: ['"Outfit"', ...]`
- `body: ['"DM Sans"', ...]`
- `mono` unchanged.

`index.html`:
- Replace existing Plus Jakarta / Space Grotesk / Lato `<link>` with Outfit + DM Sans stylesheet.
- Keep preconnects to `fonts.googleapis.com` / `fonts.gstatic.com`.

`src/lib/brand.ts` / `src/lib/brandConfig.ts`:
- Update `fonts.heading/body` to Outfit / DM Sans (mono unchanged).

`src/hooks/useBrandColors.ts`: no logic change — defaults flow from CSS vars.

## Hardcoded color audit (chrome only)

Touch only files that render app/marketing chrome. Do **not** modify design-studio / docudex / signature-generator / pdf-export modules — those colors belong to user-generated artifacts:

In-scope (replace `#xxxxxx`, `bg-[#…]`, inline `style={{color:'#…'}}` with semantic tokens like `bg-primary`, `text-foreground`, `bg-secondary`, `border-border`):
- `src/components/Hero3DAnimation.tsx`
- `src/components/ProcessGuide.tsx`
- `src/pages/admin/AdminNotaryPages.tsx`
- `src/pages/admin/AdminAutomatedEmails.tsx`
- `src/pages/admin/AdminSettings.tsx`
- `src/pages/admin/AdminDocuments.tsx`
- Any remaining `bg-[#…]` / `text-[#…]` hits inside `src/components/**` and `src/pages/**` (ripgrep sweep) excluding the out-of-scope list.

Out of scope (kept as-is — emit user/brand artifacts, not theme):
- `src/components/docudex/**`, `src/components/EmailTemplateDesigner.tsx`, `src/components/DocuDexEditor.tsx`, `src/components/InvoicePDFExport.tsx`, `src/components/NotarizationCertificate.tsx`, `src/components/SignatureGenerator.tsx`, `src/lib/emailTemplates.ts`, `src/lib/receiptGenerator.ts`, `src/pages/design/**`, `src/pages/enterprise/ExhibitStamper.tsx`, `src/components/design/ProductScene3D.tsx`, `src/components/ai-tools/ToolRunner.tsx`.

`src/lib/themeColors.ts` already reads CSS vars — auto-updates with new palette.

## Files changed (summary)

- `src/index.css` — palette + fonts (light + dark)
- `tailwind.config.ts` — fontFamily
- `index.html` — Google Fonts links + preload cleanup
- `src/lib/brand.ts`, `src/lib/brandConfig.ts` — font references
- ~6 chrome components/pages — swap hex → semantic tokens

## Verification

1. `npx tsc --noEmit` clean (auto build).
2. Spot-check Home, `/fee-calculator`, `/admin`, `/booking`, `/portal` in light + dark.
3. Confirm primary CTAs render yellow with dark text; hero/dark sections render navy `#0F172A`; sidebar dark navy with yellow active state; body uses DM Sans, headings Outfit.
4. Re-run `rg '#[0-9a-fA-F]{6}' src/components src/pages` excluding out-of-scope list — expect zero hits.

## Out of scope

- Re-rendering design-studio swatches, PDF/email artifact colors, 3D scene materials.
- Layout, spacing, or component restructure — colors + fonts only.
- Logo SVG asset replacement (existing logo retained).
