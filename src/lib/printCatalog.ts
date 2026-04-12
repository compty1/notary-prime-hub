/**
 * Print Products Catalog — Complete product definitions from spec
 * Covers business cards, stationery, signage, apparel, marketing, legal supplies,
 * books, notebooks, stickers, newsletters, packaging, and promotional items.
 * Includes 3-tier pricing (Basic/Standard/Premium), vendor assignments, margins, and add-ons.
 */

export interface PriceTier {
  tier: "basic" | "standard" | "premium";
  description: string;
  price: number;
  perUnit?: number;
}

export interface AddOn {
  name: string;
  price: number;
}

export interface PrintProduct {
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  base_price: number;
  price_tiers: { qty: number; price: number }[];
  tiered_pricing?: PriceTier[];
  add_ons?: AddOn[];
  options: { name: string; values: string[]; priceModifier?: number }[];
  min_quantity: number;
  turnaround_days: number;
  sort_order: number;
  vendor_assignment?: string;
  vendor_cost_range?: string;
  margin_range?: string;
}

export const PRINT_CATEGORIES = [
  { id: "business-cards", label: "Business Cards", icon: "💼" },
  { id: "stationery", label: "Stationery & Letterhead", icon: "📄" },
  { id: "marketing", label: "Marketing Materials", icon: "📢" },
  { id: "signage", label: "Signs & Banners", icon: "🪧" },
  { id: "apparel", label: "Branded Apparel", icon: "👕" },
  { id: "legal-supplies", label: "Legal & Notary Supplies", icon: "⚖️" },
  { id: "packaging", label: "Packaging & Labels", icon: "📦" },
  { id: "promotional", label: "Promotional Items", icon: "🎁" },
  { id: "books", label: "Books & Publishing", icon: "📚" },
  { id: "notebooks", label: "Notebooks & Pads", icon: "📓" },
  { id: "stickers", label: "Stickers & Decals", icon: "🏷️" },
  { id: "newsletters", label: "Newsletters & Magazines", icon: "📰" },
] as const;

export const PRINT_PRODUCTS: PrintProduct[] = [
  // ═══════════════════════════════════════════════════════
  // Category 1: Business Cards
  // ═══════════════════════════════════════════════════════
  {
    name: "Standard Business Cards",
    category: "business-cards",
    description: "Professional custom business cards printed on premium cardstock with your choice of finish. Full-color CMYK printing with razor-sharp detail.",
    base_price: 49,
    price_tiers: [{ qty: 250, price: 0.20 }, { qty: 500, price: 0.18 }, { qty: 1000, price: 0.15 }, { qty: 2500, price: 0.12 }],
    tiered_pricing: [
      { tier: "basic", description: "250 cards, 14pt cardstock, matte finish, single-sided (4/0)", price: 49 },
      { tier: "standard", description: "500 cards, 16pt cardstock, gloss UV, double-sided (4/4)", price: 89 },
      { tier: "premium", description: "500 cards, 18pt cotton, soft-touch lamination + spot UV, double-sided (4/4)", price: 149 },
    ],
    add_ons: [
      { name: "Foil Stamping", price: 35 },
      { name: "Embossing", price: 25 },
      { name: "Edge Painting", price: 30 },
      { name: "Rounded Corners", price: 10 },
      { name: "Die-Cut Shapes", price: 45 },
    ],
    options: [
      { name: "Size", values: ["3.5x2 (Standard)", "2.75x1 (Mini)", "2.5x2.5 (Square)"] },
      { name: "Material", values: ["14pt Cardstock", "16pt Cardstock", "18pt+ Cotton/Linen"] },
      { name: "Finish", values: ["Matte", "Gloss UV", "Soft-Touch Lamination", "Spot UV"] },
      { name: "Printing", values: ["Single-Sided (4/0)", "Double-Sided (4/4)"] },
    ],
    min_quantity: 250,
    turnaround_days: 3,
    sort_order: 1,
    vendor_assignment: "Capitol Square Printing (primary), Campus Printing (overflow)",
    vendor_cost_range: "$13–$50",
    margin_range: "55–70%",
  },
  {
    name: "Luxury / Specialty Business Cards",
    category: "business-cards",
    description: "Ultra-premium business cards — sandwich cards with colored cores, metal cards, wood cards, and transparent options. For entrepreneurs and executives who demand materials as bold as their vision.",
    base_price: 79,
    price_tiers: [{ qty: 100, price: 0.79 }, { qty: 250, price: 0.64 }, { qty: 500, price: 0.50 }],
    tiered_pricing: [
      { tier: "basic", description: "100 cards, sandwich 39pt with colored core, single-sided", price: 79 },
      { tier: "standard", description: "250 cards, sandwich 52pt, foil stamping, double-sided", price: 159 },
      { tier: "premium", description: "250 cards, metal or wood, laser engraving + foil", price: 299 },
    ],
    add_ons: [
      { name: "Foil Stamping", price: 35 },
      { name: "Laser Engraving", price: 50 },
      { name: "Letterpress", price: 40 },
    ],
    options: [
      { name: "Material", values: ["Sandwich 39pt (Colored Core)", "Sandwich 52pt", "Metal (Stainless Steel)", "Metal (Brass)", "Wood (Maple)", "Wood (Bamboo)", "Transparent PVC", "Textured Linen"] },
      { name: "Core Color", values: ["Red", "Blue", "Green", "Gold", "Black"] },
      { name: "Finish", values: ["Foil Stamping", "Laser Engraving", "Spot UV", "Embossing", "Letterpress"] },
    ],
    min_quantity: 100,
    turnaround_days: 5,
    sort_order: 2,
    vendor_assignment: "Custom Imprint (specialty)",
    vendor_cost_range: "$35–$160",
    margin_range: "50–60%",
  },
  {
    name: "NFC Smart Business Cards",
    category: "business-cards",
    description: "Tap-to-share digital business card with embedded NFC chip",
    base_price: 14.99,
    price_tiers: [{ qty: 1, price: 14.99 }, { qty: 5, price: 11.99 }, { qty: 10, price: 9.99 }],
    options: [{ name: "Material", values: ["PVC", "Metal", "Wood"] }],
    min_quantity: 1,
    turnaround_days: 7,
    sort_order: 3,
  },

  // ═══════════════════════════════════════════════════════
  // Category 2: Custom Stickers & Labels
  // ═══════════════════════════════════════════════════════
  {
    name: "Die-Cut Vinyl Stickers",
    category: "stickers",
    description: "Premium weatherproof vinyl stickers die-cut to any shape. UV-protected, scratch-resistant, and dishwasher-safe — built to last on laptops, water bottles, car bumpers, and anywhere your brand goes.",
    base_price: 39,
    price_tiers: [{ qty: 100, price: 0.39 }, { qty: 250, price: 0.28 }, { qty: 500, price: 0.26 }, { qty: 1000, price: 0.15 }, { qty: 5000, price: 0.08 }],
    tiered_pricing: [
      { tier: "basic", description: "100 stickers, 3\"x3\", gloss vinyl, circle/square", price: 39 },
      { tier: "standard", description: "250 stickers, 3\"x3\", matte vinyl, custom die-cut shape", price: 69 },
      { tier: "premium", description: "500 stickers, 4\"x4\", holographic finish, custom die-cut", price: 129 },
    ],
    options: [
      { name: "Size", values: ["2\"x2\"", "3\"x3\"", "4\"x4\"", "5\"x5\"", "Custom (up to 10\"x10\")"] },
      { name: "Shape", values: ["Die-cut to contour", "Circle", "Square", "Oval", "Rectangle", "Custom Contour"] },
      { name: "Finish", values: ["Gloss", "Matte", "Holographic", "Transparent/Clear"] },
    ],
    min_quantity: 100,
    turnaround_days: 5,
    sort_order: 100,
    vendor_assignment: "Custom Imprint (primary)",
    vendor_cost_range: "$0.09–$0.23/ea",
    margin_range: "50–65%",
  },
  {
    name: "Sticker Sheets & Labels",
    category: "stickers",
    description: "Professional kiss-cut sticker sheets and product labels for branding, packaging, and organization. Ideal for product labels, QR code stickers, and promotional sheets.",
    base_price: 49,
    price_tiers: [{ qty: 100, price: 0.49 }, { qty: 250, price: 0.40 }, { qty: 500, price: 0.36 }],
    tiered_pricing: [
      { tier: "basic", description: "100 sheets, 4 stickers/sheet, kiss-cut, gloss vinyl", price: 49 },
      { tier: "standard", description: "250 sheets, 6 stickers/sheet, custom layout, matte", price: 99 },
      { tier: "premium", description: "500 sheets, custom layout + shapes, holographic accents", price: 179 },
    ],
    options: [
      { name: "Size", values: ["4x6 Sheet", "8.5x11 Sheet"] },
      { name: "Material", values: ["Paper", "Vinyl", "Clear Vinyl"] },
      { name: "Finish", values: ["Gloss", "Matte", "Holographic"] },
    ],
    min_quantity: 100,
    turnaround_days: 5,
    sort_order: 101,
    vendor_cost_range: "$0.18–$0.45/sheet",
    margin_range: "55–65%",
  },
  {
    name: "Bumper Stickers",
    category: "stickers",
    description: "Heavy-duty weather-resistant outdoor vinyl stickers built for bumpers, windows, and outdoor signage. 5+ year outdoor durability with UV-resistant inks.",
    base_price: 49,
    price_tiers: [{ qty: 25, price: 1.96 }, { qty: 50, price: 1.58 }, { qty: 100, price: 1.29 }],
    tiered_pricing: [
      { tier: "basic", description: "25 stickers, 3\"x10\", outdoor vinyl, full color", price: 49 },
      { tier: "standard", description: "50 stickers, 4\"x8\", outdoor vinyl, custom die-cut", price: 79 },
      { tier: "premium", description: "100 stickers, custom size, premium outdoor vinyl, laminated", price: 129 },
    ],
    options: [
      { name: "Size", values: ["3\"x10\"", "4\"x8\"", "Custom Size"] },
      { name: "Finish", values: ["Gloss", "Matte"] },
    ],
    min_quantity: 25,
    turnaround_days: 5,
    sort_order: 102,
    vendor_cost_range: "$0.55–$1.20/ea",
    margin_range: "50–60%",
  },
  {
    name: "Vehicle Magnets",
    category: "stickers",
    description: "Removable magnetic signs for cars and trucks",
    base_price: 24.99,
    price_tiers: [{ qty: 1, price: 24.99 }, { qty: 2, price: 19.99 }],
    options: [{ name: "Size", values: ["12x18", "12x24", "18x24"] }, { name: "Corners", values: ["Square", "Rounded"] }],
    min_quantity: 1,
    turnaround_days: 5,
    sort_order: 103,
  },
  {
    name: "Floor Decals",
    category: "stickers",
    description: "Anti-slip floor graphics for office or event branding",
    base_price: 9.99,
    price_tiers: [{ qty: 5, price: 9.99 }, { qty: 10, price: 7.99 }, { qty: 25, price: 5.99 }],
    options: [{ name: "Shape", values: ["Circle", "Rectangle", "Custom"] }, { name: "Size", values: ["12 inch", "18 inch", "24 inch"] }],
    min_quantity: 5,
    turnaround_days: 5,
    sort_order: 104,
  },

  // ═══════════════════════════════════════════════════════
  // Category 3: Custom Notebooks, Memo Pads & Post-It Notes
  // ═══════════════════════════════════════════════════════
  {
    name: "Custom Branded Notebooks",
    category: "notebooks",
    description: "Premium custom-branded notebooks with your logo, colors, and identity — from foil-stamped covers to custom-printed interior pages. Perfect for corporate gifts, employee onboarding kits, and branded merchandise.",
    base_price: 149,
    price_tiers: [{ qty: 25, price: 5.96 }, { qty: 50, price: 6.98 }, { qty: 100, price: 6.99 }],
    tiered_pricing: [
      { tier: "basic", description: "25 notebooks, A5, soft cover, 50pg lined, logo on cover", price: 149, perUnit: 5.96 },
      { tier: "standard", description: "50 notebooks, A5, hard cover, 100pg, logo foil stamp, branded interior header", price: 349, perUnit: 6.98 },
      { tier: "premium", description: "100 notebooks, A5, faux leather, 150pg, custom interior layout, belly band, ribbon bookmark", price: 699, perUnit: 6.99 },
    ],
    options: [
      { name: "Size", values: ["A5 (5.5\"x8.5\")", "A4 (8.5\"x11\")", "Pocket (3.5\"x5.5\")"] },
      { name: "Cover", values: ["Soft Cover (Matte)", "Soft Cover (Gloss)", "Hard Cover (Cloth)", "Hard Cover (Faux Leather)", "Hard Cover (Printed Board)", "Spiral-Bound"] },
      { name: "Interior", values: ["Blank", "Lined", "Dot Grid", "Graph", "Custom-Printed Pages"] },
      { name: "Pages", values: ["50", "100", "150", "200"] },
    ],
    min_quantity: 25,
    turnaround_days: 7,
    sort_order: 90,
    vendor_assignment: "Kenwel Printers (primary), The Printed Image (hardcover)",
  },
  {
    name: "Custom Memo Pads / Scratch Pads",
    category: "notebooks",
    description: "Custom-printed memo pads with chipboard backer — full-color printing keeps your brand on every desk. Available with magnetic strip for refrigerators and filing cabinets.",
    base_price: 89,
    price_tiers: [{ qty: 50, price: 1.78 }, { qty: 100, price: 1.99 }, { qty: 250, price: 1.80 }],
    tiered_pricing: [
      { tier: "basic", description: "50 pads, 4.25\"x5.5\", 25 sheets, 1 color, chipboard backer", price: 89, perUnit: 1.78 },
      { tier: "standard", description: "100 pads, 5.5\"x8.5\", 50 sheets, full color, chipboard backer", price: 199, perUnit: 1.99 },
      { tier: "premium", description: "250 pads, custom size, 100 sheets, full color, magnetic strip backing", price: 449, perUnit: 1.80 },
    ],
    add_ons: [
      { name: "Magnetic Backing", price: 0.15 },
      { name: "Heavy Chipboard", price: 0.08 },
      { name: "Custom Shape Die-Cut", price: 0.25 },
    ],
    options: [
      { name: "Size", values: ["3.5\"x4.25\"", "4.25\"x5.5\"", "5.5\"x8.5\"", "8.5\"x11\"", "3.5\"x8.5\" (List)", "4\"x11\""] },
      { name: "Sheets per Pad", values: ["25", "50", "100"] },
      { name: "Paper", values: ["20# White (Standard)", "28# White (Premium)"] },
    ],
    min_quantity: 50,
    turnaround_days: 5,
    sort_order: 91,
    vendor_assignment: "Kenwel Printers",
    vendor_cost_range: "$0.60–$1.10/pad",
    margin_range: "55–65%",
  },
  {
    name: "Custom Post-It Style Notes",
    category: "notebooks",
    description: "Repositionable adhesive-backed sticky notes with full-color custom printing. Your brand on every desk, meeting, and idea. Min order 250 pads.",
    base_price: 199,
    price_tiers: [{ qty: 250, price: 0.80 }, { qty: 500, price: 0.80 }, { qty: 1000, price: 0.75 }],
    tiered_pricing: [
      { tier: "basic", description: "250 pads, 3\"x3\", 25 sheets, 1 color print", price: 199 },
      { tier: "standard", description: "500 pads, 3\"x3\", 50 sheets, full color", price: 399 },
      { tier: "premium", description: "1,000 pads, 4\"x4\", 50 sheets, full color, custom shape die-cut", price: 749 },
    ],
    options: [
      { name: "Size", values: ["3\"x3\"", "4\"x4\"", "3\"x5\""] },
      { name: "Sheets per Pad", values: ["25", "50", "100"] },
    ],
    min_quantity: 250,
    turnaround_days: 7,
    sort_order: 92,
    vendor_cost_range: "$0.30–$0.55/pad",
    margin_range: "55–62%",
  },
  {
    name: "Desk Pads & Planners",
    category: "notebooks",
    description: "Custom weekly/monthly desk planners with tear-off sheets",
    base_price: 6.99,
    price_tiers: [{ qty: 10, price: 6.99 }, { qty: 25, price: 5.49 }],
    options: [{ name: "Format", values: ["Weekly", "Monthly", "Daily"] }, { name: "Size", values: ["8.5x11", "11x17"] }],
    min_quantity: 10,
    turnaround_days: 7,
    sort_order: 93,
  },

  // ═══════════════════════════════════════════════════════
  // Category 4: Book Printing & Publishing
  // ═══════════════════════════════════════════════════════
  {
    name: "Softcover / Paperback Books",
    category: "books",
    description: "Professional paperback books with perfect binding or saddle-stitch. Full-color laminated covers with B&W or full-color interior. Local production means faster proofs.",
    base_price: 249,
    price_tiers: [{ qty: 25, price: 9.96 }, { qty: 100, price: 4.99 }, { qty: 250, price: 3.60 }],
    tiered_pricing: [
      { tier: "basic", description: "25 copies, 6\"x9\", 150pg B&W interior, perfect bound, matte cover", price: 249, perUnit: 9.96 },
      { tier: "standard", description: "100 copies, 6\"x9\", 150pg B&W, perfect bound, gloss cover", price: 499, perUnit: 4.99 },
      { tier: "premium", description: "250 copies, 6\"x9\", 150pg B&W, perfect bound, ISBN assignment, barcode", price: 899, perUnit: 3.60 },
    ],
    options: [
      { name: "Trim Size", values: ["5.5\"x8.5\"", "6\"x9\"", "8.5\"x11\""] },
      { name: "Binding", values: ["Perfect Binding", "Saddle Stitch (under 80pg)"] },
      { name: "Interior", values: ["B&W (50-60# offset)", "Full Color (80# gloss/matte)"] },
      { name: "Cover", values: ["Gloss Lamination", "Matte Lamination"] },
    ],
    min_quantity: 25,
    turnaround_days: 10,
    sort_order: 80,
    vendor_assignment: "The Printed Image (primary), Zip Print (secondary)",
    margin_range: "55–65%",
  },
  {
    name: "Hardcover Books",
    category: "books",
    description: "Premium hardcover books with case binding, optional cloth covers, and dust jackets. The gold standard for memoirs, business books, and gift editions.",
    base_price: 449,
    price_tiers: [{ qty: 25, price: 17.96 }, { qty: 100, price: 12.99 }, { qty: 250, price: 9.99 }],
    tiered_pricing: [
      { tier: "basic", description: "25 copies, 6\"x9\", 150pg B&W, printed case wrap", price: 449, perUnit: 17.96 },
      { tier: "standard", description: "100 copies, 6\"x9\", 200pg B&W, cloth cover (blue/black), dust jacket", price: 1299, perUnit: 12.99 },
      { tier: "premium", description: "250 copies, 6\"x9\", 200pg, cloth cover, dust jacket, ISBN + barcode, author bio page", price: 2499, perUnit: 9.99 },
    ],
    options: [
      { name: "Size", values: ["6x9", "8.5x11", "8x10"] },
      { name: "Cover", values: ["Printed Case", "Cloth", "Leather"] },
      { name: "Dust Jacket", values: ["None", "Glossy", "Matte"] },
    ],
    min_quantity: 10,
    turnaround_days: 14,
    sort_order: 81,
    vendor_assignment: "AlphaGraphics (primary hardcover), The Printed Image",
    margin_range: "50–60%",
  },
  {
    name: "Coffee Table Books",
    category: "books",
    description: "Oversized, full-color hardcover books on premium heavy paper — the ultimate showcase for photography, art, and brand storytelling. Lay-flat binding available.",
    base_price: 449,
    price_tiers: [{ qty: 10, price: 44.90 }, { qty: 25, price: 39.96 }, { qty: 50, price: 49.98 }],
    tiered_pricing: [
      { tier: "basic", description: "10 copies, 8.5\"x11\", 60pg full color, 100# gloss, printed hardcover", price: 449, perUnit: 44.90 },
      { tier: "standard", description: "25 copies, 10\"x10\" square, 100pg, hardcover + dust jacket, 80# matte", price: 999, perUnit: 39.96 },
      { tier: "premium", description: "50 copies, 11\"x14\" landscape, 150pg, lay-flat binding, dust jacket, slipcase", price: 2499, perUnit: 49.98 },
    ],
    options: [
      { name: "Size", values: ["8.5\"x11\"", "10\"x10\"", "11\"x14\" Landscape", "12\"x12\""] },
      { name: "Paper", values: ["Satin", "Glossy", "Lustre"] },
    ],
    min_quantity: 5,
    turnaround_days: 14,
    sort_order: 82,
    vendor_assignment: "The Printed Image, AlphaGraphics",
    margin_range: "45–55%",
  },
  {
    name: "Guides, Manuals & Training Books",
    category: "books",
    description: "Spiral/wire-o/comb-bound reference materials for employee handbooks, training manuals, how-to guides, and SOPs. Tabbed dividers and laminated covers available.",
    base_price: 149,
    price_tiers: [{ qty: 25, price: 5.96 }, { qty: 50, price: 7.98 }, { qty: 100, price: 7.49 }],
    tiered_pricing: [
      { tier: "basic", description: "25 copies, 8.5\"x11\", 50pg, comb bound, card stock cover", price: 149, perUnit: 5.96 },
      { tier: "standard", description: "50 copies, 8.5\"x11\", 100pg, wire-o, laminated cover, tabbed dividers", price: 399, perUnit: 7.98 },
      { tier: "premium", description: "100 copies, 8.5\"x11\", 150pg, wire-o, laminated cover, tabs, inside pocket folder", price: 749, perUnit: 7.49 },
    ],
    options: [
      { name: "Binding", values: ["Comb", "Wire-O", "Spiral", "3-Ring"] },
      { name: "Cover", values: ["Card Stock", "Laminated"] },
      { name: "Pages", values: ["50", "100", "150", "200"] },
    ],
    min_quantity: 25,
    turnaround_days: 7,
    sort_order: 83,
    vendor_assignment: "Zip Print (primary), The Printed Image",
    margin_range: "55–65%",
  },
  {
    name: "Novels & Creative Writing",
    category: "books",
    description: "Professional-quality novel printing for self-published authors. Industry-standard trims, cream/white paper, ISBN, barcode, and marketplace listing support.",
    base_price: 19.99,
    price_tiers: [{ qty: 1, price: 19.99 }, { qty: 50, price: 6.98 }, { qty: 100, price: 6.49 }],
    tiered_pricing: [
      { tier: "basic", description: "1 proof copy, softcover, 6\"x9\", up to 300 pages", price: 19.99, perUnit: 19.99 },
      { tier: "standard", description: "50 copies, softcover, 5.5\"x8.5\" or 6\"x9\", ISBN assignment, barcode", price: 349, perUnit: 6.98 },
      { tier: "premium", description: "100 copies, softcover, ISBN, Amazon/IngramSpark listing assistance, author page setup", price: 649, perUnit: 6.49 },
    ],
    options: [
      { name: "Trim", values: ["5.5\"x8.5\"", "6\"x9\""] },
      { name: "Paper", values: ["Cream 60lb", "White 60lb"] },
      { name: "Add-Ons", values: ["None", "ISBN + Barcode", "ISBN + Amazon Listing"] },
    ],
    min_quantity: 1,
    turnaround_days: 10,
    sort_order: 84,
    vendor_assignment: "Zip Print / Biblio Publishing",
    margin_range: "50–60%",
  },
  {
    name: "Self-Publishing Package",
    category: "books",
    description: "Complete self-publishing: ISBN, formatting, cover design, and print-on-demand setup",
    base_price: 299.99,
    price_tiers: [{ qty: 1, price: 299.99 }],
    options: [{ name: "Format", values: ["Softcover Only", "Hardcover Only", "Both Formats"] }, { name: "Distribution", values: ["Print Only", "Print + eBook"] }],
    min_quantity: 1,
    turnaround_days: 21,
    sort_order: 85,
  },
  {
    name: "Booklets & Catalogs",
    category: "books",
    description: "Saddle-stitched or perfect-bound booklets and catalogs",
    base_price: 1.49,
    price_tiers: [{ qty: 50, price: 1.49 }, { qty: 100, price: 1.19 }, { qty: 250, price: 0.89 }],
    options: [{ name: "Size", values: ["5.5x8.5", "8.5x11"] }, { name: "Binding", values: ["Saddle-Stitch", "Perfect Bound"] }],
    min_quantity: 50,
    turnaround_days: 7,
    sort_order: 86,
  },

  // ═══════════════════════════════════════════════════════
  // Category 5: Newsletters & Periodicals
  // ═══════════════════════════════════════════════════════
  {
    name: "Printed Newsletters",
    category: "newsletters",
    description: "Professional printed newsletters for businesses, churches, schools, HOAs, and nonprofits. Integrated mailing services available — we print, fold, address, and mail for you.",
    base_price: 49,
    price_tiers: [{ qty: 100, price: 0.49 }, { qty: 250, price: 1.00 }, { qty: 500, price: 1.10 }],
    tiered_pricing: [
      { tier: "basic", description: "100 copies, 4 pages, B&W, folded", price: 49 },
      { tier: "standard", description: "250 copies, 8 pages, full color, folded", price: 249 },
      { tier: "premium", description: "500 copies, 12 pages, full color, soft-fold, mailing services included", price: 549 },
    ],
    add_ons: [{ name: "Mailing Services (pre-sort)", price: 0.20 }],
    options: [
      { name: "Pages", values: ["4", "8", "12", "16"] },
      { name: "Size", values: ["8.5\"x11\" (folded from 11\"x17\")"] },
      { name: "Paper", values: ["80# Gloss Text", "80# Matte Text", "100# Gloss Text (Premium)"] },
      { name: "Printing", values: ["Full Color Both Sides (4/4)", "B&W"] },
    ],
    min_quantity: 100,
    turnaround_days: 5,
    sort_order: 110,
    vendor_assignment: "Inskeep Printing (primary), Kenwel Printers (bulk)",
    margin_range: "55–65%",
  },
  {
    name: "Magazine / Catalog Printing",
    category: "newsletters",
    description: "Professional magazine and catalog printing with saddle-stitch or perfect binding. Full color throughout on premium paper.",
    base_price: 249,
    price_tiers: [{ qty: 50, price: 4.98 }, { qty: 100, price: 5.49 }, { qty: 250, price: 4.80 }],
    tiered_pricing: [
      { tier: "basic", description: "50 copies, 16pg, saddle-stitched, 80# gloss text", price: 249 },
      { tier: "standard", description: "100 copies, 32pg, saddle-stitched, 100# gloss text, gloss cover", price: 549 },
      { tier: "premium", description: "250 copies, 48pg, perfect bound, premium paper, laminated cover", price: 1199 },
    ],
    options: [
      { name: "Pages", values: ["16", "24–48", "49–96", "97–200"] },
      { name: "Size", values: ["8.5x11", "5.5x8.5"] },
      { name: "Cover", values: ["Self-Cover", "Plus Cover (Heavier)"] },
    ],
    min_quantity: 50,
    turnaround_days: 10,
    sort_order: 111,
    vendor_assignment: "The Printed Image",
    margin_range: "50–60%",
  },

  // ═══════════════════════════════════════════════════════
  // Category 6: Promotional Print Products
  // ═══════════════════════════════════════════════════════
  {
    name: "Flyers & Brochures",
    category: "marketing",
    description: "Full-color flyers and brochures on quality stock — single-sided flyers to tri-fold brochures.",
    base_price: 39,
    price_tiers: [{ qty: 100, price: 0.39 }, { qty: 250, price: 0.52 }, { qty: 500, price: 0.50 }],
    tiered_pricing: [
      { tier: "basic", description: "100 flyers, 8.5\"x11\", single-sided, full color, 80# gloss text", price: 39 },
      { tier: "standard", description: "250 tri-fold brochures, full color both sides, 100# gloss text", price: 129 },
      { tier: "premium", description: "500 brochures, tri-fold, spot UV on cover, premium 120# stock", price: 249 },
    ],
    options: [
      { name: "Size", values: ["8.5x11", "5.5x8.5", "4x6"] },
      { name: "Fold", values: ["None (Flat)", "Tri-Fold", "Bi-Fold", "Z-Fold"] },
      { name: "Paper", values: ["80lb Gloss", "100lb Matte"] },
      { name: "Sides", values: ["Single", "Double"] },
    ],
    min_quantity: 100,
    turnaround_days: 3,
    sort_order: 20,
  },
  {
    name: "Postcards & Mailers",
    category: "marketing",
    description: "Full-color postcards for direct mail campaigns with USPS-compliant formatting.",
    base_price: 59,
    price_tiers: [{ qty: 250, price: 0.24 }, { qty: 500, price: 0.26 }, { qty: 1000, price: 0.45 }],
    tiered_pricing: [
      { tier: "basic", description: "250 postcards, 4\"x6\", 14pt cardstock, full color both sides", price: 59 },
      { tier: "standard", description: "500 postcards, 6\"x9\", 16pt, gloss UV front, USPS-compliant", price: 129 },
      { tier: "premium", description: "1,000 postcards, 6\"x11\", 16pt, spot UV, mailing list + postage", price: 449 },
    ],
    options: [
      { name: "Size", values: ["4\"x6\"", "5\"x7\"", "6\"x9\"", "6\"x11\""] },
      { name: "Coating", values: ["UV Gloss Front", "Matte Both Sides"] },
    ],
    min_quantity: 250,
    turnaround_days: 3,
    sort_order: 22,
  },
  {
    name: "Letterhead, Envelopes & Stationery Sets",
    category: "stationery",
    description: "Professional letterhead and matching envelopes — create a cohesive brand suite.",
    base_price: 99,
    price_tiers: [{ qty: 1, price: 99.00 }, { qty: 1, price: 229.00 }, { qty: 1, price: 399.00 }],
    tiered_pricing: [
      { tier: "basic", description: "250 letterhead (8.5\"x11\", 24# bond) + 250 #10 envelopes", price: 99 },
      { tier: "standard", description: "500 letterhead + 500 #10 envelopes + 500 standard business cards, matching design", price: 229 },
      { tier: "premium", description: "1,000 letterhead (28# premium) + 1,000 envelopes + 500 premium business cards, cohesive brand suite", price: 399 },
    ],
    options: [
      { name: "Paper", values: ["24# Bond (Standard)", "28# Premium", "Cotton/Linen"] },
      { name: "Envelope Window", values: ["No Window", "Single Window"] },
    ],
    min_quantity: 250,
    turnaround_days: 5,
    sort_order: 10,
    vendor_assignment: "Capitol Square Printing, Kenwel Printers",
  },
  {
    name: "Posters & Signage",
    category: "signage",
    description: "Full-color posters on heavy paper, cardstock, or foam board with optional lamination and mounting.",
    base_price: 49,
    price_tiers: [{ qty: 10, price: 4.90 }, { qty: 25, price: 5.96 }, { qty: 10, price: 19.90 }],
    tiered_pricing: [
      { tier: "basic", description: "10 posters, 18\"x24\", heavy paper, full color", price: 49 },
      { tier: "standard", description: "25 posters, 24\"x36\", cardstock, laminated, full color", price: 149 },
      { tier: "premium", description: "10 foam board signs, 24\"x36\", mounted, full color, weather-resistant", price: 199 },
    ],
    options: [
      { name: "Size", values: ["18\"x24\"", "24\"x36\""] },
      { name: "Material", values: ["Heavy Paper", "Cardstock Laminated", "Foam Board Mounted"] },
    ],
    min_quantity: 10,
    turnaround_days: 3,
    sort_order: 30,
  },
  {
    name: "Wall Calendars",
    category: "marketing",
    description: "Custom wall calendars with 12 monthly photos and custom event dates. Coil or saddle-stitch bound.",
    base_price: 199,
    price_tiers: [{ qty: 25, price: 7.96 }, { qty: 50, price: 7.98 }, { qty: 100, price: 6.99 }],
    tiered_pricing: [
      { tier: "basic", description: "25 wall calendars (11\"x17\" folded), 12 months + cover, saddle-stitched", price: 199 },
      { tier: "standard", description: "50 wall calendars, custom photos, coil bound, 100# gloss paper", price: 399 },
      { tier: "premium", description: "100 wall calendars, premium paper, custom photos, branded header/footer, custom event dates", price: 699 },
    ],
    options: [
      { name: "Size", values: ["8.5x11", "11x17"] },
      { name: "Binding", values: ["Saddle-Stitch", "Coil Bound"] },
      { name: "Paper", values: ["80lb Gloss", "100lb Gloss"] },
    ],
    min_quantity: 25,
    turnaround_days: 7,
    sort_order: 25,
    vendor_assignment: "Kenwel Printers",
    margin_range: "55–65%",
  },
  {
    name: "Door Hangers",
    category: "marketing",
    description: "Die-cut door hangers for local marketing",
    base_price: 0.20,
    price_tiers: [{ qty: 250, price: 0.20 }, { qty: 500, price: 0.16 }, { qty: 1000, price: 0.12 }],
    options: [{ name: "Sides", values: ["Single", "Double"] }],
    min_quantity: 250,
    turnaround_days: 3,
    sort_order: 23,
  },
  {
    name: "Rack Cards",
    category: "marketing",
    description: "4x9 display cards for offices and lobbies",
    base_price: 0.18,
    price_tiers: [{ qty: 250, price: 0.18 }, { qty: 500, price: 0.14 }, { qty: 1000, price: 0.10 }],
    options: [{ name: "Finish", values: ["Glossy", "Matte", "Soft Touch"] }],
    min_quantity: 250,
    turnaround_days: 3,
    sort_order: 24,
  },

  // ═══════════════════════════════════════════════════════
  // Category 7: Custom Packaging & Branded Materials
  // ═══════════════════════════════════════════════════════
  {
    name: "Custom Branded Boxes & Mailers",
    category: "packaging",
    description: "Custom corrugated shipping boxes and mailer boxes with full-color branding. Create a premium unboxing experience.",
    base_price: 249,
    price_tiers: [{ qty: 50, price: 4.98 }, { qty: 100, price: 5.49 }, { qty: 250, price: 4.80 }],
    tiered_pricing: [
      { tier: "basic", description: "50 mailer boxes, 1-color logo, standard size (10\"x8\"x4\")", price: 249 },
      { tier: "standard", description: "100 mailer boxes, full color exterior, custom size to spec", price: 549 },
      { tier: "premium", description: "250 mailer boxes, full color inside & outside, custom tissue paper, branded insert cards", price: 1199 },
    ],
    options: [
      { name: "Size", values: ["Small (8x6x3)", "Medium (12x9x4)", "Large (14x12x6)", "Custom"] },
    ],
    min_quantity: 50,
    turnaround_days: 10,
    sort_order: 60,
    vendor_assignment: "Jet Container",
    margin_range: "45–55%",
  },
  {
    name: "Branded Tape, Tissue Paper & Inserts",
    category: "packaging",
    description: "Complete branded packaging materials — packing tape, tissue paper, and thank-you insert cards.",
    base_price: 79,
    price_tiers: [{ qty: 6, price: 13.17 }, { qty: 1, price: 199.00 }, { qty: 1, price: 399.00 }],
    tiered_pricing: [
      { tier: "basic", description: "6 rolls branded packing tape (2\" x 110 yds), 1 color logo", price: 79 },
      { tier: "standard", description: "6 rolls branded tape + 500 sheets custom tissue paper (20\"x30\")", price: 199 },
      { tier: "premium", description: "12 rolls tape + 1,000 tissue sheets + 500 branded insert/thank-you cards", price: 399 },
    ],
    options: [
      { name: "Tape Width", values: ["2 inch", "3 inch"] },
      { name: "Colors", values: ["1 Color", "2 Color", "Full Color"] },
    ],
    min_quantity: 6,
    turnaround_days: 10,
    sort_order: 61,
  },
  {
    name: "Shipping Labels",
    category: "packaging",
    description: "Branded shipping labels for parcels",
    base_price: 0.08,
    price_tiers: [{ qty: 500, price: 0.08 }, { qty: 1000, price: 0.06 }],
    options: [{ name: "Size", values: ["2x4", "4x6"] }],
    min_quantity: 500,
    turnaround_days: 3,
    sort_order: 62,
  },
  {
    name: "Custom Poly Mailers",
    category: "packaging",
    description: "Branded poly mailer bags for shipping documents",
    base_price: 0.25,
    price_tiers: [{ qty: 100, price: 0.25 }, { qty: 250, price: 0.18 }, { qty: 500, price: 0.14 }],
    options: [{ name: "Size", values: ["6x9", "10x13", "12x15.5", "14.5x19"] }],
    min_quantity: 100,
    turnaround_days: 10,
    sort_order: 63,
  },

  // ═══════════════════════════════════════════════════════
  // Signage
  // ═══════════════════════════════════════════════════════
  {
    name: "Yard Signs",
    category: "signage",
    description: "Corrugated plastic with H-stake",
    base_price: 12.99,
    price_tiers: [{ qty: 1, price: 12.99 }, { qty: 5, price: 9.99 }, { qty: 10, price: 7.99 }],
    options: [{ name: "Size", values: ["18x24", "24x36"] }, { name: "Sides", values: ["Single", "Double"] }],
    min_quantity: 1,
    turnaround_days: 3,
    sort_order: 31,
  },
  {
    name: "Vinyl Banners",
    category: "signage",
    description: "13oz scrim vinyl with grommets",
    base_price: 3.50,
    price_tiers: [{ qty: 1, price: 3.50 }],
    options: [{ name: "Size (ft)", values: ["2x4", "3x6", "4x8", "Custom"] }, { name: "Finishing", values: ["Grommets", "Pole Pockets", "Hemmed"] }],
    min_quantity: 1,
    turnaround_days: 3,
    sort_order: 32,
  },
  {
    name: "Window Decals",
    category: "signage",
    description: "Custom vinyl decals for office windows",
    base_price: 19.99,
    price_tiers: [{ qty: 1, price: 19.99 }, { qty: 5, price: 14.99 }],
    options: [{ name: "Type", values: ["Clear", "White", "Frosted", "Perforated"] }],
    min_quantity: 1,
    turnaround_days: 5,
    sort_order: 33,
  },
  {
    name: "A-Frame Sidewalk Signs",
    category: "signage",
    description: "Double-sided A-frame with custom inserts",
    base_price: 89.99,
    price_tiers: [{ qty: 1, price: 89.99 }],
    options: [{ name: "Size", values: ["24x36", "22x28"] }],
    min_quantity: 1,
    turnaround_days: 5,
    sort_order: 34,
  },

  // ═══════════════════════════════════════════════════════
  // Apparel
  // ═══════════════════════════════════════════════════════
  {
    name: "Custom T-Shirts",
    category: "apparel",
    description: "Branded crew neck t-shirts",
    base_price: 14.99,
    price_tiers: [{ qty: 12, price: 14.99 }, { qty: 24, price: 11.99 }, { qty: 48, price: 9.99 }],
    options: [{ name: "Color", values: ["White", "Black", "Navy", "Gray"] }, { name: "Print Method", values: ["Screen Print", "DTG", "Embroidered"] }],
    min_quantity: 12,
    turnaround_days: 7,
    sort_order: 40,
  },
  {
    name: "Polo Shirts",
    category: "apparel",
    description: "Embroidered polo shirts for team branding",
    base_price: 24.99,
    price_tiers: [{ qty: 12, price: 24.99 }, { qty: 24, price: 21.99 }],
    options: [{ name: "Color", values: ["White", "Black", "Navy", "Royal Blue"] }],
    min_quantity: 12,
    turnaround_days: 10,
    sort_order: 41,
  },
  {
    name: "Caps & Hats",
    category: "apparel",
    description: "Embroidered caps with custom logo",
    base_price: 12.99,
    price_tiers: [{ qty: 12, price: 12.99 }, { qty: 24, price: 10.99 }],
    options: [{ name: "Style", values: ["Structured", "Unstructured", "Snapback", "Trucker"] }],
    min_quantity: 12,
    turnaround_days: 10,
    sort_order: 42,
  },

  // ═══════════════════════════════════════════════════════
  // Legal & Notary Supplies
  // ═══════════════════════════════════════════════════════
  {
    name: "Notary Stamp",
    category: "legal-supplies",
    description: "Ohio-compliant notary stamp (ORC §147.04)",
    base_price: 24.99,
    price_tiers: [{ qty: 1, price: 24.99 }],
    options: [{ name: "Type", values: ["Self-Inking", "Pre-Inked", "Pocket"] }, { name: "Shape", values: ["Round", "Rectangular"] }],
    min_quantity: 1,
    turnaround_days: 3,
    sort_order: 50,
  },
  {
    name: "Notary Journal",
    category: "legal-supplies",
    description: "Hardbound notary journal — 500 entries",
    base_price: 19.99,
    price_tiers: [{ qty: 1, price: 19.99 }, { qty: 3, price: 16.99 }],
    options: [{ name: "Binding", values: ["Hardcover", "Softcover"] }],
    min_quantity: 1,
    turnaround_days: 3,
    sort_order: 51,
  },
  {
    name: "Certificate Holders",
    category: "legal-supplies",
    description: "Premium leatherette certificate presentation holders",
    base_price: 4.99,
    price_tiers: [{ qty: 10, price: 4.99 }, { qty: 25, price: 3.99 }, { qty: 50, price: 2.99 }],
    options: [{ name: "Color", values: ["Navy", "Black", "Burgundy"] }],
    min_quantity: 10,
    turnaround_days: 3,
    sort_order: 52,
  },
  {
    name: "Custom Embossers",
    category: "legal-supplies",
    description: "Desktop or handheld custom embossing seal",
    base_price: 39.99,
    price_tiers: [{ qty: 1, price: 39.99 }],
    options: [{ name: "Type", values: ["Desktop", "Handheld"] }, { name: "Insert", values: ["1 inch", "1.625 inch", "2 inch"] }],
    min_quantity: 1,
    turnaround_days: 5,
    sort_order: 53,
  },
  {
    name: "Custom Legal Pads",
    category: "legal-supplies",
    description: "Custom-branded legal ruled pads",
    base_price: 3.99,
    price_tiers: [{ qty: 12, price: 3.99 }, { qty: 24, price: 3.49 }],
    options: [{ name: "Color", values: ["Yellow", "White"] }],
    min_quantity: 12,
    turnaround_days: 5,
    sort_order: 54,
  },
  {
    name: "Presentation Folders",
    category: "stationery",
    description: "Custom pocket folders for client documents",
    base_price: 3.49,
    price_tiers: [{ qty: 50, price: 3.49 }, { qty: 100, price: 2.99 }, { qty: 250, price: 2.49 }],
    options: [{ name: "Pockets", values: ["Single", "Double"] }, { name: "Finish", values: ["Matte", "Glossy"] }],
    min_quantity: 50,
    turnaround_days: 5,
    sort_order: 15,
  },

  // ═══════════════════════════════════════════════════════
  // Promotional Items
  // ═══════════════════════════════════════════════════════
  {
    name: "Custom Pens",
    category: "promotional",
    description: "Branded ballpoint pens with company logo",
    base_price: 0.79,
    price_tiers: [{ qty: 100, price: 0.79 }, { qty: 250, price: 0.59 }, { qty: 500, price: 0.49 }],
    options: [{ name: "Color", values: ["Black", "Blue", "Silver", "Gold"] }, { name: "Type", values: ["Click", "Twist", "Stylus Tip"] }],
    min_quantity: 100,
    turnaround_days: 7,
    sort_order: 70,
  },
  {
    name: "Tote Bags",
    category: "promotional",
    description: "Custom printed canvas tote bags",
    base_price: 4.99,
    price_tiers: [{ qty: 25, price: 4.99 }, { qty: 50, price: 3.99 }, { qty: 100, price: 2.99 }],
    options: [{ name: "Material", values: ["Canvas", "Non-Woven", "Cotton"] }],
    min_quantity: 25,
    turnaround_days: 7,
    sort_order: 71,
  },
  {
    name: "Custom Mugs",
    category: "promotional",
    description: "11oz ceramic mugs with full wrap print",
    base_price: 7.99,
    price_tiers: [{ qty: 12, price: 7.99 }, { qty: 24, price: 6.49 }, { qty: 48, price: 5.49 }],
    options: [{ name: "Color", values: ["White", "Black", "Two-Tone"] }],
    min_quantity: 12,
    turnaround_days: 7,
    sort_order: 72,
  },
  {
    name: "Lanyards",
    category: "promotional",
    description: "Custom printed lanyards with badge holders",
    base_price: 1.99,
    price_tiers: [{ qty: 25, price: 1.99 }, { qty: 50, price: 1.49 }, { qty: 100, price: 0.99 }],
    options: [{ name: "Width", values: ["3/8 inch", "1/2 inch", "3/4 inch"] }, { name: "Attachment", values: ["Swivel Hook", "Badge Reel", "Breakaway"] }],
    min_quantity: 25,
    turnaround_days: 7,
    sort_order: 73,
  },
  {
    name: "USB Flash Drives",
    category: "promotional",
    description: "Custom branded USB drives for document delivery",
    base_price: 5.99,
    price_tiers: [{ qty: 25, price: 5.99 }, { qty: 50, price: 4.99 }, { qty: 100, price: 3.99 }],
    options: [{ name: "Capacity", values: ["8GB", "16GB", "32GB", "64GB"] }, { name: "Style", values: ["Classic", "Card", "Wood", "Metal"] }],
    min_quantity: 25,
    turnaround_days: 7,
    sort_order: 74,
  },
];
