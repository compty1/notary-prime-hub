

# Design Studio & Custom Products — Full Implementation Plan

Based on the uploaded 49-page engineering audit, this plan addresses all 67 bugs and 31 missing features across 6 phases.

---

## Phase 0: Foundation & Infrastructure (Sprint 1-2)

### 0.1 Install Real 3D Libraries
- Install `three@>=0.133`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0` (React 18 compatible versions)
- Create base `ProductScene3D` component with proper lighting (ambient + directional), `OrbitControls`, and `Stage` environment

### 0.2 File Upload System
- Create a reusable `DesignFileUpload` component using Supabase Storage (`design-assets` bucket)
- Support drag-and-drop, file type validation (PNG/JPG/SVG/PDF), size limits (10MB)
- Generate thumbnails and return signed URLs
- Wire into all 8 designers replacing dead Upload buttons

### 0.3 Design State Manager
- Create `useDesignState` hook with localStorage persistence + auto-save
- Serializable design config (colors, text, uploaded asset URLs, product options)
- Session recovery on page reload

### 0.4 Cart Integration Bridge
- Create `useDesignCart` hook that bridges designer output → `shop_cart_items` table
- Store full design config as JSON in a new `design_config` JSONB column on cart items
- Wire all 8 "Add to Cart" buttons to persist design data

---

## Phase 1: True 3D Preview Engine (Sprint 2-3)

### 1.1 Replace ProductPreview3D with Real 3D
- Create `ProductScene3D` wrapper: `<Canvas>` + `<Stage>` + `<OrbitControls>` + `<Environment preset="studio">`
- WebGL fallback: detect `WebGLRenderingContext` support, show current CSS preview as fallback

### 1.2 Product-Specific 3D Models (Procedural Geometry)
- **Business Cards**: `<RoundedBox>` at 3.5×2 ratio with `useTexture` for front/back faces mapped from user design
- **Stickers**: `<Circle>`/`<RoundedBox>` geometry with clip-path shapes (star, heart via custom `ShapeGeometry`)
- **Books/Notebooks**: Box geometry with spine thickness, `useTexture` for cover art
- **Apparel**: Flat plane with garment outline SVG, logo placement via `<Decal>` from drei
- **Signage/Banners**: Scaled `<Plane>` at correct aspect ratios (18×24, 3×6ft, etc.)
- **Promo Items**: Product-specific meshes (cylinder for mugs, box for USB drives)
- **Letterhead**: `<Plane>` at 8.5×11 proportions with header/footer layout

### 1.3 Dynamic Texture Mapping
- Render user's design config (text, colors, uploaded logo) to an offscreen `<canvas>` element
- Convert to texture via `CanvasTexture` and map onto 3D geometry in real-time
- Update texture on every form change for live preview

---

## Phase 2: Designer Upgrades (All 8) (Sprint 3-4)

### Per-Designer Fixes (from audit bug list):

**Business Cards** — Add Export PDF via `html2pdf.js`, font family selector (5 fonts), logo upload, QR code generator, bleed line preview
**Stickers** — Fix star/heart shapes (use CSS `clip-path`), add finish options (matte/gloss/holographic), quantity price breaks
**Apparel** — Add size chart, placement area selector (front/back/sleeve), print method options (screen/DTG/embroidery)
**Book Covers** — Spine width calculator from page count, ISBN barcode placement, bleed area visualization
**Letterhead** — Matching envelope designer, watermark toggle, header/footer zones
**Notebooks** — Binding type visual (spiral/perfect/saddle), page count impact on spine, cover finish
**Signage** — Scale ruler/dimensions overlay, material thickness options, mounting hardware selector
**Promo** — Product-specific previews (mug wrap, pen barrel), imprint area indicators, PMS color matching

---

## Phase 3: Checkout & Payment (Sprint 5)

### 3.1 Unified Cart Page
- Create `/cart` page reading from `shop_cart_items` with design previews
- Show 3D thumbnail of each configured product
- Quantity editor, design config summary, subtotal/tax/total

### 3.2 Stripe Checkout Integration
- Wire existing `@stripe/react-stripe-js` to a `create-checkout-session` edge function
- Pass cart items with design config as metadata
- Handle success/cancel redirects, webhook for order creation

---

## Phase 4: True 3D Models (Sprint 6-7) — Optional Enhancement

- Replace procedural geometry with `.glb` models for higher fidelity (mugs, t-shirts, pens)
- Use `useGLTF` from drei for model loading
- Apply user textures via material replacement

---

## Phase 5: Export & Production Files (Sprint 8)

- PDF export for print-ready files with bleed marks
- Design spec sheet generation for vendor fulfillment
- Order-to-vendor handoff via existing vendor fulfillment portal

---

## Database Migration Required

```sql
-- Add design_config to cart items
ALTER TABLE shop_cart_items ADD COLUMN IF NOT EXISTS design_config jsonb DEFAULT '{}';

-- Create design assets storage bucket (via Supabase Storage)
INSERT INTO storage.buckets (id, name, public) VALUES ('design-assets', 'design-assets', false);

-- RLS for design assets
CREATE POLICY "Users can upload their own design assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own design assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## Implementation Priority

| Priority | What | Impact |
|----------|------|--------|
| P0 | File upload system + cart integration | Unblocks all designers |
| P0 | Wire all dead buttons (upload, export, add-to-cart) | 12 critical bugs fixed |
| P1 | Install 3D libs + base ProductScene3D | Real 3D previews |
| P1 | Business card & sticker 3D models | Most-used designers |
| P2 | Remaining 6 designer 3D models | Full coverage |
| P2 | Stripe checkout flow | Revenue capability |
| P3 | GLB models, production exports | Polish |

## Technical Notes
- Three.js versions: `three@>=0.133`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0` (React 18 constraint)
- WebGL fallback preserves current CSS preview for devices without GPU
- All design state persists to localStorage + Supabase on cart add

