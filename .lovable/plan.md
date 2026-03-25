

# Complete All Gaps, Route Transitions & Admin User Management

## Summary

This plan extends the existing gap-completion work with a new feature: full admin user/profile management including profile editing, image uploads, and user creation.

---

## Existing Plan (Steps 1-4 unchanged)

### Step 1: AnimatePresence in App.tsx
Extract routes into child component, wrap in `<AnimatePresence mode="wait">` with `useLocation()` key.

### Step 2: Migrate ~16 pages to PageShell
Remove inline nav/footer, wrap in `<PageShell>`. Pages: BookAppointment, FeeCalculator, DocumentTemplates, DocumentDigitize, DocumentBuilder, NotaryGuide, RonInfo, LoanSigningServices, ServiceDetail, JoinPlatform, TermsPrivacy, SubscriptionPlans, RonEligibilityChecker, ServiceRequest, NotaryProcessGuide, VerifySeal.

### Step 3: Remove duplicate fadeUp definitions
Import from `@/lib/animations` in NotaryGuide and RonInfo.

### Step 4: Mobile responsive fixes
Hero pill toggle sizing, trust bar spacing, scrollbar-hide on tabs.

---

## NEW: Step 5 — Admin User Profile Management

### 5a. Database Changes

**Migration 1**: Add `avatar_path` column to `profiles` table:
```sql
ALTER TABLE public.profiles ADD COLUMN avatar_path text;
```

**Migration 2**: Create `notary_certifications` table:
```sql
CREATE TABLE public.notary_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_name text NOT NULL,
  issuing_body text,
  certification_number text,
  issued_date date,
  expiry_date date,
  file_path text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notary_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage certs" ON public.notary_certifications FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own certs" ON public.notary_certifications FOR SELECT USING (auth.uid() = user_id);
```

**Migration 3**: Make `documents` storage bucket support profile avatars (already exists, reuse `documents` bucket with `profiles/` prefix path).

### 5b. Enhance AdminClients.tsx

Currently shows client list with notes and messaging. Add:
- **Edit Profile Dialog**: Click a client to open a dialog with editable fields (full_name, phone, email, address, city, state, zip, admin_notes)
- **Avatar Upload**: File input in the dialog that uploads to `documents` bucket at path `profiles/{user_id}/avatar.{ext}`, updates `avatar_path` on profile
- **Avatar Display**: Show avatar thumbnail in client list and detail dialog using signed URL from storage
- **Save**: Updates `profiles` table via supabase client

### 5c. Enhance AdminTeam.tsx

Currently shows notary list with invite/remove. Add:
- **Notary Detail Dialog**: Click a notary card to open expanded view with:
  - Editable profile fields (same as clients)
  - Avatar upload (same mechanism)
  - **Certifications Section**: List existing certs from `notary_certifications`, add/edit/delete with fields: name, issuing body, number, issued date, expiry date, optional file upload
- **Save All Changes**: Single save button that updates profile + manages certifications

### 5d. Admin Create User (Manual Profile)

Add a "Create Profile" button in AdminClients that opens a dialog to:
- Enter full_name, email, phone, address fields
- Insert directly into `profiles` table with a generated user_id placeholder
- Note: This creates a profile record only (not an auth user). The profile links when the person signs up with that email. Alternatively, display a note that the user must sign up themselves.

---

## Technical Details

### Files Modified
- `src/App.tsx` — AnimatePresence wrapper
- 16 page files — PageShell migration (listed in Step 2)
- `src/pages/admin/AdminClients.tsx` — profile edit dialog, avatar upload, avatar display
- `src/pages/admin/AdminTeam.tsx` — notary detail dialog, certifications CRUD, avatar upload
- `src/index.css` — scrollbar-hide utility

### Files Created
- None (all UI added inline to existing admin pages)

### Database Migrations
1. `ALTER TABLE profiles ADD COLUMN avatar_path text`
2. `CREATE TABLE notary_certifications` with RLS

### No Changes To
- Auth flows, routing logic, edge functions, payment flows
- Existing content or functionality on any page

