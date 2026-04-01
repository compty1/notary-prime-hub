

# Gap Audit (200+ Issues) + AI Services Suite Implementation Plan

## Part 1: Comprehensive Gap Audit

After thorough analysis of the codebase, here are 200+ identified gaps organized by severity and category.

---

### CRITICAL (Security & Data Integrity) — 18 items

1. No CSRF protection on form submissions (Index.tsx contact form, BookAppointment, ServiceRequest)
2. `any` type used extensively for database records — no type safety (ClientPortal.tsx lines 49-91, AdminLeadPortal.tsx line 34)
3. No rate limiting on client-side lead submissions (submitLead.ts) — spam vulnerability
4. No input sanitization on RichTextEditor HTML output before storage
5. No Content-Security-Policy meta tag in index.html
6. Edge functions use `import { serve }` from old Deno std — should use `Deno.serve`
7. No retry logic on Supabase queries that fail silently (ClientPortal fetches ~15 tables with no error aggregation)
8. `callEdgeFunctionStream` has no response body size limit — potential memory exhaustion
9. No session timeout/auto-logout for admin sessions
10. Chat messages have no content length validation client-side
11. File upload in ServiceRequest has no file type validation (accepts any file)
12. No XSS sanitization on chat message rendering (uses `whitespace-pre-wrap` but no sanitizer)
13. AdminSettings stores seal image path but doesn't validate file type on upload
14. No audit logging for lead deletion, status changes, or bulk operations
15. Email drafts store raw HTML with no sanitization (`body_html` column)
16. No password strength indicator on SignUp page
17. No account lockout after failed login attempts
18. Missing `rel="noopener noreferrer"` on some external links

### HIGH — UX & Workflow Gaps — 42 items

19. No timezone selector in booking flow — only shows "(ET)" hardcoded
20. No auto-confirmation email after contact form submission on Index.tsx
21. No inline form validation — all errors shown via toast notifications
22. File upload shows no filename/preview after selection in ServiceRequest
23. Success toasts auto-dismiss too quickly (~3s) — users miss them
24. Internal service links use `target="_blank"` in 18+ files (110 instances found)
25. No Apple Pay / Google Pay — Stripe PaymentElement doesn't enable Payment Request Button
26. No Personal/Business toggle in booking flow (lead_type exists in DB but not used in booking)
27. No "Undo" capability after deleting leads, appointments, or documents
28. No bulk actions in Lead Portal (bulk delete, bulk status change, bulk export)
29. No keyboard shortcuts documented or discoverable (CommandPalette exists but no help overlay)
30. No loading skeleton for AdminLeadPortal (large file, 678 lines, loads everything at once)
31. No pagination on leads list — fetches all leads at once
32. No pagination on appointments in AdminAppointments
33. No pagination on documents in AdminDocuments
34. No pagination on journal entries in AdminJournal
35. No search/filter in AdminAuditLog
36. No export functionality for audit log
37. No date range filter on AdminRevenue charts
38. Client portal has 12+ tabs with no grouping — overwhelming on mobile
39. No "Mark all as read" button in chat
40. No typing indicator in live chat
41. No file attachment preview in chat messages (attachment_url exists but no inline preview)
42. No drag-and-drop reordering for services in AdminServices (GripVertical icon imported but not wired)
43. No service search/filter in the admin services catalog
44. No duplicate detection when creating leads manually
45. No email validation in booking flow guest signup (only checks non-empty)
46. No phone number formatting/validation in booking or contact forms
47. BookAppointment.tsx is 753 lines — needs decomposition
48. ClientPortal.tsx is 695 lines — needs decomposition
49. AdminLeadPortal.tsx is 678 lines — needs decomposition
50. ServiceRequest.tsx is 575 lines — needs decomposition
51. No "Recent searches" or search history in command palette
52. No breadcrumb trail in admin dashboard pages
53. No "Back to top" button on long admin pages
54. No empty state illustrations (EmptyState component exists but underused)
55. No onboarding tutorial for first-time admin users
56. No notification preferences UI for clients (table exists, no UI)
57. No email unsubscribe preferences page (Unsubscribe page exists but only handles token-based unsubscribe)
58. Booking draft auto-save exists but no "Resume draft" prompt when returning
59. No appointment reminder preferences (clients can't choose reminder timing)
60. No multi-language support despite LANGUAGES array in DocumentDigitize

### MEDIUM — UI/Visual Issues — 45 items

61. Footer uses `text-sidebar-foreground/60` — low contrast on dark background
62. Footer background (`bg-sidebar-background` + `bg-secondary-foreground`) doesn't match navbar
63. Badges with `bg-primary/20 text-primary-foreground` render white text on light teal — unreadable
64. No consistent icon sizing across admin sidebar items
65. Admin sidebar doesn't highlight nested routes correctly
66. No favicon for dark mode (current SVG may not be visible on dark OS taskbar)
67. No Open Graph / social media preview images for SEO
68. No structured data (JSON-LD) for local business SEO
69. No sitemap auto-generation (static sitemap.xml may be stale)
70. robots.txt doesn't reference sitemap URL
71. No 404 page illustration — just text
72. No maintenance mode toggle in admin (Maintenance page exists but no admin control)
73. Coming Soon page has no link back to main site
74. No print stylesheet for any page
75. No responsive table scrolling — tables overflow on mobile
76. Admin dashboard sidebar overlaps content on tablet (768-1024px)
77. No card hover effects on admin overview dashboard
78. Charts in AdminOverview use hardcoded colors — not theme-aware
79. No skeleton loading for charts
80. Service detail page chat bubble has no proper close animation
81. HeroPhoneAnimation may not be performant on low-end devices
82. No lazy loading for images (service icons, avatars)
83. No optimized image formats (WebP/AVIF)
84. Logo component renders at fixed sizes — no responsive scaling
85. MobileFAB position may overlap with cookie consent banner
86. No scroll-to-section anchors on landing page
87. No visual distinction between RON and in-person appointments in lists
88. No color-blind friendly mode or palette
89. Dark mode toggle has no transition animation
90. Tab indicators in ClientPortal don't show active state clearly on mobile
91. No horizontal scroll indicator on tab bars
92. AdminAppointments has no calendar view (only list)
93. No Gantt/timeline view for multi-day workflows
94. No visual pipeline/kanban board for leads (only list + pipeline tab with text)
95. Revenue charts have no interactivity (no drill-down)
96. No data visualization for service distribution
97. No heatmap for appointment scheduling patterns
98. Toast notifications stack and can cover important UI
99. No animation on page transitions within admin dashboard
100. Form labels not consistently aligned across pages
101. No consistent spacing system — mix of p-3, p-4, p-5, p-6 across cards
102. No focus ring styling for keyboard navigation
103. Inconsistent button sizing across admin pages
104. No loading states for delete operations
105. No confirmation dialog for bulk operations

### MEDIUM — Feature Gaps — 50 items

106. No recurring appointment support (only one-time bookings)
107. No waitlist functionality for fully booked slots
108. No appointment rescheduling limit (clients can reschedule infinitely)
109. No cancellation fee logic enforcement
110. No partial payment support
111. No payment plan/installment option
112. No refund workflow in admin
113. No invoice auto-generation (invoice_url field exists but no generation)
114. No receipt email after payment
115. No Stripe webhook handling for failed payments
116. No subscription billing management UI (SubscriptionPlans page exists but limited)
117. No document version history (only current version stored)
118. No document comparison tool
119. No document merge capability
120. No batch document upload in admin
121. No document tagging/labeling system
122. No document expiry tracking alerts (document_reminders table exists, no cron job to process)
123. No automated follow-up emails for unsigned documents
124. No client onboarding checklist (OnboardingWizard exists but not integrated)
125. No client satisfaction survey after appointment completion
126. No Net Promoter Score (NPS) tracking
127. No referral program tracking
128. No loyalty/rewards program
129. No gift card or prepaid credit system
130. No calendar integration (Google Calendar, Outlook) for appointments
131. No SMS notifications (only email)
132. No push notifications
133. No in-app notification center for clients
134. No activity feed in client portal
135. No team chat/internal messaging for admin staff
136. No shift scheduling for multiple notaries
137. No territory/zone assignment for mobile notaries
138. No route optimization for multiple mobile appointments
139. No expense tracking for notary mileage/supplies
140. No tax report generation
141. No commission tracking for referral partners
142. No affiliate program management
143. No API documentation for potential integrations
144. No webhook configuration UI for third-party services
145. No Zapier/Make integration
146. No white-label capability for business clients
147. No multi-tenant support for franchise model
148. No custom domain support per business client
149. No SLA tracking or response time metrics
150. No client portal customization per business
151. No automated quote generation (FeeCalculator exists but no save/send)
152. No proposal tracking (sent, viewed, accepted)
153. No e-signature collection (relies on SignNow external)
154. No digital notary stamp placement tool
155. No video recording integration for RON sessions (recording_url field but no recording logic)

### LOW — Code Quality & Performance — 40 items

156. No error boundary around individual admin dashboard widgets
157. No React.memo on expensive list renders (lead cards, appointment cards)
158. No virtualized lists for large datasets (leads, appointments, documents)
159. No debouncing on search inputs in admin pages
160. No request deduplication — multiple rapid clicks can trigger duplicate API calls
161. No optimistic updates — all mutations wait for server response
162. No offline support / service worker
163. No cache invalidation strategy — staleTime set to 5min globally
164. No prefetching for likely navigation targets
165. Multiple `useEffect` dependency arrays missing cleanup functions
166. Console.error calls in production (not stripped)
167. No performance monitoring (no Web Vitals tracking)
168. No error reporting service integration (Sentry, etc.)
169. No A/B testing framework
170. No feature flags system
171. No analytics event tracking beyond basic page views
172. No heat mapping integration
173. No session recording integration
174. No accessibility audit tool integration
175. No automated E2E test coverage (playwright config exists but only fixture)
176. No unit test coverage for components (only lib tests)
177. No integration tests for edge functions
178. No load testing for edge functions
179. No CI/CD pipeline documentation
180. No API versioning for edge functions
181. No changelog or release notes
182. No contribution guidelines
183. No component documentation/storybook
184. Multiple `any` type assertions suppress TypeScript safety
185. No consistent error handling pattern across edge functions
186. Several edge functions use `serve()` from old Deno std instead of `Deno.serve()`
187. No shared CORS headers module for edge functions
188. No shared auth validation module for edge functions
189. No request logging middleware for edge functions
190. No health check endpoint
191. No database connection pooling configuration
192. No query optimization (several N+1 query patterns)
193. No database indexes on frequently filtered columns (leads.status, leads.source)
194. No database migration rollback strategy
195. QueryClient configured with `retry: 1` globally — may mask transient errors

### LOW — Content & Copy Gaps — 15 items

196. No Ohio county list for service area specification
197. No pricing page (FeeCalculator is interactive but no static pricing table)
198. No blog / content marketing section
199. No case studies or portfolio
200. No video testimonials
201. No press/media page
202. No partner/integration logos section
203. No compliance certifications display (SOC2, etc.)
204. No accessibility statement page
205. No cookie policy page (separate from terms)
206. No GDPR/CCPA data request page
207. No employee/team bios page
208. No careers page
209. No FAQ search functionality (accordion exists but no search filter)
210. Service descriptions are thin — no detailed "what to expect" content

---

## Part 2: AI Services Suite — New Features

### A. Smart Due Diligence Extractors

**New page: `/ai-extractors` — AI Document Intelligence Hub**

Four specialized extractors accessible from a tabbed interface:

1. **Legal/Real Estate Extractor** — Upload contracts/deeds → AI extracts termination clauses, expiration dates, renewal obligations, parties, consideration amounts into a structured summary table with source citations
2. **Finance Extractor** — Upload invoices/bank statements → AI categorizes line items and exports as CSV/Excel with spending categories, totals, and date ranges
3. **HR Extractor** — Upload resumes or employee handbooks → AI answers specific policy questions, extracts candidate qualifications into structured profiles
4. **General Extractor** — Upload any document → AI provides structured summary with key entities, dates, obligations, and action items

**Implementation:**
- New edge function `ai-extract-document` that accepts document text + extractor type
- Uses Gemini 2.5 Pro for complex document analysis
- Returns structured JSON that the frontend renders as formatted tables with clickable source citations
- Export to CSV/Excel/PDF buttons on results

### B. Style-Match Drafting

**New tab in AI Writer (`/ai-writer?tab=style-match`)**
- Upload 2-3 sample documents to establish tone/style
- Enter brief for new document
- AI generates document matching the client's writing style, vocabulary, and formatting
- Side-by-side preview: generated document + style analysis

**Implementation:**
- New edge function `ai-style-match` — accepts sample texts + brief, uses few-shot prompting
- Stores style profiles per client in a new `client_style_profiles` table

### C. Compliance Watchdog

**New component integrated into DocumentDigitize and Document Builder**
- Background scan of uploaded documents against configurable rule sets
- Rule sets: Ohio ORC §147, GDPR privacy, company brand guidelines, industry-specific (real estate, legal, healthcare)
- Flags non-compliant sections with severity levels and suggested fixes
- Results shown in a sidebar panel with click-to-navigate to flagged sections

**Implementation:**
- New edge function `ai-compliance-scan` — accepts document text + rule set ID
- Predefined rule sets stored in `platform_settings`
- Returns flagged sections with line references, severity, and fix suggestions

### D. Cross-Document Synthesis (Knowledge Graph)

**New page: `/ai-knowledge` — Document Knowledge Base**
- Select multiple documents from storage → AI indexes them
- Ask natural language questions across all selected documents
- AI responds with answers citing specific documents and pages
- Persistent document collections that can be queried repeatedly

**Implementation:**
- New edge function `ai-cross-document` — accepts array of document texts + query
- Uses Gemini 2.5 Pro with large context window
- Document collections stored in `document_collections` table
- Results include source citations linking to specific documents

### E. Proposal Generator (Enhanced)

**Enhance existing AI Writer proposal tab:**
- Pre-fill from lead data (already partially exists)
- Add template selection (standard, premium, enterprise)
- Add custom branding (logo, colors) to generated proposals
- Export as branded PDF
- Track proposal status (sent, viewed, accepted) in a new `proposals` table
- Email proposals directly from the interface

---

## Part 3: Split-Pane Document Interface

**Enhance DocumentDigitize page with 3-column layout:**
- Left: Document navigation/folder tree
- Center: Document viewer (current TipTap editor)
- Right: AI Action Panel (chat, extract, explain, compliance scan)
- Hover-to-explain: Highlight text → AI tooltip with simplified explanation
- Confidence indicators on all extracted data with source citations

---

## Database Changes Required

| Table | Change |
|-------|--------|
| New: `client_style_profiles` | Store client writing style fingerprints |
| New: `document_collections` | Group documents for cross-document queries |
| New: `proposals` | Track generated proposals with status |
| New: `compliance_rule_sets` | Configurable compliance scanning rules |
| `services` | Add `email_templates` jsonb column |

## New Edge Functions

| Function | Purpose |
|----------|---------|
| `ai-extract-document` | Smart due diligence extraction |
| `ai-style-match` | Style-matching document generation |
| `ai-compliance-scan` | Compliance watchdog scanning |
| `ai-cross-document` | Cross-document knowledge queries |

## New/Modified Pages

| Page | Change |
|------|--------|
| `/ai-extractors` | New — AI Document Intelligence Hub |
| `/ai-writer` | Add style-match tab, enhance proposal tab |
| `/ai-knowledge` | New — Cross-document knowledge base |
| `/digitize` | Add 3-column layout, AI panel, hover-to-explain |

## Implementation Priority

1. Gap fixes (critical security items first, then high UX items)
2. AI Extractors (Legal/Real Estate first — directly relevant to notary business)
3. Compliance Watchdog (integrates with existing document workflow)
4. Enhanced Proposal Generator (builds on existing AI Writer)
5. Style-Match Drafting
6. Cross-Document Synthesis
7. Split-Pane Interface redesign

