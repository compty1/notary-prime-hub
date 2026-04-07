

# Plan: Automated Emails Tab, FAQ Formatting, Contrast Fixes, and Brand Audit Remediation

## Problem Summary

1. **Navbar contrast failure**: "NotarDex" text uses `text-foreground` (dark slate) on a dark `bg-sidebar-background` navbar — invisible
2. **`--primary-foreground` is dark slate** (`222 47% 11%`), but it's used as text color on dark hero sections (RonInfo, BookAppointment, etc.) creating white-on-dark failures across ~31 files
3. **No "Automated Emails" tab** in Admin — services don't have per-service email template controls
4. **FAQ accordion titles** have default spacing from the accordion component that causes random word gaps in long titles
5. **Footer email** shows `shane@notardex.com` instead of `contact@notardex.com` (passed as prop)
6. **Multiple gaps from previous waves** remain unimplemented (service flow testing, brand consistency)

---

## Part 1: Fix Global Contrast Issues

### 1A. Fix `--primary-foreground` token conflict

The root issue: `--primary-foreground` is meant for text ON amber buttons (dark on amber = correct), but it's also wrongly used on dark hero backgrounds where white text is needed. The fix:

- Keep `--primary-foreground: 222 47% 11%` (correct for amber button text)
- **Search-and-replace** all instances where `text-primary-foreground` is used on dark backgrounds (`bg-gradient-hero`, `bg-sidebar-background`, dark sections) to use `text-white` instead
- Key files: `RonInfo.tsx` (hero h1/p), `AppointmentConfirmation.tsx`, and ~10 other pages where `bg-primary text-primary-foreground` badges are used (these are fine — amber bg + dark text is correct)

### 1B. Fix Navbar logo text contrast

In `Navbar.tsx` line 100: the inline `<span>` already uses `text-white` — correct. But the `Logo` component's `textColorClass` defaults to `text-foreground` when no theme prop is passed. The navbar doesn't pass `theme="dark"`.

**Fix**: In `Navbar.tsx`, the Logo is only used as an icon (no text), and the adjacent `<span>` correctly uses `text-white`. However, the Logo `showText` instances elsewhere may have this issue. Audit all `<Logo showText ...>` usages.

### 1C. Fix hero sections using dark text on dark backgrounds

Files to fix:
- `RonInfo.tsx`: Change `text-primary-foreground` to `text-white` in hero h1/p (lines 143, 146)
- `NotaryProcessGuide.tsx`, `NotaryGuide.tsx`: Audit hero sections
- `LoanSigningServices.tsx`, `ForHospitals.tsx`, `ForLawFirms.tsx`, `ForRealEstate.tsx`, `ForSmallBusiness.tsx`, `ForNotaries.tsx`, `ForIndividuals.tsx`: Audit all pages with `bg-gradient-hero`

### 1D. Fix CTA banner section

In `Index.tsx` line 454: `text-primary-foreground` on `bg-gradient-to-br from-primary to-primary-glow` (amber background) — this one is actually correct (dark text on amber). Verify contrast ratio is sufficient.

---

## Part 2: Automated Emails Tab in Admin Email Management

Add a 4th tab "Automated Emails" to `AdminEmailManagement.tsx`.

### Features
- **Service-linked email templates list**: Query `services` table, display each service with its email template config (from `email_templates` jsonb column)
- **Bulk selection**: Checkbox per row + "Select All" header checkbox
- **Per-service email controls**: Toggle on/off for booking confirmation, reminder, follow-up, and completion emails
- **Rich text editing**: Integrate a simplified rich-text editor (reuse existing `RichTextEditor.tsx` component) for editing email body templates per service
- **AI auto-generation**: "Generate with AI" button that calls the `notary-assistant` edge function to generate email template content based on service name/description. Works with bulk selection (generate for all selected services)
- **Bulk actions bar**: When items are selected, show a floating bar with: "Enable All", "Disable All", "Generate All", "Reset to Default"
- **Save/preview**: Save button persists to `services.email_templates` jsonb column; preview button renders a sample

### Implementation
- New component: `AdminAutomatedEmails.tsx` within the email management page
- Queries `services` table for all services with their `email_templates` column
- Updates via `supabase.from("services").update({ email_templates: {...} }).eq("id", id)`
- Uses `RichTextEditor` for body editing
- AI generation via `supabase.functions.invoke("notary-assistant", { body: { prompt: ... } })`

---

## Part 3: Fix FAQ Formatting

### Issue
AccordionTrigger titles in FAQ sections show unnatural word spacing on some browsers/screen sizes.

### Fix
- In the `AccordionTrigger` component (`accordion.tsx`), the default `justify-between` layout combined with `flex-1` can cause text to stretch. Add `text-left` and ensure proper `gap` between text and chevron.
- In all FAQ usages (`Index.tsx`, `RonInfo.tsx`, `HelpSupport.tsx`, etc.), ensure question text is wrapped properly with no extra whitespace in the data strings.
- Add `whitespace-normal break-words` to AccordionTrigger className defaults.

---

## Part 4: Brand & Design Audit

### Confirmed issues to fix:
1. **Navbar "NotarDex" invisible** — dark text on dark bg (Part 1B above)
2. **RonInfo hero** — dark text on dark gradient (Part 1C)
3. **Footer email** defaults to `contact@notardex.com` in props but the actual footer in the screenshot shows `shane@notardex.com` — check if `platform_settings` is overriding it. The Footer component default is correct. This is likely a data issue in the `platform_settings` table.
4. **Amber text on white** — `text-primary` (amber-500) on white background has ~3.0:1 contrast ratio, below WCAG AA (4.5:1). For small text labels, darken to amber-600/700 or use amber as accent only with dark body text.
5. **Link colors** — amber links on white may fail contrast. Add `hover:text-amber-600` and ensure base link color is sufficiently dark.

### Recommendations (to implement):
- Add a `.text-primary-dark` utility for contexts where amber needs to be used on white — maps to amber-700 (`38 92% 35%`)
- Update all "Learn more" / inline links to use `text-primary-dark` instead of `text-primary` for WCAG AA compliance
- Ensure all Badge components with `bg-primary/10 text-primary` have sufficient contrast (currently borderline)

---

## Part 5: Remaining Gap Verification

### Service flow testing
- AdminServices already has full CRUD. Add a "Test Flow" button per service that opens the booking page filtered to that service, verifying the complete funnel.

### Service email template integration
- The `services` table has an `email_templates` jsonb column (from memory). The new Automated Emails tab (Part 2) addresses this.

---

## Files Modified

| File | Change |
|---|---|
| `src/index.css` | Add `.text-primary-dark` utility |
| `src/components/ui/accordion.tsx` | Fix trigger text spacing |
| `src/components/Navbar.tsx` | Verify logo text contrast |
| `src/components/Logo.tsx` | No changes needed (theme prop works) |
| `src/pages/RonInfo.tsx` | Fix hero text from `text-primary-foreground` to `text-white` |
| `src/pages/admin/AdminEmailManagement.tsx` | Add "Automated Emails" tab |
| New: `src/pages/admin/AdminAutomatedEmails.tsx` | Full automated email management component |
| ~10 solution/guide pages | Audit and fix dark-hero contrast classes |
| `src/components/Footer.tsx` | No code change needed (data issue) |

## Execution Order
1. Global contrast fixes (immediate visual impact)
2. AccordionTrigger spacing fix
3. Automated Emails tab (new feature)
4. Brand audit remaining items

