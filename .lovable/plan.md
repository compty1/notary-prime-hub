
## Updated plan: fix the Services page first, then finish the remaining approved work

### What I confirmed
- The database is **not empty**: there are **46 active services** in the backend.
- Public read access on `services` is already allowed by policy.
- In the preview, the page stays on the **loading skeleton** under the category tabs.
- There are **no visible data requests** for the services query from the page, which means the current client-side fetch path is hanging before it completes.

## Root issue to fix
`src/pages/Services.tsx` is using the shared authenticated client for a **public catalog** query. Because the app also restores user sessions and refreshes tokens, this public services request appears to be getting stuck behind auth/session state in some cases, so `loading` never flips off.

## Implementation plan

### 1. Replace the current services loader with a resilient public fetch
**File:** `src/pages/Services.tsx`

- Remove the current fragile `supabase.from("services")...` loading path for this page.
- Replace it with a **public REST fetch** to the backend using:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Query only active services and order by `display_order,name`.
- Add an explicit timeout with `AbortController`.
- Always clear loading in success, failure, and timeout cases.
- Keep the page public and independent from session refresh state.

Why: this page is a public catalog and should not depend on the signed-in client session at all.

### 2. Add a hard loading fail-safe
**File:** `src/pages/Services.tsx`

- Add a fallback timer so the page cannot stay in skeleton mode forever.
- If the request exceeds a short threshold, show the retry/error state instead of infinite loading.
- Log the actual failure reason to the console for debugging.

### 3. Normalize category rendering so cards cannot disappear silently
**File:** `src/pages/Services.tsx`

- Move category labels/order and CTA routing to the shared `src/lib/serviceConstants.ts`.
- Ensure any returned service with an unexpected category is still shown in a fallback group instead of being dropped.
- Keep `?category=` deep-link support working.

### 4. Finish the incomplete CTA rename on the Services page
**File:** `src/pages/Services.tsx`

- Change the service card default CTA from **“Book Now”** to **“Notarize Now”**.
- Update the bottom CTA section from **“Book Appointment”** to the approved naming.

### 5. Re-test the exact failure path
After the fix, verify:
- `/services` loads actual cards on first visit
- cards still load when signed in
- cards still load after refresh
- `/services?category=notarization` deep-links correctly
- retry works if the request fails

## Remaining approved items to keep in scope after this blocker
Once the Services page is fixed, continue finishing any still-incomplete approved items:
- admin “Send to Client” delivery action verification
- completion email template verification
- RON completion/download/storage flow verification
- final navigation/footer consistency pass

## Technical notes
- The backend data and RLS are already correct; this is a **frontend loading-path problem**, not a missing-data problem.
- The strongest fix is to decouple the public services catalog from auth-driven client state.
- I would keep the existing authenticated client for protected pages, but use a dedicated public fetch path for this one catalog page.
