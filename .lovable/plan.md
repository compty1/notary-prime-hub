

# Finish & Seed Plan

## Current Status — All Clear
Everything from the 7-phase plan is verified and operational:
- **Trigger `on_auth_user_created`**: Attached to `auth.users` — working
- **`updated_at` triggers**: Active on `appointments`, `profiles`, `payments`, `leads`, `documents`, `notary_journal`, `notarization_sessions`
- **Realtime**: Enabled on `chat_messages`, `appointments`, `notary_journal`
- **All routes**: Registered in `App.tsx` (lead portal at `/admin/leads`, client portal at `/portal`, all admin sub-routes)
- **All tables**: Created with RLS policies
- **Google OAuth**: UI integrated on Login/SignUp pages
- **Storage bucket**: `documents` exists with RLS

## Only Remaining Task: Seed Service Data

Both `service_requirements` and `service_workflows` tables are empty (0 rows). There are 34 active services. I will seed Ohio-specific data for the core services:

### Services to seed (high-priority, Ohio-specific):

1. **Remote Online Notarization (RON)** — ORC §147.64, requires valid photo ID, KBA, audio/video recording
2. **In-Person Notarization** — ORC §147.53, requires personal appearance, valid ID
3. **Witness Services** — ORC §147.542, oath/affirmation requirements
4. **Apostille Facilitation** — Ohio SOS apostille process, Hague Convention docs
5. **I-9 Employment Verification** — Federal I-9 form, List A/B/C documents
6. **Closing Coordination (Real Estate)** — Deed, mortgage, title documents
7. **Certified Copy Facilitation** — ORC §147.542
8. **Immigration Document Packaging** — USCIS forms, certified translations
9. **Notarized Translation Coordination** — Translator affidavit requirements
10. **Bulk Notarization Packages** — Volume pricing, scheduling

For each, I will insert:
- **Requirements**: Documents needed, ID requirements, legal notes with Ohio statute references
- **Workflows**: Step-by-step process (3-6 steps per service) with client/admin action flags

### Technical approach
- Use the data insert tool to populate both tables with ~40-60 requirement rows and ~40-60 workflow rows referencing existing service IDs
- No schema changes needed

