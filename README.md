# NotarDex — Ohio Online Notary & Document Services

Professional notary and document services platform serving Ohio. Supports in-person mobile notarization, Remote Online Notarization (RON), loan signings, document preparation, and 30+ additional services. Fully compliant with Ohio Revised Code §147.

## Architecture

```
┌──────────────────────────────────┐
│  React 18 + Vite 5 + TypeScript  │  ← Client SPA
│  Tailwind CSS + shadcn/ui        │
└────────────┬─────────────────────┘
             │ HTTPS
┌────────────▼─────────────────────┐
│  Lovable Cloud (Supabase)        │  ← Backend
│  ├── PostgreSQL (RLS-protected)  │
│  ├── Edge Functions (Deno)       │
│  ├── Auth (JWT + MFA)            │
│  ├── Storage (AES-256)           │
│  └── Realtime (WebSocket)        │
└──────────────────────────────────┘
```

## Tech Stack

| Layer         | Technology                                            |
|---------------|-------------------------------------------------------|
| Frontend      | React 18, TypeScript 5, Vite 5                        |
| Styling       | Tailwind CSS 3, shadcn/ui, Framer Motion              |
| State         | TanStack Query, React Context                         |
| Backend       | Lovable Cloud (Supabase PostgreSQL + Edge Functions)   |
| Auth          | Supabase Auth (email/password + Google OAuth + MFA)    |
| Payments      | Stripe (Elements + Webhooks)                          |
| E-Signatures  | SignNow API                                           |
| Email         | IONOS SMTP + Supabase email hooks                     |
| Rich Text     | TipTap (DocuDex editor)                               |

## Prerequisites

- Node.js 20+ or Bun
- A Lovable account (backend is managed via Lovable Cloud)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Available Scripts

| Script            | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start Vite dev server with HMR       |
| `npm run build`   | Production build (TypeScript + Vite)  |
| `npm run preview` | Preview production build locally      |
| `npm test`        | Run Vitest unit tests                 |
| `npm run lint`    | Run ESLint                           |

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/             # shadcn/ui primitives
│   └── docudex/        # DocuDex editor modules
├── contexts/           # React context providers (Auth)
├── hooks/              # Custom React hooks
├── lib/                # Utilities, validation, compliance
├── pages/              # Route-level page components
│   ├── admin/          # Admin dashboard modules
│   ├── portal/         # Client portal tabs
│   ├── solutions/      # Industry solution pages
│   ├── design/         # Design studio tools
│   └── booking/        # Booking flow steps
├── integrations/       # Supabase client & types (auto-generated)
└── test/               # Unit test files
supabase/
├── functions/          # Edge functions (Deno runtime)
└── config.toml         # Supabase project config
```

## Key Features

- **Remote Online Notarization (RON)** — ORC §147.60–.66 compliant sessions with KBA, recording, and e-journal
- **Mobile Notarization** — GPS check-in, journal entries, document upload
- **DocuDex Editor** — Multi-page document studio with templates, brand kits, and AI generation
- **Loan Signing Agent** — Full package management with NNA certification tracking
- **Admin Dashboard** — 50+ admin modules for operations, finance, and compliance
- **Client Portal** — Self-service document access, appointment management, and messaging
- **Print Marketplace** — Business cards, signage, and branded materials
- **AI Tools Hub** — Document review, compliance scanning, and content generation

## Ohio Compliance

The platform enforces Ohio notary law throughout:

- **ORC §147.08** — $5 per notarial act fee cap (validated via `validate_ohio_fee_cap()`)
- **ORC §147.60–.66** — RON session requirements (KBA, credential analysis, A/V recording)
- **ORC §147.63** — Mandatory recording consent and 5-year retention
- **ORC §147.141** — Per-document journal entries
- **ORC §2107.03** — Will witness requirements (2 non-beneficiary witnesses)

## Security

- Row-Level Security (RLS) on all tables with role-based policies
- RBAC via `user_roles` table with `has_role()` security definer function
- MFA (TOTP) for admin accounts
- DOMPurify HTML sanitization on all user input
- CSP headers, X-Frame-Options, and HSTS
- Rate limiting with sliding window and progressive penalties
- Zod validation on all Edge Function inputs

## Environment Variables

Managed automatically by Lovable Cloud. The `.env` file is auto-generated:

- `VITE_SUPABASE_URL` — Backend API endpoint
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Public API key
- `VITE_SUPABASE_PROJECT_ID` — Project identifier

## License

Proprietary — All rights reserved.
