

# Fix: Insert Missing Services into Database

## Problem
The Services page (`/services`) reads from the **`services` database table**, not from `src/lib/servicePricing.ts`. The new service lines (court form packages, real estate, legal support, print, subscriptions) were added to the static pricing file but never inserted into the database — so they don't appear in the catalog.

## Solution
Create a database migration that INSERTs all missing service lines from `servicePricing.ts` into the `services` table, covering these missing categories:
- **court_forms** (10 packages: divorce, custody, eviction, name change, guardianship, small claims, expungement, adoption, probate, civil protection order)
- **real_estate** (4 services: deed transfer, county recorder filing, title search, closing support)
- **real_estate_support** (4 services: property photography, lockbox, open house support, tenant docs)
- **legal_support** (4 services: process serving, skip tracing, court form prep, vital records)
- **print** (5 products: business cards, letterhead, notary stamp, folders, embosser)
- **subscription** (5 plans: starter, professional, enterprise, document vault, virtual mailroom)

Additionally, update `src/lib/serviceConstants.ts` to include the new category labels and ordering so tabs render correctly on the Services page.

## Files Modified
1. **Database migration** — INSERT ~32 new service rows with correct pricing, descriptions, icons, and categories
2. **`src/lib/serviceConstants.ts`** — Add new categories to `CATEGORY_LABELS`, `CATEGORY_ORDER`, and relevant service name sets (`INTAKE_ONLY_SERVICES`, etc.)

## Technical Details
- Each INSERT will map fields from `servicePricing.ts` to the `services` table schema (`name`, `category`, `description`, `short_description`, `price_from`, `price_to`, `pricing_model`, `icon`, `is_active`, `display_order`)
- Court form packages route to `/request` (intake-only), so their names get added to `INTAKE_ONLY_SERVICES`
- Subscription services route to `/subscribe`, so their names get added to `SUBSCRIPTION_SERVICES`

