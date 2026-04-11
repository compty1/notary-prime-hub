

# 3D Icon Replacement Plan

## Current State
- The `src/assets/icons-3d/` folder contains 33 AI-generated placeholder icons
- The `src/lib/icon3dMap.tsx` utility exists with mappings but is **not imported anywhere** -- zero pages use it
- All public-facing pages (Index, Services, About, all 6 solution pages, portals) still render flat Lucide icons for feature/service cards
- The uploaded **Notar-2.pdf** contains 30 high-quality professional 3D icons that should replace the generated ones

## Phase 1: Extract and Replace Icon Assets

Copy all 30 icons from the parsed PDF into `src/assets/icons-3d/`, replacing the AI-generated files. Icon-to-filename mapping based on visual inspection:

| PDF Image | Filename | Description |
|-----------|----------|-------------|
| img_p1_1 | checklist.png | Document with green checkmarks |
| img_p1_2 | notary-agent.png | Person with yellow checklist |
| img_p1_3 | identity-verify.png | Person in crosshair target |
| img_p1_4 | doc-shield.png | Document with shield + checkmark |
| img_p1_5 | certificate.png | Clipboard with seal ribbon |
| img_p1_6 | task-list.png | Blue board with 4 checkmarks |
| img_p1_7 | warning.png | Yellow triangle exclamation |
| img_p1_8 | folders.png | Stacked folders with docs |
| img_p1_9 | scroll.png | White scroll with blue text |
| img_p1_10 | doc-search.png | Document with magnifying glass |
| img_p1_11 | receipt.png | Blue receipt with checkmarks |
| img_p1_12 | lightbulb.png | Yellow lightbulb |
| img_p1_13 | handshake.png | Handshake with green check |
| img_p1_14 | verified-badge.png | Green starburst checkmark |
| img_p1_15 | calendar.png | Calendar with clock |
| img_p1_16 | analytics.png | Folder with charts/docs |
| img_p1_17 | folder-verified.png | Yellow folder with blue verified badge |
| img_p1_18 | rocket.png | Rocket with coins launching |
| img_p1_19 | video-call.png | Video conference on monitor |
| img_p1_20 | cloud-upload.png | Cloud with folder arrows |
| img_p1_21 | pie-chart.png | Pie chart with data points |
| img_p1_22 | cloud-security.png | Cloud with shield lock |
| img_p1_23 | award.png | Gold star award badge |
| img_p1_24 | team-review.png | Two people with clipboard |
| img_p1_25 | medal.png | Gold medal with star |
| img_p1_26 | tools.png | Purple wrench/gear tool |
| img_p1_27 | password.png | Monitor with lock/password |
| img_p1_28 | email.png | Orange envelope with notification |
| img_p1_29 | thumbs-up.png | Thumbs up with blue badge |
| img_p1_30 | workflow.png | Process flow with checkmark/star |
| page_1_image_1_v2 | globe-docs.png | Globe with location pin and docs |

## Phase 2: Wire Icons Into Pages

Replace Lucide icon usage with `Icon3D` component across all public-facing pages:

**Files to update (feature/service card icons only -- NOT navigation or functional UI icons):**

1. **`src/pages/Index.tsx`** -- `primaryServices` array, `otherServices`, how-it-works steps, feature cards
2. **`src/pages/Services.tsx`** -- service category cards
3. **`src/pages/About.tsx`** -- values/feature cards
4. **`src/pages/solutions/ForIndividuals.tsx`** -- 6 feature cards
5. **`src/pages/solutions/ForLawFirms.tsx`** -- 6 feature cards
6. **`src/pages/solutions/ForHospitals.tsx`** -- 6 feature cards
7. **`src/pages/solutions/ForRealEstate.tsx`** -- 6 feature cards
8. **`src/pages/solutions/ForSmallBusiness.tsx`** -- 6 feature cards
9. **`src/pages/solutions/ForNotaries.tsx`** -- 6 feature cards
10. **`src/pages/ClientPortal.tsx`** / **`src/components/PortalQuickActions.tsx`** -- quick action cards
11. **`src/pages/RonInfo.tsx`** -- RON feature cards
12. **`src/pages/NotaryGuide.tsx`** -- guide step icons

For each page, the pattern changes from:
```tsx
// Before
<f.icon className="h-6 w-6 text-primary" />

// After
import { Icon3D, FEATURE_3D_ICON } from "@/lib/icon3dMap";
<Icon3D src={FEATURE_3D_ICON.video} alt="Video call" className="h-12 w-12" />
```

Lucide icons will be **kept** for:
- Admin sidebar navigation
- Inline functional icons (ArrowRight, CheckCircle, Loader2, etc.)
- Form controls, buttons, and interactive elements

## Phase 3: Update icon3dMap Mappings

Expand `FEATURE_3D_ICON` and `CATEGORY_3D_ICON` to cover all service types used across pages (vehicle titles, wills, real estate, hospitals, etc.).

## Deliverables
- 31 professional 3D icon PNGs replacing AI-generated ones
- ~12 page files updated to use `Icon3D` component
- Updated `icon3dMap.tsx` with comprehensive mappings
- All Lucide icons retained for functional/navigation use

