/**
 * Print Products Catalog — Complete product definitions
 * Covers business cards, stationery, signage, apparel, marketing, and legal supplies
 */

export interface PrintProduct {
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  base_price: number;
  price_tiers: { qty: number; price: number }[];
  options: { name: string; values: string[]; priceModifier?: number }[];
  min_quantity: number;
  turnaround_days: number;
  sort_order: number;
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
] as const;

export const PRINT_PRODUCTS: PrintProduct[] = [
  // Business Cards
  { name: "Standard Business Cards", category: "business-cards", description: "Premium 16pt cardstock, full color both sides", base_price: 24.99, price_tiers: [{ qty: 250, price: 24.99 }, { qty: 500, price: 34.99 }, { qty: 1000, price: 49.99 }], options: [{ name: "Finish", values: ["Matte", "Glossy", "Soft Touch", "Spot UV"] }, { name: "Corners", values: ["Square", "Rounded"] }], min_quantity: 250, turnaround_days: 3, sort_order: 1 },
  { name: "Luxury Business Cards", category: "business-cards", description: "32pt ultra-thick with foil stamping", base_price: 79.99, price_tiers: [{ qty: 100, price: 79.99 }, { qty: 250, price: 129.99 }, { qty: 500, price: 199.99 }], options: [{ name: "Foil Color", values: ["Gold", "Silver", "Rose Gold", "Copper"] }, { name: "Edge Color", values: ["None", "Gold", "Silver", "Black"] }], min_quantity: 100, turnaround_days: 5, sort_order: 2 },
  { name: "NFC Smart Business Cards", category: "business-cards", description: "Tap-to-share digital business card with embedded NFC chip", base_price: 14.99, price_tiers: [{ qty: 1, price: 14.99 }, { qty: 5, price: 59.99 }, { qty: 10, price: 99.99 }], options: [{ name: "Material", values: ["PVC", "Metal", "Wood"] }], min_quantity: 1, turnaround_days: 7, sort_order: 3 },

  // Stationery
  { name: "Letterhead", category: "stationery", description: "Professional letterhead on 70lb premium paper", base_price: 49.99, price_tiers: [{ qty: 250, price: 49.99 }, { qty: 500, price: 69.99 }, { qty: 1000, price: 99.99 }], options: [{ name: "Paper", values: ["70lb Premium", "80lb Linen", "100lb Cotton"] }], min_quantity: 250, turnaround_days: 3, sort_order: 10 },
  { name: "Envelopes (#10)", category: "stationery", description: "Matching #10 business envelopes", base_price: 59.99, price_tiers: [{ qty: 250, price: 59.99 }, { qty: 500, price: 89.99 }, { qty: 1000, price: 129.99 }], options: [{ name: "Window", values: ["No Window", "Single Window", "Double Window"] }], min_quantity: 250, turnaround_days: 3, sort_order: 11 },
  { name: "Notepads", category: "stationery", description: "Custom branded notepads, 50 sheets each", base_price: 5.99, price_tiers: [{ qty: 10, price: 5.99 }, { qty: 25, price: 4.99 }, { qty: 50, price: 3.99 }], options: [{ name: "Size", values: ["4x6", "5x7", "8.5x11"] }], min_quantity: 10, turnaround_days: 5, sort_order: 12 },
  { name: "Presentation Folders", category: "stationery", description: "Custom pocket folders for client documents", base_price: 3.49, price_tiers: [{ qty: 50, price: 3.49 }, { qty: 100, price: 2.99 }, { qty: 250, price: 2.49 }], options: [{ name: "Pockets", values: ["Single", "Double"] }, { name: "Finish", values: ["Matte", "Glossy"] }], min_quantity: 50, turnaround_days: 5, sort_order: 13 },

  // Marketing Materials
  { name: "Flyers", category: "marketing", description: "Full color flyers on glossy or matte stock", base_price: 0.15, price_tiers: [{ qty: 250, price: 0.15 }, { qty: 500, price: 0.12 }, { qty: 1000, price: 0.08 }], options: [{ name: "Size", values: ["8.5x11", "5.5x8.5", "4x6"] }, { name: "Sides", values: ["Single", "Double"] }], min_quantity: 250, turnaround_days: 2, sort_order: 20 },
  { name: "Brochures", category: "marketing", description: "Tri-fold or bi-fold brochures", base_price: 0.35, price_tiers: [{ qty: 250, price: 0.35 }, { qty: 500, price: 0.28 }, { qty: 1000, price: 0.22 }], options: [{ name: "Fold", values: ["Tri-Fold", "Bi-Fold", "Z-Fold"] }, { name: "Paper", values: ["80lb Gloss", "100lb Matte"] }], min_quantity: 250, turnaround_days: 3, sort_order: 21 },
  { name: "Postcards", category: "marketing", description: "Full color postcards for direct mail campaigns", base_price: 0.12, price_tiers: [{ qty: 500, price: 0.12 }, { qty: 1000, price: 0.08 }, { qty: 2500, price: 0.06 }], options: [{ name: "Size", values: ["4x6", "5x7", "6x9"] }, { name: "Coating", values: ["UV Gloss Front", "Matte Both Sides"] }], min_quantity: 500, turnaround_days: 3, sort_order: 22 },
  { name: "Door Hangers", category: "marketing", description: "Die-cut door hangers for local marketing", base_price: 0.20, price_tiers: [{ qty: 250, price: 0.20 }, { qty: 500, price: 0.16 }, { qty: 1000, price: 0.12 }], options: [{ name: "Sides", values: ["Single", "Double"] }], min_quantity: 250, turnaround_days: 3, sort_order: 23 },
  { name: "Rack Cards", category: "marketing", description: "4x9 display cards for offices and lobbies", base_price: 0.18, price_tiers: [{ qty: 250, price: 0.18 }, { qty: 500, price: 0.14 }, { qty: 1000, price: 0.10 }], options: [{ name: "Finish", values: ["Glossy", "Matte", "Soft Touch"] }], min_quantity: 250, turnaround_days: 3, sort_order: 24 },

  // Signage
  { name: "Yard Signs", category: "signage", description: "Corrugated plastic with H-stake", base_price: 12.99, price_tiers: [{ qty: 1, price: 12.99 }, { qty: 5, price: 9.99 }, { qty: 10, price: 7.99 }], options: [{ name: "Size", values: ["18x24", "24x36"] }, { name: "Sides", values: ["Single", "Double"] }], min_quantity: 1, turnaround_days: 3, sort_order: 30 },
  { name: "Vinyl Banners", category: "signage", description: "13oz scrim vinyl with grommets", base_price: 3.50, price_tiers: [{ qty: 1, price: 3.50 }], options: [{ name: "Size (ft)", values: ["2x4", "3x6", "4x8", "Custom"] }, { name: "Finishing", values: ["Grommets", "Pole Pockets", "Hemmed"] }], min_quantity: 1, turnaround_days: 3, sort_order: 31 },
  { name: "Window Decals", category: "signage", description: "Custom vinyl decals for office windows", base_price: 19.99, price_tiers: [{ qty: 1, price: 19.99 }, { qty: 5, price: 14.99 }], options: [{ name: "Type", values: ["Clear", "White", "Frosted", "Perforated"] }], min_quantity: 1, turnaround_days: 5, sort_order: 32 },
  { name: "A-Frame Sidewalk Signs", category: "signage", description: "Double-sided A-frame with custom inserts", base_price: 89.99, price_tiers: [{ qty: 1, price: 89.99 }], options: [{ name: "Size", values: ["24x36", "22x28"] }], min_quantity: 1, turnaround_days: 5, sort_order: 33 },

  // Apparel
  { name: "Custom T-Shirts", category: "apparel", description: "Branded crew neck t-shirts", base_price: 14.99, price_tiers: [{ qty: 12, price: 14.99 }, { qty: 24, price: 11.99 }, { qty: 48, price: 9.99 }], options: [{ name: "Color", values: ["White", "Black", "Navy", "Gray"] }, { name: "Print Method", values: ["Screen Print", "DTG", "Embroidered"] }], min_quantity: 12, turnaround_days: 7, sort_order: 40 },
  { name: "Polo Shirts", category: "apparel", description: "Embroidered polo shirts for team branding", base_price: 24.99, price_tiers: [{ qty: 12, price: 24.99 }, { qty: 24, price: 21.99 }], options: [{ name: "Color", values: ["White", "Black", "Navy", "Royal Blue"] }], min_quantity: 12, turnaround_days: 10, sort_order: 41 },
  { name: "Caps & Hats", category: "apparel", description: "Embroidered caps with custom logo", base_price: 12.99, price_tiers: [{ qty: 12, price: 12.99 }, { qty: 24, price: 10.99 }], options: [{ name: "Style", values: ["Structured", "Unstructured", "Snapback", "Trucker"] }], min_quantity: 12, turnaround_days: 10, sort_order: 42 },

  // Legal & Notary Supplies
  { name: "Notary Stamp", category: "legal-supplies", description: "Ohio-compliant notary stamp (ORC §147.04)", base_price: 24.99, price_tiers: [{ qty: 1, price: 24.99 }], options: [{ name: "Type", values: ["Self-Inking", "Pre-Inked", "Pocket"] }, { name: "Shape", values: ["Round", "Rectangular"] }], min_quantity: 1, turnaround_days: 3, sort_order: 50 },
  { name: "Notary Journal", category: "legal-supplies", description: "Hardbound notary journal — 500 entries", base_price: 19.99, price_tiers: [{ qty: 1, price: 19.99 }, { qty: 3, price: 16.99 }], options: [{ name: "Binding", values: ["Hardcover", "Softcover"] }], min_quantity: 1, turnaround_days: 3, sort_order: 51 },
  { name: "Certificate Holders", category: "legal-supplies", description: "Premium leatherette certificate presentation holders", base_price: 4.99, price_tiers: [{ qty: 10, price: 4.99 }, { qty: 25, price: 3.99 }, { qty: 50, price: 2.99 }], options: [{ name: "Color", values: ["Navy", "Black", "Burgundy"] }], min_quantity: 10, turnaround_days: 3, sort_order: 52 },
  { name: "Custom Embossers", category: "legal-supplies", description: "Desktop or handheld custom embossing seal", base_price: 39.99, price_tiers: [{ qty: 1, price: 39.99 }], options: [{ name: "Type", values: ["Desktop", "Handheld"] }, { name: "Insert", values: ["1 inch", "1.625 inch", "2 inch"] }], min_quantity: 1, turnaround_days: 5, sort_order: 53 },
  { name: "Legal Pads (Custom)", category: "legal-supplies", description: "Custom-branded legal ruled pads", base_price: 3.99, price_tiers: [{ qty: 12, price: 3.99 }, { qty: 24, price: 3.49 }], options: [{ name: "Color", values: ["Yellow", "White"] }], min_quantity: 12, turnaround_days: 5, sort_order: 54 },

  // Packaging & Labels
  { name: "Stickers & Labels", category: "packaging", description: "Custom die-cut stickers and labels", base_price: 0.10, price_tiers: [{ qty: 250, price: 0.10 }, { qty: 500, price: 0.07 }, { qty: 1000, price: 0.05 }], options: [{ name: "Shape", values: ["Circle", "Rectangle", "Custom Die-Cut"] }, { name: "Material", values: ["Paper", "Vinyl", "Clear"] }], min_quantity: 250, turnaround_days: 3, sort_order: 60 },
  { name: "Shipping Labels", category: "packaging", description: "Branded shipping labels for parcels", base_price: 0.08, price_tiers: [{ qty: 500, price: 0.08 }, { qty: 1000, price: 0.06 }], options: [{ name: "Size", values: ["2x4", "4x6"] }], min_quantity: 500, turnaround_days: 3, sort_order: 61 },
  { name: "Custom Boxes", category: "packaging", description: "Branded mailer boxes with custom print", base_price: 3.99, price_tiers: [{ qty: 50, price: 3.99 }, { qty: 100, price: 2.99 }], options: [{ name: "Size", values: ["Small (8x6x3)", "Medium (12x9x4)", "Large (14x12x6)"] }], min_quantity: 50, turnaround_days: 10, sort_order: 62 },

  // Promotional Items
  { name: "Custom Pens", category: "promotional", description: "Branded ballpoint pens with company logo", base_price: 0.79, price_tiers: [{ qty: 100, price: 0.79 }, { qty: 250, price: 0.59 }, { qty: 500, price: 0.49 }], options: [{ name: "Color", values: ["Black", "Blue", "Silver", "Gold"] }, { name: "Type", values: ["Click", "Twist", "Stylus Tip"] }], min_quantity: 100, turnaround_days: 7, sort_order: 70 },
  { name: "Tote Bags", category: "promotional", description: "Custom printed canvas tote bags", base_price: 4.99, price_tiers: [{ qty: 25, price: 4.99 }, { qty: 50, price: 3.99 }, { qty: 100, price: 2.99 }], options: [{ name: "Material", values: ["Canvas", "Non-Woven", "Cotton"] }], min_quantity: 25, turnaround_days: 7, sort_order: 71 },
  { name: "Custom Mugs", category: "promotional", description: "11oz ceramic mugs with full wrap print", base_price: 7.99, price_tiers: [{ qty: 12, price: 7.99 }, { qty: 24, price: 6.49 }, { qty: 48, price: 5.49 }], options: [{ name: "Color", values: ["White", "Black", "Two-Tone"] }], min_quantity: 12, turnaround_days: 7, sort_order: 72 },
  { name: "Lanyards", category: "promotional", description: "Custom printed lanyards with badge holders", base_price: 1.99, price_tiers: [{ qty: 25, price: 1.99 }, { qty: 50, price: 1.49 }, { qty: 100, price: 0.99 }], options: [{ name: "Width", values: ["3/8 inch", "1/2 inch", "3/4 inch"] }, { name: "Attachment", values: ["Swivel Hook", "Badge Reel", "Breakaway"] }], min_quantity: 25, turnaround_days: 7, sort_order: 73 },
  { name: "USB Flash Drives", category: "promotional", description: "Custom branded USB drives for document delivery", base_price: 5.99, price_tiers: [{ qty: 25, price: 5.99 }, { qty: 50, price: 4.99 }, { qty: 100, price: 3.99 }], options: [{ name: "Capacity", values: ["8GB", "16GB", "32GB", "64GB"] }, { name: "Style", values: ["Classic", "Card", "Wood", "Metal"] }], min_quantity: 25, turnaround_days: 7, sort_order: 74 },
];
