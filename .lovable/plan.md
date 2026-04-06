

# Updated Plan: Resolve Build Tracker Gaps + Fix Critical Runtime Errors & Broken Links

## Existing Plan (Preserved)

### Tier 1: Fix 27 High-severity items (code changes)
UX (10), edge_function (6), feature (5), devops (4), mobile (1), performance (1)

### Tier 2: Batch-resolve verified/non-actionable items
Bulk-mark duplicates, documentation, SEO, and testing items as resolved/deferred

### Tier 3: Medium-priority code fixes
Feature (99), UX (83), Security (23), Compliance (17), Data integrity (30), Accessibility (30), Testing (30 deferred)

### Tier 4: Low-severity items (271)
Bulk-resolve or defer

---

## NEW — Priority 0 Fixes (added above all tiers)

### Fix 0A: Services page crash — `useRef` null error (CRITICAL)

**Root cause**: `AnimatePresence mode="wait"` with `key={routeKey}` on `<Routes>` in `App.tsx` forces a full unmount/remount cycle on every navigation. When a lazy-loaded component (like `Services`) mounts during AnimatePresence's exit/enter transition, React's internal dispatcher can be null, causing `useSearchParams` → `useRef` to throw `Cannot read properties of null`.

**Fix**: Change `AnimatePresence` to not use `mode="wait"`, or remove the `key` prop from `<Routes>` so it doesn't force full tree remounts. The simplest reliable fix:

```tsx
// App.tsx — AnimatedRoutes function
// BEFORE:
<AnimatePresence mode="wait">
  <Routes location={location} key={routeKey}>
// AFTER:
<AnimatePresence mode="popLayout" initial={false}>
  <Routes location={location} key={routeKey}>
```

If that doesn't resolve it, remove `key={routeKey}` entirely — page transitions aren't worth a broken `/services` page.

**File**: `src/App.tsx` (lines 128-129)

### Fix 0B: Broken external social media links

These URLs in `Footer.tsx` likely point to non-existent pages:
- `https://www.facebook.com/notardex` → Verify or remove
- `https://www.linkedin.com/company/notardex` → Verify or remove  
- `https://g.co/kgs/notardex` → Verify or remove

**Fix**: Replace with verified URLs or remove until profiles are created. Add `rel="noopener noreferrer"` (already present) and a visual external-link indicator.

**File**: `src/components/Footer.tsx` (lines 98-102)

### Fix 0C: Broken Ohio SOS external links

The URL pattern `https://www.ohiosos.gov/notary/` is used across 8 files. The actual Ohio SOS site uses `/businesses/notary-public/` not `/notary/`. Several URLs need updating:

| Current URL | Likely correct URL |
|---|---|
| `ohiosos.gov/notary/` | `ohiosos.gov/businesses/notary-public/` |
| `ohiosos.gov/notary/forms/` | `ohiosos.gov/businesses/notary-public/forms/` or similar |
| `ohiosos.gov/notary/remote-online-notarization/` | Verify — may have moved |
| `ohiosos.gov/notary/education-providers/` | Verify |
| `ohiosos.gov/notary/notary-search/` | Verify |

**Fix**: Verify each URL (browser check), then update all references across:
- `src/pages/admin/AdminResources.tsx` (5 URLs)
- `src/pages/admin/AdminTemplates.tsx` (6 URLs)
- `src/pages/admin/AdminAppointments.tsx` (3 URLs)
- `src/pages/admin/AdminApostille.tsx` (2 URLs)
- `src/components/Footer.tsx` (1 URL)
- `src/components/ComplianceBanner.tsx` (1 URL)
- `src/pages/About.tsx` (1 URL)
- `src/pages/ServiceDetail.tsx` (1 URL)

### Fix 0D: Missing FullCalendar integration

Memory states a FullCalendar component was built, but `@fullcalendar` is NOT in `package.json`. The admin appointments page uses a basic custom grid.

**Fix**:
1. Install `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`
2. Create `src/components/FullCalendarView.tsx` — shared component with Month/Week/Day views
3. Integrate into `AdminAppointments.tsx` calendar view (replace custom grid)
4. Add read-only calendar to `PortalAppointmentsTab.tsx`

### Fix 0E: Verify all internal route links resolve

Multiple buttons across services route to pages like `/request`, `/subscribe`, `/mailroom`, `/digitize` which are behind `ProtectedRoute`. When unauthenticated users click these from the public services page, they'll hit an auth wall with no explanation.

**Fix**: In service card CTAs that route to protected pages, either:
- Show a login prompt/redirect with return URL
- Or indicate "Login required" on the button

**File**: `src/pages/Services.tsx` service card action buttons

---

## Execution Order

1. **Fix 0A** — Services page crash (unblocks all /services testing)
2. **Fix 0C** — Verify and fix Ohio SOS URLs (browser verification + bulk update)
3. **Fix 0B** — Social media links (verify or remove)
4. **Fix 0D** — FullCalendar installation and integration
5. **Fix 0E** — Protected route CTAs get login redirect
6. Continue with Tier 1–4 from original plan

## Files Modified
- `src/App.tsx` — AnimatePresence fix
- `src/components/Footer.tsx` — Social links
- `src/pages/admin/AdminResources.tsx` — External URLs
- `src/pages/admin/AdminTemplates.tsx` — External URLs
- `src/pages/admin/AdminAppointments.tsx` — External URLs + calendar
- `src/pages/admin/AdminApostille.tsx` — External URLs
- `src/components/ComplianceBanner.tsx` — External URL
- `src/pages/About.tsx` — External URL
- `src/pages/ServiceDetail.tsx` — External URL
- `src/pages/Services.tsx` — Auth-aware CTAs
- `src/pages/portal/PortalAppointmentsTab.tsx` — Calendar view
- `src/components/FullCalendarView.tsx` — New shared component
- `package.json` — FullCalendar dependencies

