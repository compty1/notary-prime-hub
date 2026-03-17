

# Shane Goble — Professional Notary Platform

## Overview
A full-stack notary platform with a polished public-facing site, client portal, and admin dashboard. Built with Supabase for authentication, database, and role-based access. Design follows the navy/gold legal-tech aesthetic with Playfair Display + Inter typography.

---

## 1. Public Landing Page
- **Hero** with clear toggle: "In-Person (Franklin County)" vs "Remote Online Notarization (RON)"
- **Services section** — document types, pricing, service areas
- **How It Works** — 3-step progress stepper (Book → Verify → Sign)
- **Trust Bar** — Ohio Revised Code compliance, Franklin County commission details, verification badges
- **Testimonials** and FAQ accordion
- **Persistent footer** with legal compliance citations and contact info
- Smooth fade-in-up animations on scroll, snappy button interactions

## 2. Authentication & Roles
- **Sign up / Login** for clients (email-based auth via Supabase)
- **Admin login** for Shane (same auth, role-based routing)
- **Roles table** — `user_roles` with `admin`, `client` roles using security definer pattern
- **Profiles table** — name, phone, address, linked to `auth.users`
- Auto-create profile on signup via database trigger

## 3. Appointment Scheduling (Built-in)
- **Multi-step booking wizard**: Select service type → Pick date/time → Enter details → Confirm
- **Availability calendar** — admin sets available time slots
- **Appointments table** — stores client, service type, date/time, location (in-person vs RON), status
- Clients see their upcoming/past appointments in their portal
- Admin manages all appointments from the dashboard
- Designed for future Google Calendar API integration

## 4. BlueNotary RON Integration
- **"Focus Mode" container** — removes site navigation, full-width iframe housing
- **Placeholder iframe** with clear instructions for embedding the real BlueNotary URL later
- **Pre-notarization flow**: ID upload prompt → KBA instructions → Launch BlueNotary session
- **Status tracking** integrated with appointment lifecycle

## 5. Client Portal
- **Dashboard** — upcoming appointments, active notarization status, document history
- **Appointment management** — view, reschedule, cancel
- **Document upload** — clients can upload documents ahead of appointments
- **Status indicators** with green "Verified" / "Completed" badges

## 6. Admin Dashboard (Sidebar-driven, Linear-style)
- **Status Board** — Kanban or list view tracking signings: Scheduled → ID Verification → KBA Pending → In Session → Fully Executed
- **Appointment management** — view all, filter, update statuses, add notes
- **Client directory** — searchable client list with contact info and history
- **Availability settings** — manage bookable time slots
- **Audit Log** — timestamped log of all digital transactions (RON compliance)
- **Document management** — track uploaded/signed documents per session
- **Analytics** — appointment counts, completion rates, revenue summary

## 7. Database Schema (Supabase)
- `profiles` — user details (name, phone, address)
- `user_roles` — role assignments (admin, client)
- `appointments` — bookings with service type, status, timestamps
- `time_slots` — admin-defined availability
- `documents` — uploaded files linked to appointments
- `audit_log` — all actions with timestamps, user, and details
- `notarization_sessions` — RON session tracking with status progression
- RLS policies on all tables using security definer functions

## 8. Ohio / Franklin County Compliance
- Footer trust bar on all pages citing Ohio Revised Code
- Commission details displayed prominently
- Audit log satisfies RON record-keeping requirements
- Document retention tracking with timestamps

## 9. Design & Polish
- **Colors**: Deep Navy primary, Burnished Gold accents, Cool White background
- **Typography**: Playfair Display headings, Inter body text
- **Animations**: Fade-in-up page transitions, instant button feedback, progress stepper animations
- **Responsive**: Mobile-first, works on all devices
- **Minimalist**: Generous white space, clear CTAs, no visual clutter

