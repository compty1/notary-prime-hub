

# Remaining Gaps & Completion Plan

After thorough review of the entire codebase, database schema, RLS policies, and all pages, here are the remaining gaps to finish the platform.

## Gaps Found

### 1. DB Trigger Still Missing
The `handle_new_user` trigger function exists but `<db-triggers>` shows "There are no triggers in the database." The migration to attach it may have failed or not run. Must re-attach.

### 2. Login Doesn't Redirect Notaries to Admin
`Login.tsx` only checks `isAdmin` for admin redirect. Notaries (`isNotary`) should also go to `/admin` since they have a limited admin panel.

### 3. Document Preview Missing
AdminDocuments and ClientPortal only show file names with download buttons. No inline preview for PDFs/images.

### 4. Notary RLS Gaps
- `chat_messages`: Notaries can't access chat at all (no notary policy)
- `appointments`: Notaries can SELECT but can't UPDATE status (needed to advance workflow)
- `documents`: Notaries have no access policies
- `apostille_requests`: No notary policy
- `audit_log`: No notary INSERT policy (notaries can't log actions)

### 5. Apostille Missing Client Selection
`AdminApostille` create dialog has no `client_id` field — inserts will fail since `client_id` is NOT NULL.

### 6. Email Management — No "Email Management" in Services Catalog
The client-facing email management service isn't in the services DB table, so clients can't discover or book it.

### 7. Notary Journal — Notary `created_by` Not Set
When a notary creates journal entries, the `created_by` field is set but there's no scoping — notaries see ALL journal entries (the `ALL` policy). Should be scoped to `created_by = auth.uid()`.

### 8. Storage Bucket RLS
The `documents` bucket is private but no storage policies are visible. Uploads may silently fail for non-admin users.

### 9. Realtime Not Enabled on `chat_messages`
Chat subscription uses `postgres_changes` but `chat_messages` is not added to `supabase_realtime` publication. Real-time updates won't work.

### 10. `isNotary` Not Used in Login Redirect
`AuthContext` exposes `isNotary` but Login.tsx only checks `isAdmin`.

---

## Implementation Plan (6 tasks)

### Task 1: Re-attach DB Trigger + Fix Notary RLS
**Migration:**
- Re-create trigger: `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()`
- Add notary policies for `documents` (SELECT), `appointments` (UPDATE for status changes), `audit_log` (INSERT)
- Scope notary journal policy to `created_by = auth.uid()` instead of blanket ALL
- Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages`
- Add storage policies for `documents` bucket (authenticated users upload to own folder, admins read all)

### Task 2: Fix Login Redirect for Notaries
- `src/pages/Login.tsx`: Change redirect logic to check `isAdmin || isNotary` → navigate to `/admin`

### Task 3: Add Document Preview
- `src/pages/admin/AdminDocuments.tsx`: Add a preview dialog that shows PDF in `<iframe>` or image in `<img>` using a signed URL from storage
- `src/pages/ClientPortal.tsx`: Same preview capability for client documents

### Task 4: Fix Apostille Client Selection
- `src/pages/admin/AdminApostille.tsx`: Add client dropdown to the create dialog, fetch profiles list for selection

### Task 5: Seed Email Management Service
- Insert "Email Management & Correspondence" into `services` table via insert tool so it appears on the public services page

### Task 6: Final Polish
- Fix `AdminApostille` to show client name instead of UUID
- Add notary chat policies so notaries assigned to conversations can participate
- Add `client_id` field validation in `AdminEmailManagement` create form

## Files to Modify
- `src/pages/Login.tsx` (redirect fix)
- `src/pages/admin/AdminDocuments.tsx` (preview dialog)
- `src/pages/ClientPortal.tsx` (preview dialog)
- `src/pages/admin/AdminApostille.tsx` (client selection)

## Database Changes
- 1 migration: trigger, RLS policies, realtime publication, storage policies
- 1 data insert: email management service into `services` table

