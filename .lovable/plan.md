# Global Theme Refresh: "Notarize Now" Look

Apply the visual language from the uploaded reference (periwinkle background, lime tag chips, bold black display type on white rounded cards, pink CTAs, dark navy footer/sidebar) across the entire build, and fix the underlying reasons hard-coded styles currently override the theme.

## New palette (HSL tokens)

| Token | Light | Role |
|---|---|---|
| `--background` | `230 90% 75%` | Periwinkle page bg |
| `--foreground` | `225 40% 12%` | Near-black ink |
| `--card` | `0 0% 100%` | White rounded cards |
| `--card-foreground` | `225 40% 12%` | |
| `--primary` | `330 80% 82%` | Pink CTA |
| `--primary-foreground` | `225 40% 12%` | Black text on pink |
| `--secondary` | `45 95% 55%` | Marigold accent panel |
| `--accent` | `75 90% 70%` | Lime chip / tag highlight |
| `--accent-foreground` | `225 40% 12%` | |
| `--muted` | `230 50% 92%` | Soft surface |
| `--border` | `225 40% 12%` | High-contrast block borders |
| `--ring` | `330 80% 70%` | |
| `--sidebar-background` | `225 50% 10%` | Navy footer/sidebar |
| `--sidebar-foreground` | `45 30% 92%` | |
| `--radius` | `1.25rem` | Larger pill/card radius |

Dark mode mirrors with deeper navy bg + same pink/lime accents.

Add semantic helpers:
- `.tag-chip` — lime pill with black border + bold label (matches "FROM ANYWHERE IN THE U.S.")
- `.block-card` — white card, 24–28px radius, 2px black border, soft block shadow
- `.cta-pink` button variant on `Button` via `cva` for the pink action style
- Updated `shadow-block` / `shadow-block-lg` tokens to use black-tinted offsets (matches block-shadow motif from memory)

## Typography

- Keep Montserrat but raise display weight to `font-black` for hero/section titles (already aligned with Block Shadow memory).
- Add `--font-display` mapping for oversize hero numerals/headlines.

## Why the theme doesn't currently apply everywhere — and the fixes

1. **Hard-coded Tailwind palette classes** (`bg-white`, `bg-blue-500`, `text-yellow-400`, etc.) in ~80 files override semantic tokens.
   - Fix: codemod sweep replacing the common offenders with semantic equivalents (`bg-card`, `bg-primary`, `text-accent-foreground`, etc.). High-traffic targets first: `Hero*`, `Logo`, `*Designer` pages, admin shells, portal tabs, DocuDex toolbars.
2. **Hex literals in component files** (`#1a1a2e`, `#F59E0B`, etc.) — e.g. `DocuDexBrandKit`, `HeroPhoneAnimation`, `RevenueByServiceChart`, designers, certificate/PDF generators.
   - Fix: replace with `hsl(var(--token))` in JSX/CSS; for canvas/PDF/Recharts where strings are required, read from a new `src/lib/themeColors.ts` that resolves CSS custom properties at runtime.
3. **`useBrandColors` hook clears tokens on unmount** (`removeProperty('--primary')` etc.), which can wipe the theme during navigation/HMR.
   - Fix: remove the cleanup or re-apply defaults instead of removing.
4. **Dual brand sources** (`brand.ts` + `brandConfig.ts` + `DocuDexBrandKit` defaults) drift from `index.css`.
   - Fix: single source of truth — extend `BRAND_CONFIG.palette` to point at the new tokens and update `DEFAULT_KIT` / DocuDex defaults to read from it.
5. **`public/favicon.svg` and `Logo.tsx`** hard-code old gold/charcoal.
   - Fix: regenerate favicon with new pink + navy + lime palette; logo gets a navy badge with lime check.
6. **Shadcn primitives** (`card.tsx`, `button.tsx`, `badge.tsx`, `toast.tsx`) carry baseline radii/shadows that fight the new "block" look.
   - Fix: bump base radius to `rounded-[24px]`, add 2px border on Card, add `pink` and `lime` Button variants, ship `tag` Badge variant.
7. **Designer/PDF modules** (`*Designer.tsx`, `InvoicePDFExport`, `NotarizationCertificate`, `receiptGenerator`) ship their own palettes used in print.
   - Fix: refactor to import from the new `themeColors.ts` so print/digital stay in sync.
8. **Admin status color maps** (`statusColors.ts`, `crmAutoTagging.ts`, `appointmentStateMachine.ts`) use Tailwind palette names.
   - Fix: map to semantic tokens (`success`, `warning`, `info`, `destructive`, `accent`) which already exist.

## Implementation steps

1. Rewrite `:root` and `.dark` blocks in `src/index.css` with the new tokens above; update `--radius`, shadows, and add `.tag-chip` / `.block-card` utilities.
2. Update `tailwind.config.ts` `boxShadow.block*` to black-tint and add `pink`, `lime` color aliases pointing at semantic tokens (so existing `bg-pink`/`bg-lime` references map cleanly if needed).
3. Patch `src/hooks/useBrandColors.ts` to stop wiping CSS vars on cleanup.
4. Add `src/lib/themeColors.ts` exposing `getCssVarHsl(name)` for canvas/Recharts/PDF.
5. Update shadcn `Card`, `Button` (add `pink`, `lime`, `cta` variants), `Badge` (`tag` variant), `Toast` to new radius/border.
6. Refresh `Logo.tsx` (navy badge + lime check) and `public/favicon.svg`.
7. Sweep hard-coded color classes/hex across the file list under "Why the theme doesn't currently apply" — prioritize `src/pages/Index.tsx`, hero/landing components, navigation header, footer, admin sidebar, designer pages, DocuDex shell.
8. Update `BRAND_CONFIG.palette` and `DocuDexBrandKit` `DEFAULT_KIT` to the new colors.
9. Quick QA: load `/`, `/admin`, `/docudex`, a designer page, `/login` — verify no rogue old-gold or charcoal surfaces remain.

## Out of scope

- Copy/content changes (headlines, hero text)
- Layout restructuring beyond what radius/border tweaks imply
- Replacing Montserrat or adding new fonts
- Editing legal/PDF document text content
