

# Plan: OneNotary Integration, Smart Booking Flow, Messaging Improvements, and Payment Management

This plan covers four distinct changes you requested:

---

## 1. Replace BlueNotary with OneNotary API Integration

OneNotary uses a REST API at `https://app.onenotary.us/api/v2` authenticated via `X-ONENOTARY-API-TOKEN` header. The integration flow is: create session, add participants (with signer email), add documents, init session (sends invite), then track status via webhooks.

### What changes

**New secret required**: `ONENOTARY_API_TOKEN` -- your Business Account API token from OneNotary.

**New edge function**: `supabase/functions/onenotary/index.ts`
- Proxy between your app and OneNotary API (create session, add participant, add document, init session, cancel session, get session info, get video/documents)
- Authenticated with your API token stored as a secret
- Endpoints: `POST /create`, `POST /add-participant`, `POST /add-document`, `POST /init`, `POST /cancel`, `GET /status`, `GET /video`, `GET /documents`

**New edge function**: `supabase/functions/onenotary-webhook/index.ts`
- Receives webhook callbacks from OneNotary for session status changes
- Verifies HMAC signature using your API token
- Updates `notarization_sessions` status and `appointments` status accordingly
- Handles key events: `completed_successfully` (mark appointment completed, create payment), `canceled`, `session_started`, `ready_to_start`

**Database migration**:
- Add `onenotary_session_id` column to `notarization_sessions` table (text, nullable)
- Add `participant_link` column to `notarization_sessions` (text, nullable -- stores the signer's join link)

**Rename/rewrite `BlueNotarySession.tsx`** to `OneNotarySession.tsx`:
- Admin view: Button to create OneNotary session via edge function, add client as primary_signer, upload linked documents, init session
- Client view: Shows their unique participant join link (from OneNotary API response) instead of an iframe
- Session status tracking synced via webhook updates to `notarization_sessions`
- Remove all references to `bluenotary_iframe_url` platform setting

**Update all references**:
- `App.tsx`: Change import and route from `BlueNotarySession` to `OneNotarySession`
- `AdminResources.tsx`: Update guide text from BlueNotary to OneNotary
- `AdminSettings.tsx`: Remove `bluenotary_iframe_url` setting, add OneNotary API token display/status
- `ClientPortal.tsx`: Update RON session link text
- `RonInfo.tsx`: Update any BlueNotary mentions

### Files affected
- New: `supabase/functions/onenotary/index.ts`, `supabase/functions/onenotary-webhook/index.ts`
- Rewrite: `src/pages/BlueNotarySession.tsx` -> `src/pages/OneNotarySession.tsx`
- Edit: `src/App.tsx`, `src/pages/admin/AdminResources.tsx`, `src/pages/admin/AdminSettings.tsx`, `src/pages/ClientPortal.tsx`, `src/pages/RonInfo.tsx`
- Migration: Add columns to `notarization_sessions`

---

## 2. Fix Booking Flow for Non-Notarial Services

Currently Step 1 of booking always asks "In-Person vs RON" even for services like "PDF Services" or "Email Management". Services in categories like `document_services`, `consulting`, `recurring`, `business`, `business_services`, and `verification` don't involve notarization and shouldn't show this choice.

### What changes

**`BookAppointment.tsx`**:
- After selecting a service in Step 2, check if the service's category is a notarization-requiring category (`notarization`, `authentication`)
- If the service doesn't require notarization, skip Step 1 entirely (default to `in_person` type) and change Step 1 title/options to be about "Service Delivery Method" rather than "Notarization Type"
- Alternatively, restructure the flow: Step 1 = Choose Service, Step 2 = Choose Type (only shown if service category requires notarization), Step 3 = Date/Time, Step 4 = Confirm
- Load service categories from DB alongside names so we can determine which flow to use

**`ServiceDetail.tsx`**:
- For non-notarial services, the "Book This Service" link should pass `&type=in_person` automatically, skipping the RON/in-person choice

---

## 3. Chat Messaging: Add User Selection for Recipients

Currently the client chat just sends messages to "the admin" with no ability to select who they're messaging. The admin chat groups by client but there's no way for clients to initiate conversations with specific team members.

### What changes

**`ClientPortal.tsx` chat tab**:
- Add a recipient selector at the top of the chat panel
- Query `user_roles` + `profiles` for users with `admin` or `notary` roles to populate the dropdown
- When sending a message, set `recipient_id` to the selected admin/notary user ID
- Filter displayed messages to show only the conversation with the selected recipient

**`AdminChat.tsx`**:
- Already groups by client and sets `recipient_id` -- no major changes needed
- Ensure admin replies properly set `recipient_id` to the client being viewed

**RLS on chat_messages**: Already allows users to view messages where they're the sender or where `is_admin = true`. The `recipient_id` filtering is done client-side. No RLS changes needed since admins have ALL access.

---

## 4. Client Payment Card Management (Stripe Integration)

For clients to add and manage payment cards, we need Stripe integration. This is the proper way to handle payment methods securely -- card data never touches your server.

### What changes

- Enable Stripe integration using the Stripe tool (requires your Stripe secret key)
- Create a Stripe Customer for each user (on signup or first payment interaction)
- Add a "Payment Methods" section to the Payments tab in ClientPortal showing saved cards
- Use Stripe's Setup Intent flow to securely add new cards
- Allow clients to set a default payment method and remove cards
- When appointments are completed, charge the saved payment method or mark for manual payment

This is a significant sub-project. The Stripe tool needs to be enabled first, after which detailed implementation steps will be available.

---

## Implementation Order

1. Request `ONENOTARY_API_TOKEN` secret from you
2. Create OneNotary edge functions + webhook handler
3. Database migration (add `onenotary_session_id`, `participant_link` columns)
4. Rewrite BlueNotary session page to OneNotary session page
5. Update all BlueNotary references across the codebase
6. Fix booking flow to be category-aware (skip RON choice for non-notarial services)
7. Add recipient selection to client chat
8. Enable Stripe and implement payment card management

