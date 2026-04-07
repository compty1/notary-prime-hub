

# Plan: HubSpot Integration Fix + Remaining Gaps

## 1. Fix HubSpot Secret Name Mismatch (Critical)

**Problem**: The `hubspot-sync` edge function reads `Deno.env.get("HUBSPOT_API_KEY")` but the secrets you added are named `HubSpot_Service_Key` and `HubSpot_Developer_Key`. These names don't match, so the function always returns "HubSpot API key not configured."

**Fix**: Update `supabase/functions/hubspot-sync/index.ts` to read `HubSpot_Service_Key` (the private app token used for CRM API calls) instead of `HUBSPOT_API_KEY`. Add a fallback chain: try `HubSpot_Service_Key` first, then `HUBSPOT_API_KEY` for backwards compatibility.

Also update the AdminSettings UI text to reflect the actual secret names so there's no confusion.

## 2. Remove Redundant HubSpot Key Input from AdminSettings

The AdminSettings page has an input field for `hubspot_api_key` that saves to `platform_settings` table, but the edge function reads from environment secrets — not from the database. This input field is misleading.

**Fix**: Replace the manual key input in `AdminSettings.tsx` with a status indicator showing whether the backend secret is configured, plus the existing Test/Push/Pull buttons.

## 3. Verify FullCalendar Integration Works

The `FullCalendarView` component and its lazy imports in `AdminAppointments.tsx` and `PortalAppointmentsTab.tsx` are already in place. Confirm `@fullcalendar` packages are in `package.json`.

## 4. Continue Tier 1 High-Severity Gaps

Based on the existing plan, the remaining work from Tiers 1-4 includes edge function hardening, UX fixes, and security improvements. The Priority 0 items (crash fix, external links, calendar, auth-aware CTAs) are already implemented.

**Immediate next items from Tier 1**:
- Audit all edge functions for consistent CORS headers and error handling
- Ensure all admin pages with data tables handle empty states
- Verify ProtectedRoute redirect logic includes return URLs

---

## Technical Details

### Files Modified
| File | Change |
|---|---|
| `supabase/functions/hubspot-sync/index.ts` | Read `HubSpot_Service_Key` instead of `HUBSPOT_API_KEY` |
| `src/pages/admin/AdminSettings.tsx` | Remove misleading API key input; show connection status instead |

### Edge Function Change (hubspot-sync)
```typescript
// Before:
const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");

// After:
const HUBSPOT_API_KEY = Deno.env.get("HubSpot_Service_Key") || Deno.env.get("HUBSPOT_API_KEY");
```

### Execution Order
1. Fix HubSpot secret name mismatch in edge function
2. Update AdminSettings HubSpot section
3. Test HubSpot connection via Admin Settings
4. Continue with remaining Tier 1 gap fixes

