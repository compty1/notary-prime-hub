

## Fix All Current Errors

### Problem Identified

The `/digitize` page crashes with `Cannot read properties of null (reading 'useContext')` — a "duplicate React instance" error. This happens because **TipTap v3** (`@tiptap/react@^3.20.4`) bundles or resolves its own copy of React, which conflicts with the app's React 18. When `DocumentDigitize` is lazy-loaded, TipTap's internal React instance doesn't share the same context tree, causing `useAuth()` → `useContext()` to fail.

Other pages using `framer-motion` and `useAuth` work fine because they don't import TipTap.

### Fix

**Step 1 — Add React deduplication to Vite config**

In `vite.config.ts`, add `resolve.dedupe: ['react', 'react-dom']` to force Vite to resolve all React imports to a single copy. This is the standard fix for duplicate React in monorepo/multi-package setups.

```ts
resolve: {
  alias: { "@": path.resolve(__dirname, "./src") },
  dedupe: ['react', 'react-dom'],
},
```

**Step 2 — Verify no other pages are broken**

A quick scan of console logs and network requests shows no other runtime errors beyond the DocumentDigitize crash. All other routes (Index, templates, services, portal) are loading correctly based on the network request data.

### Technical Details

- Root cause: TipTap v3 packages resolve a separate `react` instance via Vite's dependency pre-bundling
- `resolve.dedupe` tells Vite to always use the root `node_modules/react`, preventing the split
- No database or edge function changes needed
- Single file edit: `vite.config.ts`

