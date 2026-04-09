

# Notary Personal Service Pages — Full Implementation Plan

## Summary
Build a multi-tenant personal notary service page system where each notary on the platform gets a public-facing micro-site (e.g., `/n/shane-goble`) with scheduling, about info, services, and signing integration. Super admin (you) has full control over all pages; notary users manage their own. Additionally, generate a comprehensive DOCX specification document.

---

## Architecture Overview

```text
/n/:slug              → Public notary page (no auth required)
/admin/notary-pages   → Super admin manages all notary pages
/portal (notary tab)  → Notary manages their own page settings

DB: notary_pages table → stores page config per notary
    ↕ joins profiles (commission, seal, credentials)
    ↕ joins platform_settings (global defaults)
```

---

## Phase 1: Database Migration

**New table: `notary_pages`**
- `id` UUID PK
- `user_id` UUID FK → profiles.user_id (notary owner)
- `slug` TEXT UNIQUE (URL-friendly: "shane-goble")
- `display_name`, `title`, `tagline`, `bio` TEXT
- `profile_photo_path`, `cover_photo_path` TEXT (storage refs)
- `phone`, `email`, `website_url` TEXT
- `service_areas` JSONB (array of counties/cities)
- `services_offered` JSONB (array of service objects)
- `credentials` JSONB (NNA, RON cert, commission info)
- `theme_color` TEXT (hex, default brand gold)
- `custom_css` TEXT (advanced)
- `signing_platform_url` TEXT (paste SignNow/other link)
- `use_platform_booking` BOOLEAN DEFAULT true
- `external_booking_url` TEXT
- `social_links` JSONB
- `seo_title`, `seo_description` TEXT
- `is_published` BOOLEAN DEFAULT false
- `is_featured` BOOLEAN DEFAULT false
- `created_at`, `updated_at` TIMESTAMPTZ

**RLS Policies:**
- Public SELECT where `is_published = true`
- Notary can SELECT/UPDATE their own row
- Admin can SELECT/UPDATE/INSERT/DELETE all rows

**Seed Shane Goble's page** via insert tool after migration.

---

## Phase 2: Public Notary Page (`/n/:slug`)

**New file: `src/pages/NotaryPage.tsx`** — ~600 lines

Sections (all data-driven from `notary_pages` + `profiles`):
1. **Hero Banner** — cover photo, profile photo, name, title, tagline, "Book Now" CTA
2. **About / Bio** — rich text bio, credentials badges (NNA, RON, Bonded, E&O)
3. **Services Grid** — cards for each offered service with pricing
4. **Service Area Map** — county list with Ohio focus
5. **Scheduling** — either embedded platform booking (reuse `BookAppointment` logic with `?notary=slug` param) or external link button
6. **Signing Portal** — "Sign Documents" button linking to `signing_platform_url` or integrated SignNow flow
7. **Contact Section** — phone, email, social links
8. **Credentials Footer** — commission number, expiration, bond info, seal image
9. **SEO** — dynamic meta tags, JSON-LD for LocalBusiness schema

**Route:** `/n/:slug` added to App.tsx (public, no auth)

---

## Phase 3: Notary Settings Panel

**New file: `src/pages/portal/PortalNotaryPageTab.tsx`**

For notary-role users in their portal:
- Live preview toggle (desktop/mobile)
- Edit all `notary_pages` fields via form
- Upload profile/cover photos to `documents` bucket
- Toggle services on/off
- Paste signing platform URL
- Toggle between platform booking vs external URL
- Publish/unpublish toggle
- Copy shareable link

---

## Phase 4: Super Admin Management

**New file: `src/pages/admin/AdminNotaryPages.tsx`**

For admin role:
- Table of all notary pages (published/draft, views)
- Create page for any notary user
- Edit any page (same form as notary portal)
- Feature/unfeature pages
- Override settings, force publish/unpublish
- Bulk actions

**Route:** `/admin/notary-pages` (adminOnly)

---

## Phase 5: Booking Integration

- Modify `BookAppointment.tsx` to accept `?notary=slug` query param
- When present, pre-select that notary and show their branding
- If `use_platform_booking = false`, redirect to `external_booking_url`

---

## Phase 6: Shane Goble's Page (Seed Data)

Pre-populate via database insert:
- slug: `shane-goble`
- Full bio, NNA credentials, Ohio commission details
- All current NotarDex services
- Brand colors matching NotarDex gold
- signing_platform_url from existing SignNow integration
- Published and featured

---

## Phase 7: DOCX Specification Document

Generate a comprehensive Word document at `/mnt/documents/notary-service-pages-spec.docx` containing:
- Feature overview and architecture diagrams
- Database schema documentation
- UI wireframes (text-based)
- All page sections with detailed specs
- Enhancement ideas (50+ future features)
- API integration details (SignNow, Stripe, Calendar)
- SEO and marketing strategy
- Mobile responsiveness requirements
- Accessibility compliance (WCAG 2.1 AA)
- Ohio compliance considerations

---

## Files Created/Modified

| Action | File |
|--------|------|
| Create | `supabase/migrations/xxx_notary_pages.sql` |
| Create | `src/pages/NotaryPage.tsx` |
| Create | `src/pages/portal/PortalNotaryPageTab.tsx` |
| Create | `src/pages/admin/AdminNotaryPages.tsx` |
| Modify | `src/App.tsx` (add routes) |
| Modify | `src/pages/ClientPortal.tsx` (add tab for notaries) |
| Modify | `src/pages/admin/AdminDashboard.tsx` (add sidebar link) |
| Modify | `src/pages/BookAppointment.tsx` (notary param support) |
| Create | `/mnt/documents/notary-service-pages-spec.docx` |
| Insert | Seed data for Shane Goble's page |

---

## Technical Details

- Uses existing `profiles` table for commission/credential data
- Leverages existing `documents` storage bucket for photos
- Reuses `PageShell`, `usePageMeta`, brand constants
- SignNow signing link integration via `signing_platform_url` field
- RLS via `has_role()` security definer function (already exists)
- Responsive design with Tailwind (mobile-first)

