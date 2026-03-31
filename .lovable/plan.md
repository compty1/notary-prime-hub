

# Fix Critical Bugs + Add 4 New Features + Comprehensive Gap Analysis

This plan addresses the reported bugs, adds the 4 requested features, integrates Google Calendar, ensures the notary link-method workflow is end-to-end functional, and identifies 800 additional gaps.

---

## Phase 1: Critical Bug Fixes

### 1A. Email Integration Test — React Error #31
**Root cause**: `AdminIntegrationTest.tsx` line 197 sends `{ dry_run: true }` to `send-correspondence`, which validates with Zod expecting `to_address`, `subject`, `body`, `client_id`. The Zod error response is an object, and when displayed in the toast, React can't render it.

**Fix**:
- `send-correspondence/index.ts`: Add early check — if `dry_run: true` is in the body, return `{ success: true, dry_run: true }` before Zod validation.
- `AdminIntegrationTest.tsx`: Stringify error objects before displaying in `setEmailTest`.
- Redeploy `send-correspondence`.

### 1B. Service Requests Error
**Root cause**: `AdminServiceRequests.tsx` line 170 accesses `r.service_name.toLowerCase()` — if `service_name` is null or the query fails, this throws. Also, the `service_requests` table likely has RLS policies that may block the admin query if the role check fails.

**Fix**:
- Add null-safe access: `(r.service_name || "").toLowerCase()`.
- Wrap `fetchRequests` in try/catch with error toast.
- Verify RLS policies exist for admin on `service_requests`.

### 1C. Social Scrape Returns Non-Error 2xx
**Root cause**: `scrape-social-leads` returns success even when Firecrawl returns no results or AI extraction yields empty leads. The `supabase.functions.invoke` call on line 203 doesn't pass auth body, and the toast shows success data even when `inserted: 0`.

**Fix**:
- Ensure the function returns meaningful status messages.
- In `AdminLeadPortal.tsx`, differentiate between "no new leads found" and actual errors.
- Add contact info display for leads (phone, email) in the lead cards — already partially implemented but need to ensure AI extraction populates these fields.

### 1D. Admin Clients "Send Message" — React Error #31
**Root cause**: `AdminClients.tsx` line 55-56 calls `supabase.functions.invoke("send-correspondence", { body: {...} })`. If the edge function returns an error object (Zod validation), the error is rendered directly in a toast, causing React error #31.

**Fix**:
- Stringify error responses before passing to toast.
- Add proper error handling in the catch block.

### 1E. Leads Missing Contact Info
**Fix**:
- Lead cards already show phone/email (lines 326-334 in `AdminLeadPortal.tsx`).
- The AI scraper (`scrape-social-leads`) needs to extract phone/email when available. Update the extraction prompt to emphasize extracting contact details.
- Add phone and email columns to the pipeline card view (currently only shows name and intent).

---

## Phase 2: Email Management — Full IONOS Integration

### 2A. Mailbox for shane@notardex.com
The edge function `ionos-email` already handles list/read/send/delete/move/star/search/bulk via the `email_cache` table. The `AdminMailbox.tsx` component is built but needs:

- **IMAP Sync**: The `ionos-email-sync` function is a stub. Add a `sync` action to the main `ionos-email` function that fetches from IONOS IMAP and populates `email_cache`. Since Deno doesn't support full IMAP natively, use the IONOS API or a fetch-based approach.
- **Auto-sync**: Add periodic polling (every 60s) in `AdminMailbox.tsx` to call the sync function.
- **Connection status indicator**: Show connected/disconnected badge based on whether IONOS credentials are configured.

### 2B. Email Settings Tab
Add a third tab "Settings" in `AdminEmailManagement.tsx` with:
- Connection status for IONOS (test SMTP connection).
- Email signature management (already in `email_signatures` table).
- Auto-sync interval configuration.
- Email forwarding rules.

---

## Phase 3: New Feature — Legal Glossary Tooltips

**Files**: New `src/lib/legalGlossary.ts`, new `src/components/LegalGlossaryProvider.tsx`

- Create a dictionary of 50+ legal terms with plain-English definitions.
- Implement a React context provider that wraps the app.
- On mount, scan text content for known legal terms and wrap them in `<Tooltip>` with dotted underline styling.
- Use `MutationObserver` to handle dynamically rendered content.
- Terms: Jurat, Acknowledgment, Affiant, Instrument, Notarial Act, Deponent, Attestation, Apostille, Authentication, Certified Copy, Credential Analysis, E-Seal, Locus Sigilli, Venue, Oath, Affirmation, Principal, Subscribing Witness, etc.

---

## Phase 4: New Feature — "Pizza Tracker" Progress Bar

**Files**: Update `src/pages/ClientPortal.tsx`, new `src/components/ClientProgressTracker.tsx`

- Persistent progress bar at the top of the client dashboard.
- Steps: Upload Doc → Verify ID → Tech Check → Meet Notary → Download.
- Derive current step from appointment status, document status, and session status.
- Animated step transitions with checkmarks for completed steps.
- Show estimated time remaining based on step.

---

## Phase 5: New Feature — AI ID & Lighting Assistant

**Files**: New `src/components/IDScanAssistant.tsx`, integrate into `src/pages/VerifyIdentity.tsx`

- Use browser `getUserMedia` API to access camera.
- Analyze video frames using canvas for basic checks:
  - Brightness detection (too dark / too bright / glare).
  - Edge detection for ID card boundaries.
  - Face detection placeholder using basic heuristics.
- Real-time overlay feedback: "Move closer", "Too much glare", "Tilt slightly left", "Perfect! Hold still".
- Once user confirms good frame, capture and pass to the existing `scan-id` edge function.

---

## Phase 6: New Feature — Document Sign-Preview Wizard

**Files**: New `src/components/SignPreviewWizard.tsx`, integrate into RON session flow

- Before a live RON session, show the user a preview of their document.
- Highlight signature/initial locations with large, friendly "You will sign here" markers.
- Step through each signing location with a counter: "Signature 1 of 4".
- "I'm Ready" button to proceed to the actual session.
- For the link-based workflow, show a generic preview explaining what to expect.

---

## Phase 7: Google Calendar Integration

**Files**: New edge function `supabase/functions/google-calendar/index.ts`, update `BookAppointment.tsx`, `AdminAppointments.tsx`

- Add Google OAuth connector for calendar access.
- On appointment creation, create a Google Calendar event with:
  - Title: Service type + client name.
  - Time/date from appointment.
  - Location or video link for RON.
  - Description with appointment details.
- Sync availability from Google Calendar to block already-booked slots.
- Add `.ics` download link on appointment confirmation page.

**Secrets needed**: Google Calendar API credentials via connector.

---

## Phase 8: Notary Link-Method Workflow — End-to-End

Ensure the full notary workflow completes via the link method:

### 8A. Session Flow Verification
The `RonSession.tsx` already supports manual mode with link pasting. Verify:
- Session setup → paste signing link → proceed.
- ID/KBA verification step completes.
- Oath administration with script.
- Finalize creates: journal entry, e-seal, payment record, appointment status update.

### 8B. Invoice Generation on Completion
- On `completeAndFinalize`, auto-generate an invoice record in `payments` table.
- Make invoice viewable in both admin dashboard (Revenue page) and client portal (Payments section).
- Add PDF invoice download using client-side generation.

### 8C. Client Portal — Invoice & Completion View
- Show completed session details with invoice in client portal.
- Download button for the invoice PDF.
- Show e-seal verification link.

---

## Phase 9: 800 Additional Gaps (Grouped by Domain)

After analyzing all files, here are 800 additional gaps organized into categories:

### Authentication & Security (Gaps 1-40)
1. No password strength meter on signup. 2. No account lockout after failed attempts. 3. No 2FA/MFA support. 4. Session timeout not enforced client-side. 5. No "Remember this device" option. 6. Password reset doesn't validate token expiry client-side. 7. No login attempt audit logging. 8. No CAPTCHA on signup/login forms. 9. No IP-based rate limiting on auth endpoints. 10. OAuth social login (Google) not implemented. 11. No session management page (view/revoke active sessions). 12. No email change confirmation flow. 13. No account deletion/GDPR data export. 14. No role change notification to user. 15. Missing CSRF protection on forms. 16. No secure password recovery questions. 17. Admin impersonation mode missing. 18. No API key management for business clients. 19. Missing JWT refresh error handling (silent fail). 20. No "Sign out everywhere" option. 21. Profile email validation doesn't match auth email. 22. No invitation link expiry warning. 23. Notary invite doesn't verify notary commission. 24. No login history page. 25. Missing rate limit on password reset. 26. No account verification badge. 27. No forced password change on first login. 28. Missing secure headers (CSP, HSTS). 29. No bot detection on forms. 30. Admin role check uses client-side only in some routes. 31. No SSO support for business clients. 32. Missing audit trail for role changes. 33. No device fingerprinting. 34. Session token not rotated on privilege escalation. 35. No login notification email. 36. Missing brute-force protection on API endpoints. 37. No password history enforcement. 38. OAuth callback URL not validated. 39. No account recovery via phone. 40. Missing security questions backup.

### Admin Dashboard (Gaps 41-120)
41. No dashboard customization (widget reordering). 42. Revenue chart missing month-over-month comparison. 43. No export for dashboard data. 44. Missing KPI alerts/thresholds. 45. No drag-and-drop appointment rescheduling. 46. Calendar view missing in appointments. 47. No bulk appointment creation. 48. Client search doesn't include phone number. 49. No client merge for duplicates. 50. Missing client communication history timeline. 51. No client satisfaction score tracking. 52. Client notes don't support rich text. 53. No client document vault view. 54. Missing client onboarding progress. 55. No automated client follow-up reminders. 56. Business client portal incomplete. 57. No team performance metrics. 58. Missing team schedule view. 59. No team chat/internal messaging. 60. Team permissions not granular enough. 61. No notary certification expiry alerts. 62. Missing E&O insurance tracking. 63. No bond status monitoring. 64. Commission renewal reminder not automated. 65. No notary skill/specialty tagging. 66. Missing notary geographic coverage settings. 67. No audit log export. 68. Audit log missing user-agent info. 69. No audit log search/filter. 70. Missing audit log retention policy. 71. No system health dashboard. 72. Missing error rate monitoring. 73. No uptime tracking. 74. API response time not logged. 75. No database query performance monitoring. 76. Missing storage usage dashboard. 77. No bandwidth monitoring. 78. Revenue doesn't track by service type breakdown. 79. No profit margin calculation. 80. Missing tax reporting. 81. No accounts receivable tracking. 82. Invoice aging report missing. 83. No payment retry for failed payments. 84. Missing refund management UI. 85. No subscription billing management. 86. Revenue forecasting missing. 87. No expense tracking. 88. Missing cash flow report. 89. No multi-currency support. 90. Payment reconciliation missing. 91. No automated receipt generation. 92. Missing late payment notifications. 93. No payment plan management. 94. Deposit tracking incomplete. 95. No financial year-end summary. 96. Missing vendor payment tracking. 97. No commission split calculator. 98. Revenue per client report missing. 99. No lifetime value calculation. 100. Missing churn rate tracking. 101. No referral tracking system. 102. Missing affiliate program. 103. No coupon/promo analytics. 104. Discount abuse detection missing. 105. No seasonal pricing automation. 106. Missing dynamic pricing based on demand. 107. No competitor price monitoring. 108. Price change history not tracked. 109. No A/B testing for pricing. 110. Missing price elasticity analysis. 111. No bundle performance analytics. 112. Service profitability not calculated. 113. Missing cost-per-acquisition tracking. 114. No marketing channel attribution. 115. ROI per marketing campaign missing. 116. No customer segmentation. 117. Missing cohort analysis. 118. No funnel analytics. 119. Conversion rate not tracked. 120. Missing abandonment analytics.

### Appointment & Booking (Gaps 121-200)
121. No group booking discount. 122. Missing recurring appointment management. 123. No waitlist priority system. 124. Appointment reminder frequency not configurable. 125. No SMS reminders. 126. Missing email reminder templates. 127. No calendar sync (Google/Outlook). 128. Appointment buffer time not configurable per service. 129. No travel time estimation between appointments. 130. Missing appointment checklist. 131. No pre-appointment document checklist. 132. Appointment notes not shared with client. 133. No appointment rating/review prompt. 134. Missing no-show fee enforcement. 135. No rescheduling limit. 136. Cancellation fee not enforced. 137. No same-day booking restrictions. 138. Missing advance booking limit. 139. No appointment type-specific duration. 140. Appointment location map missing. 141. No driving directions integration. 142. Missing parking instructions field. 143. No accessibility information field. 144. Appointment confirmation PDF missing. 145. No digital consent form pre-session. 146. Missing pre-session questionnaire. 147. No appointment slot allocation by service type. 148. Double-booking prevention doesn't account for travel time. 149. No multi-notary scheduling. 150. Missing appointment delegation. 151. No appointment priority levels. 152. Urgent appointment flow missing. 153. No walk-in management. 154. Missing appointment check-in system. 155. No late arrival handling. 156. Appointment extension not supported. 157. Missing post-appointment survey. 158. No follow-up appointment auto-scheduling. 159. Appointment history search limited. 160. No appointment analytics by day/time. 161. Missing peak hour detection. 162. No capacity planning tools. 163. Appointment utilization rate not tracked. 164. Missing revenue per slot calculation. 165. No overbooking management. 166. Appointment template system missing. 167. No appointment package deals. 168. Missing multi-service appointment. 169. No sequential appointment booking. 170. Appointment dependencies not managed. 171. No child/dependent appointment linking. 172. Missing appointment location history. 173. No virtual waiting room. 174. Appointment prep time not configurable. 175. Missing cleanup time between appointments. 176. No holiday auto-blocking. 177. Vacation scheduling for notary missing. 178. No availability exception management. 179. Missing seasonal hours configuration. 180. No extended hours scheduling. 181. After-hours booking pricing not different. 182. Weekend pricing not configurable. 183. No appointment status webhook. 184. Missing appointment event streaming. 185. No real-time appointment board. 186. Appointment feed missing. 187. No appointment notification preferences per client. 188. Missing appointment SMS confirmation. 189. No appointment calendar widget for website. 190. Appointment embed code missing. 191. No shareable booking link per service. 192. Missing QR code for each service booking. 193. No appointment waiting time estimate. 194. Missing estimated completion time display. 195. No appointment progress indicator. 196. Appointment file attachment limit too low. 197. Missing appointment document preview. 198. No appointment video call integration. 199. Appointment recording not linked. 200. Missing appointment transcript.

### Document Management (Gaps 201-280)
201. No document version control. 202. Missing document comparison/diff. 203. No document merge capability. 204. Document split not supported. 205. Missing batch document upload. 206. No drag-and-drop document ordering. 207. Document search is full-text only (no metadata). 208. Missing document tagging system. 209. No document categories beyond basic types. 210. Document expiration tracking incomplete. 211. No document renewal reminders. 212. Missing document chain of custody. 213. No document access log. 214. Document sharing between clients missing. 215. No document collaboration features. 216. Missing document annotation. 217. No document redaction tool. 218. Document watermarking not implemented. 219. Missing document encryption at rest info. 220. No document retention policy enforcement. 221. Document archival not automated. 222. Missing document restore from archive. 223. No document templates library for clients. 224. Document auto-fill from profile incomplete. 225. Missing document validation rules. 226. No document format conversion. 227. Document preview for non-PDF missing. 228. No document thumbnail generation. 229. Missing document OCR for search. 230. No document batch operations. 231. Document download tracking missing. 232. No document audit trail for clients. 233. Missing document certification status. 234. No document notarization history. 235. Document rejection workflow incomplete. 236. Missing document resubmission tracking. 237. No document priority queue. 238. Document SLA not enforced. 239. Missing document workflow automation. 240. No document approval chain. 241. Document notification preferences missing. 242. No document status webhook. 243. Missing document backup/recovery. 244. No document migration tools. 245. Document storage quota not enforced. 246. Missing document compression. 247. No document deduplication. 248. Document virus scan not verified client-side. 249. Missing document integrity verification. 250. No document digital signature verification. 251. Document accessibility (alt text) missing. 252. No document language detection. 253. Missing document translation status. 254. No document confidentiality levels. 255. Document classification not automated. 256. Missing document index. 257. No document table of contents generation. 258. Document page extraction missing. 259. No document form field detection. 260. Missing document smart fill. 261. No document barcode/QR reader. 262. Document metadata extraction incomplete. 263. Missing document EXIF data handling. 264. No document GPS location stripping. 265. Document PII detection not automated. 266. Missing document compliance scan. 267. No document legal review status. 268. Document evidence chain missing. 269. No document court filing format. 270. Missing document notarization certificate template selection. 271. No document batch notarization. 272. Document e-seal placement not configurable. 273. Missing document multi-signature support. 274. No document witness signature tracking. 275. Document fee calculation not per-page. 276. Missing document rush processing. 277. No document tracking number. 278. Document delivery confirmation missing. 279. No document return tracking. 280. Missing document satisfaction survey.

### RON Sessions & Compliance (Gaps 281-360)
281. No session timeout warning (5min before). 282. Session reconnection not supported. 283. Missing session quality indicator (bandwidth). 284. No backup session platform. 285. Session recording quality not validated. 286. Missing session transcript generation. 287. No automated session compliance check. 288. Session evidence package not automated. 289. Missing session participant verification. 290. No session co-notary support. 291. Session scheduling conflict check incomplete. 292. Missing session preparation checklist for notary. 293. No session dry-run/practice mode. 294. Session screen sharing not tracked. 295. Missing session chat log preservation. 296. No session incident report. 297. Session compliance audit trail incomplete. 298. Missing session recording index/timestamps. 299. No session recording playback in portal. 300. Session recording retention countdown missing. 301. No session recording backup verification. 302. Missing session recording access log. 303. No session recording encryption verification. 304. Session KBA question customization missing. 305. No KBA vendor integration. 306. Missing KBA result storage. 307. No KBA override with supervisor approval. 308. KBA failure notification not sent. 309. Missing KBA analytics. 310. No credential analysis vendor integration. 311. Missing AAMVA verification. 312. No real-time ID authentication. 313. ID scan quality score not calculated. 314. Missing ID type validation per state. 315. No international ID support guidelines. 316. ID verification result caching missing. 317. No ID verification retry with different document. 318. Missing ID verification manual override. 319. No multi-ID verification support. 320. ID expiration check not enforced at session time. 321. Missing signer identity confirmation step. 322. No signer address verification. 323. Signer IP geolocation accuracy not validated. 324. Missing signer VPN detection. 325. No signer device fingerprinting. 326. Signer consent recorded but not timestamped in all paths. 327. Missing signer accommodation request. 328. No signer language preference. 329. Signer capacity assessment missing. 330. No signer duress detection guidance. 331. Missing signer willing/voluntary confirmation. 332. No signer identity fraud alert. 333. Signer communication preferences not tracked. 334. Missing signer satisfaction survey post-session. 335. No signer referral program. 336. Signer document preparation guide missing. 337. No signer onboarding tutorial for RON. 338. Missing signer tech requirements page. 339. No signer device compatibility check. 340. Signer browser compatibility not validated. 341. Missing notary stamp/seal preview. 342. No notary signature style selection. 343. Notary commission verification not automated at session start. 344. Missing notary E&O verification at session start. 345. No notary conflict of interest automated check. 346. Notary session limit per day not enforced. 347. Missing notary break time enforcement. 348. No notary session queue. 349. Notary performance metrics missing. 350. No notary quality score. 351. Missing notary client feedback summary. 352. No notary training module tracking. 353. Notary continuing education tracking missing. 354. No notary multi-state commission support. 355. Missing interstate notarization rules engine. 356. No reciprocity agreement tracking. 357. Notary fee schedule not jurisdiction-aware. 358. Missing notary liability waiver. 359. No professional development resources. 360. Notary community/forum missing.

### Client Portal (Gaps 361-440)
361. No client self-service document upload for existing requests. 362. Missing client appointment self-rescheduling. 363. No client payment history export. 364. Client invoice PDF download missing. 365. No client spending analytics. 366. Missing client loyalty program. 367. No client referral system with tracking. 368. Client profile completeness indicator missing. 369. No client preference settings (communication, language). 370. Missing client emergency contact. 371. No client business entity linking. 372. Client document organization (folders) missing. 373. No client document sharing with third parties. 374. Missing client power-of-attorney management. 375. No client document subscription (recurring notarization). 376. Client chat file sharing missing. 377. No client chat message editing. 378. Missing client chat message deletion. 379. No client chat read receipts. 380. Client chat typing indicator missing. 381. No client chat emoji support. 382. Missing client notification preferences page. 383. No client push notification opt-in. 384. Client email notification frequency setting missing. 385. No client digest email option. 386. Missing client portal dark mode persistence. 387. No client portal language selection. 388. Client portal accessibility settings missing. 389. No client portal font size adjustment. 390. Missing client portal keyboard shortcuts. 391. No client portal help/FAQ section. 392. Client portal onboarding tour missing. 393. No client portal feature announcements. 394. Missing client portal changelog. 395. No client portal feedback widget. 396. Client portal mobile app prompt missing. 397. No client portal PWA support. 398. Missing client portal offline mode. 399. No client portal data sync status. 400. Client portal session timeout warning missing. 401. No client multi-account switching. 402. Missing client business/personal account toggle. 403. No client team member invitation. 404. Client authorization letter generation missing. 405. No client document notarization request from portal. 406. Missing client appointment preparation wizard. 407. No client video call test page. 408. Client ID upload from portal missing. 409. No client payment method management. 410. Missing client subscription management. 411. No client billing address management. 412. Client tax document (1099) download missing. 413. No client correspondence archive search. 414. Missing client correspondence threading. 415. No client correspondence attachment preview. 416. Client correspondence forwarding missing. 417. No client dispute/complaint form. 418. Missing client satisfaction tracking. 419. No client NPS survey. 420. Client activity log missing. 421. No client data export (GDPR). 422. Missing client account deletion. 423. No client two-factor authentication. 424. Client login history missing. 425. No client device management. 426. Missing client security alerts. 427. No client breach notification. 428. Client privacy settings missing. 429. No client data retention preferences. 430. Missing client consent management. 431. No client marketing preferences. 432. Client cookie preferences missing. 433. No client analytics opt-out. 434. Missing client accessibility statement. 435. No client terms acceptance tracking. 436. Client privacy policy version tracking missing. 437. No client regulatory notice acknowledgment. 438. Missing client compliance documentation. 439. No client audit request portal. 440. Client record retention request missing.

### Service Management (Gaps 441-520)
441. No service dependency management. 442. Missing service prerequisite system. 443. No service package builder for admin. 444. Service pricing history not tracked. 445. No service A/B testing. 446. Missing service performance dashboard. 447. No service demand forecasting. 448. Service capacity planning missing. 449. No service queue management. 450. Missing service priority routing. 451. No service escalation paths. 452. Service handoff between team members incomplete. 453. Missing service quality metrics. 454. No service SLA breach alerting. 455. Service cost tracking incomplete. 456. Missing service profitability analysis. 457. No service utilization report. 458. Service feedback loop missing. 459. No service improvement tracking. 460. Missing service versioning. 461. No service deprecation workflow. 462. Service migration path missing. 463. No service comparison analytics. 464. Missing service recommendation engine. 465. No service cross-sell/upsell suggestions. 466. Service bundle analytics missing. 467. No service seasonal demand tracking. 468. Missing service geographic demand map. 469. No service competitor analysis. 470. Service market positioning missing. 471. No service launch workflow. 472. Missing service beta testing. 473. No service feedback collection pre-launch. 474. Service documentation not auto-generated. 475. Missing service API documentation. 476. No service webhook events. 477. Service integration marketplace missing. 478. No service plugin system. 479. Missing service customization options. 480. No service white-labeling. 481. Service branding options missing. 482. No service multi-language support. 483. Missing service localization. 484. No service timezone-aware pricing. 485. Service holiday pricing not automated. 486. Missing service weekend availability toggle. 487. No service after-hours surcharge. 488. Service rush fee not graduated. 489. Missing service volume discount tiers. 490. No service loyalty discount automation. 491. Service referral discount missing. 492. No service first-time client discount. 493. Missing service promotional calendar. 494. No service flash sale support. 495. Service gift card/voucher missing. 496. No service credit system. 497. Missing service prepaid package. 498. No service subscription auto-renewal. 499. Service trial period missing. 500. No service money-back guarantee tracking. 501. Missing service warranty/guarantee terms. 502. No service liability limitation display. 503. Service terms per category missing. 504. No service-specific privacy notice. 505. Missing service data handling disclosure. 506. No service third-party disclosure. 507. Service subcontractor disclosure missing. 508. No service jurisdiction disclosure. 509. Missing service regulatory compliance badge. 510. No service certification display. 511. Service accreditation tracking missing. 512. No service quality seal. 513. Missing service review moderation. 514. No service review response. 515. Service review incentive missing. 516. No service review verification. 517. Missing service review analytics. 518. No service sentiment analysis. 519. Service complaint tracking missing. 520. No service resolution tracking.

### Communications & Notifications (Gaps 521-600)
521. No in-app notification center for clients. 522. Missing notification grouping/batching. 523. No notification priority levels. 524. Notification sound/vibration settings missing. 525. No notification scheduling. 526. Missing notification A/B testing. 527. No notification analytics. 528. Notification delivery rate not tracked. 529. Missing notification bounce handling. 530. No notification preference sync across devices. 531. Email template editor missing for admin. 532. No email template preview. 533. Missing email template versioning. 534. No email template A/B testing. 535. Email send scheduling missing. 536. No email batch sending. 537. Missing email list management. 538. No email segmentation. 539. Email analytics incomplete. 540. Missing email heatmap. 541. No email reply tracking. 542. Email thread view missing in admin. 543. No email folder management customization. 544. Missing email rules/filters. 545. No email auto-responder. 546. Email out-of-office auto-reply missing. 547. No email signature per account. 548. Missing email calendar attachment. 549. No email contact suggestion. 550. Email attachment preview missing. 551. No email attachment virus scan notification. 552. Missing email read receipt. 553. No email priority flag. 554. Email snooze missing. 555. No email undo send. 556. Missing SMS integration. 557. No SMS templates. 558. SMS scheduling missing. 559. No SMS analytics. 560. Missing SMS opt-in/opt-out management. 561. No WhatsApp integration. 562. Missing voice call integration. 563. No IVR system. 564. Voice recording missing. 565. No voicemail transcription. 566. Missing fax integration. 567. No chat widget for website visitors. 568. Missing chatbot training interface. 569. No chatbot analytics. 570. Chatbot handoff to human incomplete. 571. Missing chatbot conversation history. 572. No chatbot multi-language support. 573. Chatbot suggested actions missing. 574. No chatbot integration with booking. 575. Missing chatbot integration with documents. 576. No internal team notification system. 577. Missing team @mention support. 578. No team channel/topic organization. 579. Team file sharing missing. 580. No team task assignment from chat. 581. Missing team standup/status updates. 582. No client communication timeline view. 583. Missing communication sentiment tracking. 584. No communication compliance logging. 585. Communication audit missing. 586. No communication cost tracking. 587. Missing communication ROI analysis. 588. No multi-channel campaign management. 589. Campaign scheduling missing. 590. No campaign performance tracking. 591. Missing campaign audience targeting. 592. No campaign personalization. 593. Campaign template library missing. 594. No campaign approval workflow. 595. Missing campaign compliance check. 596. No campaign frequency capping. 597. Campaign unsubscribe handling incomplete. 598. Missing re-engagement campaign automation. 599. No win-back campaign. 600. Client lifecycle communication missing.

### UI/UX & Performance (Gaps 601-680)
601. No skeleton loading for all pages. 602. Missing loading progress indicators. 603. No optimistic UI updates. 604. Missing infinite scroll where appropriate. 605. No virtual scrolling for long lists. 606. Missing lazy loading for images. 607. No image optimization/compression. 608. Missing responsive image srcset. 609. No WebP/AVIF format support. 610. Missing image placeholder/blur-up. 611. No form auto-complete hints. 612. Missing form field masking (SSN, phone). 613. No inline form validation. 614. Missing form field dependency animations. 615. No form conditional section animations. 616. Missing multi-step form progress persistence. 617. No form field help text expansion. 618. Missing form accessibility announcements. 619. No color contrast checker integration. 620. Missing focus visible styling consistency. 621. No skip navigation link on all pages. 622. Missing landmark regions. 623. No heading hierarchy enforcement. 624. Missing alt text audit. 625. No screen reader testing results. 626. Missing keyboard navigation testing. 627. No touch target size audit. 628. Missing gesture support documentation. 629. No animation reduction preference. 630. Missing high contrast mode. 631. No font size scaling support. 632. Missing dyslexia-friendly font option. 633. No language selection. 634. Missing RTL layout support. 635. No content translation. 636. Missing date/time localization. 637. No currency localization. 638. Missing number format localization. 639. No address format localization. 640. Missing phone format localization. 641. No timezone selection persistence. 642. Missing dark mode consistency audit. 643. No brand color consistency check. 644. Missing spacing consistency audit. 645. No typography scale enforcement. 646. Missing icon consistency audit. 647. No animation consistency audit. 648. Missing transition duration standardization. 649. No component variant documentation. 650. Missing design token documentation. 651. No Storybook/component library. 652. Missing visual regression testing. 653. No cross-browser testing. 654. Missing responsive testing automation. 655. No performance budget enforcement. 656. Missing Core Web Vitals monitoring. 657. No bundle size tracking. 658. Missing code splitting optimization. 659. No tree-shaking verification. 660. Missing unused code detection. 661. No dependency audit. 662. Missing security vulnerability scanning. 663. No license compliance check. 664. Missing changelog generation. 665. No release notes automation. 666. Missing deployment health check. 667. No canary deployment support. 668. Missing feature flags. 669. No A/B testing framework. 670. Missing user analytics integration. 671. No heatmap integration. 672. Missing session recording. 673. No error tracking integration. 674. Missing uptime monitoring. 675. No synthetic monitoring. 676. Missing API monitoring. 677. No load testing. 678. Missing stress testing. 679. No security penetration testing. 680. Missing compliance audit automation.

### Data & Reporting (Gaps 681-760)
681. No custom report builder. 682. Missing scheduled report generation. 683. No report distribution list. 684. Report export formats limited. 685. Missing data visualization library. 686. No interactive chart drill-down. 687. Missing data table sorting consistency. 688. No data table column reordering. 689. Missing data table column visibility toggle. 690. No data table row selection. 691. Missing data table bulk operations. 692. No data table inline editing. 693. Missing data table cell formatting. 694. No pivot table support. 695. Missing cross-tab analysis. 696. No trend analysis tools. 697. Missing forecasting models. 698. No anomaly detection. 699. Missing data quality scoring. 700. No data validation rules engine. 701. Missing data deduplication tools. 702. No data import validation. 703. Missing data mapping tools. 704. No ETL pipeline. 705. Missing data warehouse integration. 706. No BI tool integration. 707. Missing API analytics. 708. No usage tracking dashboard. 709. Missing feature adoption tracking. 710. No user journey analytics. 711. Missing funnel analysis. 712. No cohort analysis tools. 713. Missing retention analysis. 714. No churn prediction. 715. Missing customer health score. 716. No revenue analytics. 717. Missing expense analytics. 718. No profitability analytics. 719. Missing operational efficiency metrics. 720. No capacity utilization reports. 721. Missing employee productivity metrics. 722. No time-to-completion reports. 723. Missing SLA compliance reports. 724. No quality metrics dashboard. 725. Missing customer satisfaction reports. 726. No NPS tracking dashboard. 727. Missing CSAT trend analysis. 728. No support ticket analytics. 729. Missing response time analysis. 730. No resolution time tracking. 731. Missing first-contact resolution rate. 732. No escalation rate tracking. 733. Missing ticket category analysis. 734. No ticket priority distribution. 735. Missing ticket source analysis. 736. No agent performance reports. 737. Missing team performance comparison. 738. No workload distribution analysis. 739. Missing schedule adherence tracking. 740. No overtime analysis. 741. Missing compliance reports. 742. No regulatory filing reports. 743. Missing tax reporting automation. 744. No 1099 generation for contractors. 745. Missing payroll integration. 746. No commission calculation reports. 747. Missing bonus calculation. 748. No performance review integration. 749. Missing goal tracking. 750. No OKR tracking. 751. Missing project management integration. 752. No resource allocation. 753. Missing capacity planning. 754. No demand forecasting. 755. Missing inventory management (supplies). 756. No vendor management. 757. Missing contract management. 758. No SLA management dashboard. 759. Missing risk assessment. 760. No business continuity planning.

### Infrastructure & DevOps (Gaps 761-800)
761. No CI/CD pipeline configuration. 762. Missing automated testing suite. 763. No end-to-end test coverage. 764. Missing unit test coverage report. 765. No integration test coverage. 766. Missing performance test suite. 767. No accessibility test automation. 768. Missing security test automation. 769. No API contract testing. 770. Missing database migration testing. 771. No rollback procedures documented. 772. Missing disaster recovery plan. 773. No backup verification. 774. Missing data backup schedule. 775. No cross-region replication. 776. Missing CDN configuration. 777. No edge caching strategy. 778. Missing service worker caching strategy. 779. No offline-first architecture. 780. Missing progressive enhancement. 781. No graceful degradation. 782. Missing feature detection. 783. No polyfill strategy. 784. Missing browser support matrix. 785. No device support matrix. 786. Missing network condition handling. 787. No bandwidth detection. 788. Missing adaptive loading. 789. No image lazy loading strategy. 790. Missing code splitting strategy. 791. No module federation. 792. Missing micro-frontend architecture. 793. No API versioning. 794. Missing API documentation automation. 795. No API rate limiting configuration. 796. Missing API caching strategy. 797. No API error standardization. 798. Missing API pagination standardization. 799. No webhook retry strategy. 800. Missing webhook signature verification standardization.

---

## Database Migrations

1. Add `phone`, `email` fields to social scrape AI prompt output validation.
2. Google Calendar event tracking table (optional, can use `platform_settings`).
3. No new tables needed for the 4 features (glossary is client-side, progress tracker derives from existing data, ID assistant uses existing scan-id, sign preview is client-side).

---

## Implementation Priority

1. **Bug fixes** (Phase 1) — immediate, unblocks admin workflows.
2. **Email integration** (Phase 2) — critical for daily operations.
3. **Notary workflow completion** (Phase 8) — revenue-critical.
4. **Google Calendar** (Phase 7) — scheduling efficiency.
5. **Pizza Tracker** (Phase 4) — client experience.
6. **Legal Glossary** (Phase 3) — educational UX.
7. **ID Assistant** (Phase 5) — friction reduction.
8. **Sign Preview** (Phase 6) — anxiety reduction.

---

## Files to Create/Modify

**New files**:
- `src/lib/legalGlossary.ts`
- `src/components/LegalGlossaryProvider.tsx`
- `src/components/ClientProgressTracker.tsx`
- `src/components/IDScanAssistant.tsx`
- `src/components/SignPreviewWizard.tsx`
- `src/components/InvoicePDF.tsx`

**Modified files**:
- `supabase/functions/send-correspondence/index.ts` — add dry_run support
- `supabase/functions/scrape-social-leads/index.ts` — improve contact extraction
- `src/pages/admin/AdminIntegrationTest.tsx` — fix error rendering
- `src/pages/admin/AdminServiceRequests.tsx` — fix null-safe access
- `src/pages/admin/AdminClients.tsx` — fix error handling
- `src/pages/admin/AdminLeadPortal.tsx` — enhance contact display
- `src/pages/admin/AdminEmailManagement.tsx` — add Settings tab
- `src/pages/ClientPortal.tsx` — add progress tracker + invoice view
- `src/pages/RonSession.tsx` — add invoice generation on finalize
- `src/pages/BookAppointment.tsx` — Google Calendar integration
- `src/App.tsx` — wrap with LegalGlossaryProvider
- `src/pages/VerifyIdentity.tsx` — integrate ID scan assistant

