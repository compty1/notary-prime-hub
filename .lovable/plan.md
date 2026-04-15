

# Full Implementation Plan — All Three Documents

This plan covers every item from the three uploaded attachments:
1. **Animations DOCX** — 14 micro-interaction components with 27 brand keyframes
2. **Design System PDF (50 pages)** — Brand identity, colors, Montserrat typography, components, routing, 57 services, accessibility
3. **DocuDex CSV (56 items)** — 7-phase Canva-style editor transformation

---

## Sprint 1: Brand Animation Library (Animations DOCX — all 14 components)

### 1.1 Brand Keyframes in index.css
Add all 27 keyframes: `sealDrop`, `drawCheck`, `fadeUp`, `glowPulse`, `particleBurst`, `driftDown`, `docSlide`, `checkPop`, `shimmer`, `ringDraw`, `morphBounce`, `receiptSlide`, `subtlePulse`, `errorShake`, `shieldFill`, `badgePop`, `cameraIris`, `livePulse`, `tileSlide`, `cardSlideUp`, `skeletonSweep`, `curtainWipe`, `toastSlideIn`, `toastSlideOut`, `bannerSlideDown`, `widthRetract`, `ellipsisAnim`. Add brand CSS variables (`--notar-yellow`, `--notar-blue`, `--transition-fast/base/slow`, `--bounce-easing`).

### 1.2 Create 14 Animation Components
Adapt each from the DOCX into `src/components/animations/`:
`NotarizationComplete`, `DocumentUpload`, `PaymentConfirmed`, `IdentityVerified`, `SessionJoined`, `CenturyClub`, `UploadFailed`, `SessionDisconnected`, `BusinessPlanUpgrade`, `SkeletonLoading`, `ToastNotification`, `ButtonLoadingState`, `FormError`, `MilestoneRating` — using semantic tokens, not hardcoded hex.

### 1.3 Animation Gallery Page
Create `/animations` route with triggerable gallery grid.

---

## Sprint 2: Design System Alignment (PDF Sections 1-5)

### 2.1 Typography Switch to Montserrat
The PDF mandates **Montserrat** (currently DM Sans). Update `@import`, `--font-heading`, `--font-body`, and `brandConfig.ts`.

### 2.2 Color Token Verification
Confirm `--primary` maps to #E4AC0F. Add dedicated `--notar-blue: #004FDF` token. Verify semantic colors (success #2ECC71, error #E74C3C). Audit dark mode mappings against PDF.

### 2.3 Spacing, Elevation, Radius
Add any missing spacing tokens (4/8/12/16/24/32/48/64/96px) and shadow scale to CSS + Tailwind config.

### 2.4 Logo System
Update `brandConfig.ts` with favicon size specs (16/32/192/512), clear space rules, and all variant references.

---

## Sprint 3: Component & Motion Alignment (PDF Sections 2, 6, 16-18)

### 3.1 Component Specs
Verify Button, Input, Card, Dialog, Sheet, Badge match PDF sizing, radius, and state specs.

### 3.2 Motion System
Wire brand easings into `animations.ts`: `--transition-fast: 150ms`, `--transition-base: 200ms`, `--transition-slow: 300ms`, `--bounce-easing: cubic-bezier(0.34, 1.56, 0.64, 1)`.

### 3.3 Dark Mode Audit
Compare all dark mode CSS variables against PDF Section 18 mapping table.

### 3.4 Responsive Verification
Ensure correct rendering at all PDF-specified breakpoints (320/375/414/768/1024/1280/1440/1920).

---

## Sprint 4: DocuDex Phase 0 — Architecture Foundation (P0-001 to P0-005)

- **P0-001**: Install `zustand` + `immer`. Create `stores/editorStore.ts` with `documentSlice`, `uiSlice`, `historySlice`, `settingsSlice`. Migrate all 60+ useState hooks.
- **P0-002**: Replace flat `PageData = {id, html}` with structured `ElementNode` schema (id, type, x, y, width, height, rotation, opacity, locked, layerIndex, styles, content).
- **P0-003**: Decompose 1200-line DocuDexEditor.tsx into EditorShell, CanvasViewport, ElementRenderer, PropertyPanel, ToolbarController, PageNavigator, AIAssistant, ExportEngine.
- **P0-004**: Implement Command pattern undo/redo stack. Ctrl+Z/Y. Max 100 entries with LRU.
- **P0-005**: Convert all 40+ HTML string templates to element-schema JSON.

---

## Sprint 5: DocuDex Phase 1 — Canvas Engine (P1-001 to P1-010)

- **P1-001**: Install Fabric.js. Hybrid canvas rendering + TipTap for text.
- **P1-002**: Drag-and-drop from sidebar to canvas with ghost preview (`@dnd-kit/core`).
- **P1-003**: Smart alignment guides during drag/resize.
- **P1-004**: 8-point resize handles. Shift=lock ratio. Alt=center resize.
- **P1-005**: Rotation handle with Shift snap to 15° increments.
- **P1-006**: Marquee multi-select + Shift+Click. Ctrl+G group/ungroup.
- **P1-007**: Visual layers panel with z-index reorder, visibility/lock toggles.
- **P1-008**: Floating context toolbar per element type (`@floating-ui/react`).
- **P1-009**: Scroll-to-zoom, pinch-to-zoom, Space+drag pan, minimap.
- **P1-010**: Arrow nudge, Tab cycle, Delete, Escape, Ctrl+A/D/C/V.

---

## Sprint 6: DocuDex Phase 2 — Element Properties (P2-001 to P2-007)

- **P2-001**: Advanced color picker (hex/RGB/HSL, eyedropper, brand palette, gradients)
- **P2-002**: Text properties (Google Fonts 500+, line height, letter spacing, text shadow)
- **P2-003**: Shape properties (fill gradients, per-corner radius, shadow, 30+ shapes)
- **P2-004**: Image properties (crop, filters, flip, fit mode, border-radius)
- **P2-005**: Signature element (draw/type/upload modes, SignNow integration)
- **P2-006**: Table properties (merge/split, style presets, drag-resize columns)
- **P2-007**: QR code (local generation, custom colors, center logo)

---

## Sprint 7: DocuDex Phase 3 — Template Library (P3-001 to P3-006)

- **P3-001**: Full-screen Canva-style template gallery with thumbnails and search
- **P3-002**: Automated thumbnail generation pipeline
- **P3-003**: Smart fields `{{variable_name}}` with reactive binding
- **P3-004**: Template persistence in Supabase (templates table with RLS)
- **P3-005**: Expand to 20+ categories, 150+ templates
- **P3-006**: Template marketplace (community + premium, revenue share)

---

## Sprint 8: DocuDex Phase 4 — Enterprise (P4-001 to P4-008)

- **P4-001**: Real-time collaboration (Yjs + Supabase Realtime, live cursors)
- **P4-002**: RBAC (Owner/Editor/Commenter/Viewer, per-element locks)
- **P4-003**: Auto-save + version history in Supabase
- **P4-004**: White-label branding (org logo/colors/fonts/custom domain)
- **P4-005**: Audit trail with hash chain tamper detection
- **P4-006**: PDF export engine (server-side, embedded fonts, PDF/A)
- **P4-007**: Threaded comments with @mentions and resolve/unresolve
- **P4-008**: Document approval workflows (Draft → Review → Approved → Signed)

---

## Sprint 9: DocuDex Phase 5 — Polish (P5-001 to P5-006)

- **P5-001**: Canvas performance (virtual rendering, Web Workers, 60fps at 500+ elements)
- **P5-002**: Micro-interactions (select, drag, drop, toolbar animations)
- **P5-003**: Responsive editor (tablet drawer, mobile bottom bar, touch gestures)
- **P5-004**: WCAG 2.1 AA (keyboard nav, ARIA, focus traps, contrast)
- **P5-005**: Skeleton loaders, error boundaries, offline indicator
- **P5-006**: Interactive onboarding tour (8 steps + contextual tooltips)

---

## Sprint 10: DocuDex Phase 6-7 & Cross-Cutting (P6/P7/CC)

- **P6-001**: Deep SignNow e-signature integration
- **P6-002**: Cloud storage (Google Drive, OneDrive, Dropbox)
- **P6-003**: AI suite (auto-layout, clause detection, compliance checking)
- **P6-004**: Mail merge engine (CSV, batch generation, email delivery)
- **P6-005**: Import/export expansion (PDF import, DOCX/EPUB/SVG/PNG export)
- **P7-001**: Feature gating (Free/Pro/Business/Enterprise tiers)
- **P7-002**: Product analytics and behavior tracking
- **P7-003**: Marketing landing pages and public template gallery
- **P7-004**: REST API and embeddable editor widget
- **CC-001**: Test suite (Vitest unit + Playwright E2E)
- **CC-003**: Security hardening (CSP, rate limiting, magic byte validation)
- **CC-004**: i18n framework (5 languages, RTL support)
- **CC-005**: User and developer documentation

---

## Sprint 11: Service Catalog Verification (PDF Section 4)

Verify all 57 services from the PDF have working routes, intake components, and admin modules. Fill any gaps against the `serviceRegistry`.

---

## Database Migrations Required

- `document_versions` — Auto-save version history
- `templates` — Supabase template persistence with RLS
- `document_permissions` — RBAC roles per document
- `audit_events` — Element-level audit trail with hash chain
- `org_branding` — White-label settings per organization

---

## Key Dependencies

- Sprints 1-3 (animations + design system) are **independent** of DocuDex work
- Sprint 4 (P0 architecture) must complete before Sprints 5-10
- Sprint 5 (canvas engine) depends on Sprint 4 completing
- All sprints respect existing constraints: layered enhancement, semantic tokens, Ohio ORC compliance

## New Libraries Required

`zustand`, `immer`, `fabric`, `@dnd-kit/core`, `@floating-ui/react`, `signature_pad`, `qrcode.react`, `yjs`, `y-supabase`, `react-joyride`, `react-i18next`

