export const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "legal", label: "Legal" },
  { value: "notary", label: "Notary" },
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
] as const;

export const TEMPLATES = [
  { id: "blank", label: "Blank Document", icon: "📄", category: "personal", content: "<p><br></p>" },
  { id: "contract", label: "Service Contract", icon: "📋", category: "legal", content: "<h1>Service Agreement</h1><p>This agreement is entered into between the following parties...</p><h2>1. Scope of Services</h2><p></p><h2>2. Compensation</h2><p></p><h2>3. Terms & Conditions</h2><p></p><h2>4. Signatures</h2><p></p>" },
  { id: "affidavit", label: "Affidavit", icon: "⚖️", category: "legal", content: "<h1>Affidavit</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>I, ____________, being duly sworn, do hereby state under oath:</p><ol><li></li></ol><p>Signed this ___ day of ____________, 20___.</p><p>___________________________<br>Affiant Signature</p>" },
  { id: "deed", label: "Warranty Deed", icon: "🏠", category: "legal", content: "<h1>Warranty Deed</h1><p>This deed is made on ____________, by and between:</p><p><strong>Grantor:</strong> ____________</p><p><strong>Grantee:</strong> ____________</p><h2>Property Description</h2><p></p><h2>Covenants</h2><p></p>" },
  { id: "poa", label: "Power of Attorney", icon: "✍️", category: "legal", content: "<h1>Power of Attorney</h1><p>I, ____________ (\"Principal\"), of ____________, Ohio, hereby appoint ____________ (\"Agent\") as my attorney-in-fact to act on my behalf...</p><h2>Powers Granted</h2><ul><li></li></ul><h2>Duration</h2><p></p>" },
  { id: "proposal", label: "Business Proposal", icon: "💼", category: "business", content: "<h1>Proposal</h1><h2>Executive Summary</h2><p></p><h2>Problem Statement</h2><p></p><h2>Proposed Solution</h2><p></p><h2>Timeline & Deliverables</h2><p></p><h2>Investment</h2><p></p>" },
  { id: "letter", label: "Formal Letter", icon: "✉️", category: "business", content: "<p>[Your Name]<br>[Address]<br>[Date]</p><p>[Recipient Name]<br>[Recipient Address]</p><p>Dear ____________,</p><p></p><p>Sincerely,</p><p>___________________________</p>" },
  { id: "report", label: "Report", icon: "📊", category: "business", content: "<h1>Report Title</h1><p><strong>Prepared by:</strong> ____________<br><strong>Date:</strong> ____________</p><h2>1. Introduction</h2><p></p><h2>2. Findings</h2><p></p><h2>3. Recommendations</h2><p></p><h2>4. Conclusion</h2><p></p>" },
  { id: "notary-jurat", label: "Jurat Certificate", icon: "📜", category: "notary", content: "<h1>Jurat Certificate</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>Subscribed and sworn to (or affirmed) before me on this ___ day of ____________, 20___, by ____________, proved to me on the basis of satisfactory evidence to be the person(s) who appeared before me.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>My Commission Expires: ____________</p>" },
  { id: "notary-ack", label: "Acknowledgment", icon: "✅", category: "notary", content: "<h1>Certificate of Acknowledgment</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>On ____________, before me, ____________, a Notary Public in and for said state, personally appeared ____________, who proved to me on the basis of satisfactory evidence to be the person(s) whose name(s) is/are subscribed to the within instrument and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies).</p><p>WITNESS my hand and official seal.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio</p>" },
  { id: "ron-cert", label: "RON Certificate", icon: "🖥️", category: "notary", content: "<h1>Remote Online Notarization Certificate</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>On ____________, I, ____________, a Notary Public commissioned in the State of Ohio, performed a remote online notarization in accordance with Ohio Revised Code §147.60–147.66.</p><h2>Signer Information</h2><p><strong>Name:</strong> ____________<br><strong>Location at Time of Notarization:</strong> ____________</p><h2>Identity Verification</h2><p>Identity was verified through knowledge-based authentication (KBA) and credential analysis as required by ORC §147.63.</p><h2>Recording</h2><p>An audio-video recording of this session has been made and will be retained for a minimum of 10 years per ORC §147.66.</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>Commission Number: ____________<br>Commission Expiration: ____________</p>" },
  { id: "copy-cert", label: "Copy Certification", icon: "📑", category: "notary", content: "<h1>Copy Certification</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>I certify that this is a true, exact, complete, and unaltered photocopy of the original document presented to me by the document's custodian, ____________.</p><p>Date: ____________</p><p><br></p><p>___________________________<br>Notary Public — State of Ohio<br>My Commission Expires: ____________</p>" },
  { id: "nda", label: "Non-Disclosure Agreement", icon: "🔒", category: "legal", content: "<h1>Non-Disclosure Agreement</h1><p>This Non-Disclosure Agreement (\"Agreement\") is entered into as of ____________ by and between:</p><p><strong>Disclosing Party:</strong> ____________</p><p><strong>Receiving Party:</strong> ____________</p><h2>1. Confidential Information</h2><p></p><h2>2. Obligations</h2><p></p><h2>3. Term</h2><p></p><h2>4. Signatures</h2><p></p>" },
  { id: "invoice", label: "Invoice", icon: "💰", category: "business", content: "<h1>Invoice</h1><p><strong>Invoice #:</strong> ____________<br><strong>Date:</strong> ____________</p><p><strong>From:</strong><br>____________<br>____________</p><p><strong>Bill To:</strong><br>____________<br>____________</p><table><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr><tr><td></td><td></td><td></td><td></td></tr></table><p><strong>Total:</strong> $____________</p>" },
  { id: "meeting-minutes", label: "Meeting Minutes", icon: "📝", category: "business", content: "<h1>Meeting Minutes</h1><p><strong>Date:</strong> ____________<br><strong>Time:</strong> ____________<br><strong>Location:</strong> ____________</p><h2>Attendees</h2><ul><li></li></ul><h2>Agenda</h2><ol><li></li></ol><h2>Discussion</h2><p></p><h2>Action Items</h2><ul><li></li></ul><h2>Next Meeting</h2><p></p>" },
  { id: "resume", label: "Resume / CV", icon: "👤", category: "personal", content: "<h1>[Your Name]</h1><p>[Email] | [Phone] | [Location]</p><h2>Professional Summary</h2><p></p><h2>Experience</h2><h3>[Job Title] — [Company]</h3><p><em>[Dates]</em></p><ul><li></li></ul><h2>Education</h2><p></p><h2>Skills</h2><ul><li></li></ul>" },
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
  { value: "ar", label: "Arabic (RTL)" },
  { value: "he", label: "Hebrew (RTL)" },
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
  { value: "a5", label: "A5", width: 559, height: 794 },
  { value: "letter-landscape", label: "Letter Landscape", width: 1056, height: 816 },
] as const;

export const LINE_SPACINGS = [
  { value: "1", label: "Single" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "Double" },
  { value: "2.5", label: "2.5" },
] as const;

export type MarginPreset = { value: string; label: string; top: number; right: number; bottom: number; left: number };

export const MARGIN_PRESETS: MarginPreset[] = [
  { value: "normal", label: "Normal", top: 48, right: 48, bottom: 48, left: 48 },
  { value: "narrow", label: "Narrow", top: 24, right: 24, bottom: 24, left: 24 },
  { value: "wide", label: "Wide", top: 48, right: 72, bottom: 48, left: 72 },
  { value: "none", label: "None", top: 12, right: 12, bottom: 12, left: 12 },
];

export const SPECIAL_CHARACTERS = [
  { char: "§", label: "Section" },
  { char: "¶", label: "Pilcrow" },
  { char: "©", label: "Copyright" },
  { char: "®", label: "Registered" },
  { char: "™", label: "Trademark" },
  { char: "°", label: "Degree" },
  { char: "±", label: "Plus-Minus" },
  { char: "×", label: "Multiply" },
  { char: "÷", label: "Divide" },
  { char: "≤", label: "LTE" },
  { char: "≥", label: "GTE" },
  { char: "≠", label: "Not Equal" },
  { char: "∞", label: "Infinity" },
  { char: "µ", label: "Micro" },
  { char: "†", label: "Dagger" },
  { char: "‡", label: "Double Dagger" },
  { char: "•", label: "Bullet" },
  { char: "…", label: "Ellipsis" },
  { char: "—", label: "Em Dash" },
  { char: "–", label: "En Dash" },
  { char: "€", label: "Euro" },
  { char: "£", label: "Pound" },
  { char: "¥", label: "Yen" },
  { char: "¢", label: "Cent" },
];

export const LEGAL_CLAUSES = [
  {
    id: "ohio-governing-law",
    label: "Ohio Governing Law",
    category: "legal",
    content: "<p>This agreement shall be governed by and construed in accordance with the laws of the State of Ohio, without regard to its conflict of law principles. Any legal action or proceeding arising under this agreement shall be brought exclusively in the courts of the State of Ohio.</p>",
  },
  {
    id: "ohio-notary-disclaimer",
    label: "Notary Disclaimer (ORC §147.01)",
    category: "notary",
    content: "<p><strong>DISCLAIMER:</strong> The notary public is not an attorney licensed to practice law in the State of Ohio and may not give legal advice or accept fees for legal advice. Pursuant to ORC §147.01, a notary public is authorized only to perform notarial acts as defined by Ohio law.</p>",
  },
  {
    id: "esign-consent",
    label: "E-Sign Consent Clause",
    category: "legal",
    content: "<p><strong>Electronic Signature Consent:</strong> By signing this document electronically, I consent to conduct this transaction by electronic means pursuant to the Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. §7001 et seq.) and the Uniform Electronic Transactions Act (UETA) as adopted by the State of Ohio (ORC §1306.01 et seq.).</p>",
  },
  {
    id: "ron-disclosure",
    label: "RON Session Disclosure",
    category: "notary",
    content: "<p><strong>Remote Online Notarization Disclosure:</strong> This notarial act was performed via remote online notarization (RON) in accordance with Ohio Revised Code §147.60–147.66. The signer's identity was verified through knowledge-based authentication (KBA) and credential analysis. An audio-video recording of this session will be retained for a minimum of ten (10) years per ORC §147.66.</p>",
  },
  {
    id: "witness-attestation",
    label: "Witness Attestation",
    category: "notary",
    content: "<p>We, the undersigned witnesses, hereby attest that the foregoing instrument was signed in our presence by the above-named individual(s), who appeared to be of sound mind and under no duress or undue influence.</p><p>Witness 1: ___________________________ Date: _______________</p><p>Witness 2: ___________________________ Date: _______________</p>",
  },
  {
    id: "severability",
    label: "Severability Clause",
    category: "legal",
    content: "<p><strong>Severability:</strong> If any provision of this agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.</p>",
  },
  {
    id: "entire-agreement",
    label: "Entire Agreement",
    category: "legal",
    content: "<p><strong>Entire Agreement:</strong> This document constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to this subject matter.</p>",
  },
  {
    id: "indemnification",
    label: "Indemnification",
    category: "legal",
    content: "<p><strong>Indemnification:</strong> Each party agrees to indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this agreement.</p>",
  },
  {
    id: "confidentiality",
    label: "Confidentiality",
    category: "legal",
    content: "<p><strong>Confidentiality:</strong> The parties agree to keep confidential all information exchanged in connection with this agreement. Neither party shall disclose such information to any third party without the prior written consent of the other party, except as required by law.</p>",
  },
  {
    id: "force-majeure",
    label: "Force Majeure",
    category: "legal",
    content: "<p><strong>Force Majeure:</strong> Neither party shall be liable for any failure or delay in performance under this agreement due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, pandemic, war, terrorism, government actions, or interruptions in telecommunications or power supply.</p>",
  },
];

export const PAGE_BACKGROUND_COLORS = [
  { value: "#FFFFFF", label: "White" },
  { value: "#FFFBEB", label: "Warm" },
  { value: "#F0FDF4", label: "Green Tint" },
  { value: "#EFF6FF", label: "Blue Tint" },
  { value: "#FDF2F8", label: "Pink Tint" },
  { value: "#F5F3FF", label: "Purple Tint" },
  { value: "#FAFAF9", label: "Stone" },
  { value: "#F8FAFC", label: "Slate" },
];
