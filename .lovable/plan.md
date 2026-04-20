

## Fix remaining build-corruption from prior codemod

### Problem
The `autoComplete` codemod corrupted 18 JSX handler expressions across 27 files. SWC/Rolldown rejects them but `tsc` didn't catch them (because TS treats `=` as assignment then sees broken JSX). Pattern:

**Broken:** `onChange={e = autoComplete="email"> setEmail(e.target.value)}`
**Correct:** `onChange={(e) => setEmail(e.target.value)} autoComplete="email"`

Also a small number of `={() = aria-label="Action"> ...}` leftovers from the earlier aria-label codemod.

### Fix approach
1. Run a precise sed/Python codemod across the 27 affected files matching only these two corruption patterns:
   - `onChange={e = autoComplete="X"> BODY}` → `onChange={(e) => BODY} autoComplete="X"`
   - `onClick={() = aria-label="X"> BODY}` → `onClick={() => BODY} aria-label="X"`
2. Verify with `bun run build:dev` (must exit 0).
3. Verify with `grep` that zero corrupted patterns remain.

No new features, no theme changes — just unbreak the build. All previously-applied autoComplete and aria-label values are preserved (just moved to the correct attribute position).

### Files touched
27 files listed above (AccountSettings, Login, SignUp, RonSession, AdminClients, etc.).

