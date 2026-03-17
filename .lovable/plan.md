

# Implementation Plan: OneNotary Migration + Booking Fix + Chat Recipients + Payments

## Overview
Four changes implemented in sequence. OneNotary API token will use a placeholder secret value so you can update it later.

---

## 1. OneNotary Integration (with placeholder API token)

### Database Migration
- Add columns to `notarization_sessions`: `onenotary_session_id` (text, nullable), `participant_link` (text, nullable)
- Remove/ignore the existing `bluenotary_session_url` column (leave it, just stop using it)

### Edge Function: `supabase/functions/onenotary/index.ts`
- Proxy to OneNotary API at `https://app.onenotary.us/api/v2`
- Uses `ONENOTARY_API_TOKEN` secret (will be set to placeholder `"REPLACE_ME"`)
- Actions: `create_session`, `add_participant`, `add_document`, `init_session`, `cancel_session`, `get_session`, `get_video`, `get_documents`
- CORS headers included
- JWT verification disabled in config.toml, auth checked in code

### Edge Function: `supabase/functions/onenotary-webhook/index.ts`
- Receives OneNotary webhook callbacks for session status changes
- Updates `notarization_sessions` status and `appointments` status
- Creates payment records on completion
- No JWT required (webhook endpoint)

### New Page: `src/pages/OneNotarySession.tsx` (replaces BlueNotarySession)
- **Admin/Notary view**: Create session, add participant (client email from profile), upload documents, initialize session. Shows session status and controls.
- **Client view**: Shows session checklist and participant join link (instead of iframe). Link opens OneNotary's signer experience in new tab.
- Keeps existing oath administration, voice notes, ID verification, KBA tracking, and finalization logic

### Reference Updates
- `App.tsx`: Import `OneNotarySession` instead of `BlueNotarySession`, keep route at `/ron-session`
- `AdminSettings.tsx`: Remove `bluenotary_iframe_url` setting references, add OneNotary status indicator
- `AdminResources.tsx`: Update guide text from BlueNotary to OneNotary
- `ClientPortal.tsx`: Update RON session link text
- `RonInfo.tsx`: Update any BlueNotary mentions

---

## 2. Smart Booking Flow for Non-Notarial Services

### `BookAppointment.tsx` Changes
- Fetch `category` alongside `name, short_description` from services table
- Store service categories in a `serviceCategories` map
- Define notarization-requiring categories: `notarization`, `authentication`
- When a service is selected in Step 2, check its category:
  - If NOT a notarization category → auto-set `notarizationType = "in_person"` and skip Step 1
  - Adjust step flow: show 3 steps instead of 4 for non-notarial services
- Step 1 title changes from "Select Notarization Type" to just "Service Delivery" when applicable

### `ServiceDetail.tsx` Changes
- Pass `&type=in_person` automatically for non-notarial service categories in booking link

---

## 3. Chat Recipient Selection

### `ClientPortal.tsx` Chat Tab
- Add state for `chatRecipient` (selected admin/notary user ID)
- Fetch admin/notary users: query `user_roles` for admin/notary roles, then fetch their profiles
- Add a `Select` dropdown above the chat area to pick recipient
- When sending messages, set `recipient_id` to selected recipient
- Filter displayed messages to show only the conversation with selected recipient
- Default to first available admin if none selected

### No admin chat changes needed — it already handles recipient_id properly.

---

## 4. Stripe Payment Management

### Enable Stripe
- Use `stripe--enable_stripe` tool to set up Stripe integration
- This will create the necessary edge functions for payment processing

### Edge Function: Payment methods management
- `create-setup-intent`: Creates a Stripe SetupIntent for adding cards
- `list-payment-methods`: Lists saved payment methods for a customer
- `delete-payment-method`: Removes a saved card
- `set-default-payment-method`: Sets default card

### Database Migration
- Add `stripe_customer_id` column to `profiles` table (text, nullable)

### `ClientPortal.tsx` Payments Tab
- Add "Payment Methods" section showing saved cards
- "Add Card" button opens Stripe Elements card form (using `@stripe/react-stripe-js`)
- Each card shows last 4 digits, brand, expiry with delete and set-default actions
- Cards section appears above existing payment history

---

## Implementation Order
1. Set placeholder `ONENOTARY_API_TOKEN` secret
2. Run DB migration (add columns to `notarization_sessions`, add `stripe_customer_id` to `profiles`)
3. Create OneNotary edge functions
4. Rewrite session page and update all references
5. Fix booking flow category logic
6. Add chat recipient selector
7. Enable Stripe and implement payment card management

---

## Files Created/Modified

**New files:**
- `supabase/functions/onenotary/index.ts`
- `supabase/functions/onenotary-webhook/index.ts`
- `src/pages/OneNotarySession.tsx`

**Modified files:**
- `src/App.tsx` — import/route change
- `src/pages/BookAppointment.tsx` — category-aware flow
- `src/pages/ClientPortal.tsx` — chat recipients + payment methods
- `src/pages/ServiceDetail.tsx` — auto type param
- `src/pages/admin/AdminSettings.tsx` — remove bluenotary setting
- `src/pages/admin/AdminResources.tsx` — text updates
- `src/pages/RonInfo.tsx` — text updates
- `supabase/config.toml` — edge function JWT settings

