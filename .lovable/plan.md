

# Visual Rebrand + Service Badge Fix

## Summary
All previous plan items remain unchanged. This adds one fix: the "Notary action" badge on service detail workflow steps should only appear for notary-related services. Non-notary services should show "Provider action" instead.

## Existing Plan (unchanged)
1. **Logo.tsx** — bolder SVG strokes, better overlap geometry
2. **Navbar.tsx** — coral "Sign In" pill button
3. **index.css** — muted-foreground contrast, light-gray token
4. **Index.tsx** — hero contrast verification

## Added Change

### 5. `src/pages/ServiceDetail.tsx` — Conditional admin action badge text
- Line 677: Change the hardcoded `"Notary action"` badge to be conditional on the service category
- If `category` is `"notarization"` or `"authentication"`, keep **"Notary action"**
- For all other categories, display **"Provider action"**
- The service's `category` field is already fetched and available in the component state

### 6. `src/components/ServiceDetailPanel.tsx` — Same fix for panel badges
- Line 75: Change `"Admin Action"` to the same conditional logic
- This component receives `serviceId` but not category — will need to either pass `category` as a prop or keep as "Provider action" (since this panel is a secondary detail view)
- Simplest approach: add an optional `category` prop and default to "Provider action"

## Technical Detail
Notary-related categories: `"notarization"`, `"authentication"` — these are the two categories where a commissioned notary performs the action. All others (document_services, business, consulting, etc.) use third-party providers or internal staff.

