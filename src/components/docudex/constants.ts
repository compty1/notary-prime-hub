export const TEMPLATES = [
  { id: "blank", label: "Blank Document", icon: "📄", content: "<p><br></p>" },
  { id: "contract", label: "Service Contract", icon: "📋", content: "<h1>Service Agreement</h1><p>This agreement is entered into between the following parties...</p><h2>1. Scope of Services</h2><p></p><h2>2. Compensation</h2><p></p><h2>3. Terms & Conditions</h2><p></p><h2>4. Signatures</h2><p></p>" },
  { id: "affidavit", label: "Affidavit", icon: "⚖️", content: "<h1>Affidavit</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>I, ____________, being duly sworn, do hereby state under oath:</p><ol><li></li></ol><p>Signed this ___ day of ____________, 20___.</p><p>___________________________<br>Affiant Signature</p>" },
  { id: "deed", label: "Warranty Deed", icon: "🏠", content: "<h1>Warranty Deed</h1><p>This deed is made on ____________, by and between:</p><p><strong>Grantor:</strong> ____________</p><p><strong>Grantee:</strong> ____________</p><h2>Property Description</h2><p></p><h2>Covenants</h2><p></p>" },
  { id: "poa", label: "Power of Attorney", icon: "✍️", content: "<h1>Power of Attorney</h1><p>I, ____________ (\"Principal\"), of ____________, Ohio, hereby appoint ____________ (\"Agent\") as my attorney-in-fact to act on my behalf...</p><h2>Powers Granted</h2><ul><li></li></ul><h2>Duration</h2><p></p>" },
  { id: "proposal", label: "Business Proposal", icon: "💼", content: "<h1>Proposal</h1><h2>Executive Summary</h2><p></p><h2>Problem Statement</h2><p></p><h2>Proposed Solution</h2><p></p><h2>Timeline & Deliverables</h2><p></p><h2>Investment</h2><p></p>" },
  { id: "letter", label: "Formal Letter", icon: "✉️", content: "<p>[Your Name]<br>[Address]<br>[Date]</p><p>[Recipient Name]<br>[Recipient Address]</p><p>Dear ____________,</p><p></p><p>Sincerely,</p><p>___________________________</p>" },
  { id: "report", label: "Report", icon: "📊", content: "<h1>Report Title</h1><p><strong>Prepared by:</strong> ____________<br><strong>Date:</strong> ____________</p><h2>1. Introduction</h2><p></p><h2>2. Findings</h2><p></p><h2>3. Recommendations</h2><p></p><h2>4. Conclusion</h2><p></p>" },
  { id: "notary-jurat", label: "Jurat Certificate", icon: "📜", content: "<h1>Jurat Certificate</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>Subscribed and sworn to (or affirmed) before me on this ___ day of ____________, 20___, by ____________, proved to me on the basis of satisfactory evidence to be the person(s) who appeared before me.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>My Commission Expires: ____________</p>" },
  { id: "notary-ack", label: "Acknowledgment", icon: "✅", content: "<h1>Certificate of Acknowledgment</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>On ____________, before me, ____________, a Notary Public in and for said state, personally appeared ____________, who proved to me on the basis of satisfactory evidence to be the person(s) whose name(s) is/are subscribed to the within instrument and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies).</p><p>WITNESS my hand and official seal.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio</p>" },
  { id: "ron-cert", label: "RON Certificate", icon: "🖥️", content: "<h1>Remote Online Notarization Certificate</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>On ____________, I, ____________, a Notary Public commissioned in the State of Ohio, performed a remote online notarization in accordance with Ohio Revised Code §147.60–147.66.</p><h2>Signer Information</h2><p><strong>Name:</strong> ____________<br><strong>Location at Time of Notarization:</strong> ____________</p><h2>Identity Verification</h2><p>Identity was verified through knowledge-based authentication (KBA) and credential analysis as required by ORC §147.63.</p><h2>Recording</h2><p>An audio-video recording of this session has been made and will be retained for a minimum of 10 years per ORC §147.66.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>Commission Number: ____________<br>Commission Expiration: ____________</p>" },
];

export const BRAND_FONTS = [
  { value: "sans", label: "Sans-Serif", family: "ui-sans-serif, system-ui, sans-serif" },
  { value: "serif", label: "Serif", family: "ui-serif, Georgia, serif" },
  { value: "mono", label: "Monospace", family: "ui-monospace, monospace" },
  { value: "arial", label: "Arial", family: "Arial, Helvetica, sans-serif" },
  { value: "times", label: "Times New Roman", family: "'Times New Roman', Times, serif" },
  { value: "georgia", label: "Georgia", family: "Georgia, serif" },
  { value: "courier", label: "Courier New", family: "'Courier New', Courier, monospace" },
  { value: "garamond", label: "Garamond", family: "Garamond, serif" },
];

export const ACCENT_COLORS = [
  { value: "#F59E0B", label: "Amber" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Emerald" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#EF4444", label: "Red" },
  { value: "#1E293B", label: "Slate" },
  { value: "#EC4899", label: "Pink" },
  { value: "#14B8A6", label: "Teal" },
];

export const TEXT_COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#1E293B", label: "Slate" },
  { value: "#374151", label: "Gray" },
  { value: "#DC2626", label: "Red" },
  { value: "#EA580C", label: "Orange" },
  { value: "#D97706", label: "Amber" },
  { value: "#16A34A", label: "Green" },
  { value: "#2563EB", label: "Blue" },
  { value: "#7C3AED", label: "Purple" },
  { value: "#DB2777", label: "Pink" },
];

export const HIGHLIGHT_COLORS = [
  { value: "#FEF08A", label: "Yellow" },
  { value: "#BBF7D0", label: "Green" },
  { value: "#BFDBFE", label: "Blue" },
  { value: "#FBCFE8", label: "Pink" },
  { value: "#FED7AA", label: "Orange" },
  { value: "#E9D5FF", label: "Purple" },
];

export const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72",
];

export const LANGUAGES = [
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
];

export const SIDEBAR_TABS = [
  { id: "templates", label: "Templates" },
  { id: "ai", label: "AI Tools" },
  { id: "elements", label: "Elements" },
  { id: "design", label: "Design" },
  { id: "translate", label: "Translate" },
  { id: "history", label: "History" },
] as const;

export const PAGE_SIZES = [
  { value: "letter", label: "US Letter", width: 816, height: 1056 },
  { value: "legal", label: "US Legal", width: 816, height: 1344 },
  { value: "a4", label: "A4", width: 794, height: 1123 },
] as const;

export const LINE_SPACINGS = [
  { value: "1", label: "Single" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "Double" },
] as const;
