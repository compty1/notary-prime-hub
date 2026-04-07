

# Plan: UI/UX Bug Fixes (Gaps 46–85)

## Audit of Actual Status

After code review, several items from the 200-gap list are **already fixed** and will be skipped:
- Bug 49 (hamburger close): Already handled in Navbar.tsx line 89-91
- Bug 50 (dark mode flash): Inline script in index.html line 123
- Bug 72 (reduced motion): Handled in animations.ts + 3 CSS blocks
- Bug 73 (portal tab URL): ClientPortal.tsx line 318-320 updates `searchParams`
- Bug 75 (ErrorBoundary retry): Has "Try Again" button, lines 54-62
- Bug 85 (print stylesheet): Exists in index.css lines 379-396

**22 genuine fixes remain.** Grouped into 8 implementation batches:

---

## Batch 1: Image & Loading Robustness (Bugs 46, 71)

**File: `src/pages/Index.tsx`**
- Add `onError` fallbacks on `heroBackground` and `stepProcessImg` `<img>` tags — hide or swap to gradient placeholder
- Add a loading skeleton wrapper for the Index page hero section

---

## Batch 2: Mobile Layout Fixes (Bugs 57, 78)

**File: `src/components/BackToTop.tsx`**
- Increase bottom offset on mobile to avoid overlap with MobileFAB (currently `bottom-6 right-4`, MobileFAB is `bottom-[7.5rem] right-5`)
- Change to `bottom-[11rem]` on mobile to stack above MobileFAB

**File: `src/pages/RonSession.tsx`**
- Add responsive classes to the 3-column layout so columns stack vertically below `lg` breakpoint instead of overflowing

---

## Batch 3: PageShell Conditional Chatbot (Bug 76)

**File: `src/components/PageShell.tsx`**
- Conditionally render `AILeadChatbot` only on public pages (not admin routes)
- Check `useLocation().pathname` — skip chatbot if path starts with `/admin` or `/portal`

---

## Batch 4: Empty States & Skeletons (Bugs 52, 61, 77)

**File: `src/pages/ClientPortal.tsx`**
- Add `<EmptyState>` component for zero-appointment overview tab with CTA to book

**File: `src/pages/admin/AdminDashboard.tsx` or `AdminOverview.tsx`**
- Make stat cards clickable links to their respective admin pages

**File: `src/pages/admin/AdminAppointments.tsx`**
- Add `AdminLoadingSkeleton` while data is loading

---

## Batch 5: Form & Validation Fixes (Bugs 48, 59, 62, 63)

**File: `src/pages/booking/BookingIntakeFields.tsx`**
- Add inline validation errors for required fields on blur (not just on submit)

**File: Various Select components**
- Add `required` attribute and placeholder text like "Select an option" on required Select fields

**File: Various admin pages with delete actions**
- Audit and add `AlertDialog` confirmation for any destructive button missing it

**File: `src/components/ai-tools/ToolRunner.tsx` and other upload zones**
- Add visual drag indicator (border color change, icon) during `onDragOver`

---

## Batch 6: Admin Search & Timezone (Bugs 83, 84)

**File: `src/pages/admin/AdminClients.tsx`, `AdminAppointments.tsx`**
- Normalize search to `.toLowerCase()` for case-insensitive matching

**File: Various appointment display components**
- Append timezone indicator (e.g., "EST") to scheduled time displays using `Intl.DateTimeFormat`

---

## Batch 7: QR Code Context & Breadcrumb Fix (Bugs 80, 82)

**File: `src/pages/ClientPortal.tsx`**
- Add description text below QR code explaining: "Scan to upload documents from your phone"

**File: `src/components/Breadcrumbs.tsx`**
- Add nested admin route labels: `docudex-pro`, `ai-assistant`, `build-tracker`, `overview`, `performance`, `webhooks`, `task-queue`, `process-flows`, `content-workspace`, `compliance-report`

---

## Batch 8: Misc UI Fixes (Bugs 53, 54, 56, 60, 70)

**File: `src/index.css`**
- Add admin sidebar scroll fix: ensure last nav items are accessible via `overflow-y: auto` + padding-bottom

**File: `src/components/CommandPalette.tsx`**
- Add a visible "Search" button in mobile navbar that opens the command palette (alternative to keyboard shortcut)

**File: Toast configuration**
- Set `visibleToasts` limit (e.g., 3) on the Toaster/Sonner provider

**File: Document list displays**
- Add status badge styling differentiation (draft = muted outline, uploaded = blue, approved = green, notarized = amber)

**File: Upload components**
- Show upload percentage via `XMLHttpRequest` progress events where Supabase storage upload is used

---

## File Summary

| File | Changes |
|---|---|
| `src/pages/Index.tsx` | Image `onError` fallback, hero loading skeleton |
| `src/components/BackToTop.tsx` | Mobile position adjustment |
| `src/pages/RonSession.tsx` | Responsive 3-column stacking |
| `src/components/PageShell.tsx` | Conditional chatbot rendering |
| `src/pages/ClientPortal.tsx` | Empty state, QR description |
| `src/pages/admin/AdminAppointments.tsx` | Loading skeleton, case-insensitive search |
| `src/pages/admin/AdminClients.tsx` | Case-insensitive search |
| `src/pages/admin/AdminOverview.tsx` | Clickable stat cards |
| `src/pages/booking/BookingIntakeFields.tsx` | Inline field validation |
| `src/components/Breadcrumbs.tsx` | Admin route labels |
| `src/components/CommandPalette.tsx` | Mobile trigger button |
| `src/components/ai-tools/ToolRunner.tsx` | Drag-and-drop indicator |
| `src/index.css` | Admin sidebar scroll fix, toast limit |
| `src/App.tsx` | Toast `visibleToasts` config |

