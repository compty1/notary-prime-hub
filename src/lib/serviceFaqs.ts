/**
 * Service-specific FAQ data with Ohio Revised Code citations.
 * Used by ServiceFAQAccordion to render clickable answers + cite chips.
 */

export interface FaqCitation {
  /** Short label e.g. "ORC §147.66" */
  label: string;
  /** Optional URL — defaults to a search on codes.ohio.gov */
  url?: string;
  /** Description shown on hover */
  description?: string;
}

export interface ServiceFaqItem {
  id: string;
  question: string;
  /** Plain-text or simple HTML answer (no scripts). */
  answer: string;
  citations?: FaqCitation[];
}

const ORC = (section: string, description?: string): FaqCitation => ({
  label: `ORC §${section}`,
  url: `https://codes.ohio.gov/ohio-revised-code/section-${section}`,
  description,
});

export const RON_FAQS: ServiceFaqItem[] = [
  {
    id: "ron-legal-binding",
    question: "Is RON as legally binding as in-person notarization?",
    answer:
      "Yes. Ohio Remote Online Notarization performed under ORC §147.65 carries the same legal weight as a traditional in-person notarial act and is recognized in all 50 states under the Full Faith and Credit Clause (U.S. Const. Art. IV, §1).",
    citations: [ORC("147.65", "Authorization for online notarization"), ORC("147.66", "Standards & technology providers")],
  },
  {
    id: "ron-tech",
    question: "What technology do I need for a RON session?",
    answer:
      "A computer or tablet with a working webcam, microphone, and a stable internet connection (≥5 Mbps). Use Chrome, Firefox, or Edge. Mobile phones are discouraged due to small screens and ID-capture quality.",
    citations: [ORC("147.66", "Approved communication technology requirements")],
  },
  {
    id: "ron-kba",
    question: "What is Knowledge-Based Authentication (KBA)?",
    answer:
      "KBA is the identity-proofing step required for every Ohio RON session. The signer answers 5 multiple-choice questions drawn from public/credit records and must answer at least 4 correctly within 2 minutes. One retry is allowed; after a second failure the session must end.",
    citations: [ORC("147.66", "Identity-proofing & KBA standards")],
  },
  {
    id: "ron-recording",
    question: "Is the RON session recorded?",
    answer:
      "Yes. Ohio law requires the entire audio/video session to be recorded and securely retained for at least 10 years. Signer consent to recording is required before the session can begin.",
    citations: [
      ORC("147.63", "Recording & consent requirement"),
      ORC("147.66", "10-year retention standard"),
    ],
  },
  {
    id: "ron-fees",
    question: "How much can a notary charge for a RON act?",
    answer:
      "Ohio caps RON notarial acts at $25 per act, plus a reasonable technology fee. The combined RON cap is $30 + $10 tech fee. In-person acts are capped at $5 per act.",
    citations: [ORC("147.08", "Fee caps for notarial acts")],
  },
  {
    id: "ron-out-of-state",
    question: "Can the signer be in another state?",
    answer:
      "Yes. The notary must be commissioned in Ohio and physically located in Ohio at the time of the act, but the signer may appear from anywhere in the United States.",
    citations: [ORC("147.65", "Notary location requirement")],
  },
  {
    id: "ron-wills",
    question: "Can a will be notarized via RON?",
    answer:
      "Acknowledgments and self-proving affidavits for wills can be performed via RON, but Ohio still requires two disinterested witnesses for the will itself. Witnesses can attend the same RON session if proper procedures are followed.",
    citations: [
      ORC("2107.03", "Will execution & witness requirements"),
      ORC("147.65"),
    ],
  },
  {
    id: "ron-kba-fail",
    question: "What happens if KBA fails twice?",
    answer:
      "Per Ohio standards the session must be terminated. The signer can re-attempt on a future date or use an alternative identity-proofing method (in-person credential analysis).",
    citations: [ORC("147.66")],
  },
];

export const LOAN_SIGNING_FAQS: ServiceFaqItem[] = [
  {
    id: "ls-what-is-nsa",
    question: "What is a Notary Signing Agent (NSA)?",
    answer:
      "An NSA is a notary public with additional training to handle loan-document packages — purchase, refinance, HELOC, reverse mortgage, and seller closings. NSAs follow lender-specific instructions while performing standard Ohio notarial acts.",
    citations: [ORC("147.011", "Notary public commission & duties")],
  },
  {
    id: "ls-ron-loans",
    question: "Can a closing be done via RON?",
    answer:
      "Yes. Many lenders, Fannie Mae, Freddie Mac, FHA, and most title insurers accept RON closings (RIN/eClosing). The county recorder where the property sits must accept eRecording — most Ohio counties do.",
    citations: [ORC("147.65"), ORC("147.591", "Electronic recording")],
  },
  {
    id: "ls-fees",
    question: "What does a loan signing cost?",
    answer:
      "Statutory notarial fees are capped at $5/act in person, $25/act for RON, plus signing-agent service fees and travel. A typical refinance package contains 5-10 notarial acts; we provide a flat-rate quote up front.",
    citations: [ORC("147.08")],
  },
  {
    id: "ls-id",
    question: "What ID do borrowers need?",
    answer:
      "A current, government-issued photo ID with signature: driver's license, state ID, U.S. passport, or military ID. Expired IDs cannot be accepted under Ohio law.",
    citations: [ORC("147.53", "Personal appearance & identification")],
  },
  {
    id: "ls-witnesses",
    question: "Are witnesses required?",
    answer:
      "Ohio does not require witnesses for most loan documents, but many lenders and title companies require one or two witnesses for the mortgage/deed of trust. We coordinate witnesses on request.",
    citations: [ORC("5301.01", "Deed execution & witness rules")],
  },
  {
    id: "ls-turnaround",
    question: "How fast can you sign?",
    answer:
      "Same-day and next-business-day appointments are routine. After-hours, weekend, and holiday signings are available with a small surcharge.",
  },
];

export const DIGITIZE_FAQS: ServiceFaqItem[] = [
  {
    id: "dz-what",
    question: "What does Document Digitize do?",
    answer:
      "It converts scanned PDFs and images into editable, searchable digital documents — preserving formatting, fonts, and layout. You can then clean up, redact, sign, and re-export in any format.",
  },
  {
    id: "dz-ron-ready",
    question: "Can I notarize the result via RON afterwards?",
    answer:
      "Yes. Once digitized, documents can be uploaded directly into a RON session. Tamper-evident technology applies the digital seal and signer signatures per Ohio standards.",
    citations: [ORC("147.66", "Tamper-evident technology requirement")],
  },
  {
    id: "dz-pii",
    question: "Is my document data secure?",
    answer:
      "Files are stored in encrypted cloud storage with row-level security. PII fields can be redacted with the built-in tool. Documents linked to RON sessions are retained for the 10-year period required by Ohio law; non-RON drafts are auto-purged after 90 days unless saved.",
    citations: [ORC("147.66")],
  },
  {
    id: "dz-formats",
    question: "What file types are supported?",
    answer:
      "PDF, PNG, JPG, TIFF, and HEIC for input. Output as PDF (text-searchable), DOCX, or PNG/JPG. OCR runs automatically for scanned images.",
  },
  {
    id: "dz-legal-advice",
    question: "Will you give me legal advice on the document?",
    answer:
      "No. Document preparation and notarization are clerical services. Choosing forms or interpreting their effect is the unauthorized practice of law and outside our scope. We can refer you to an Ohio-licensed attorney.",
    citations: [
      { label: "ORC §4705.07", url: "https://codes.ohio.gov/ohio-revised-code/section-4705.07", description: "Unauthorized practice of law" },
    ],
  },
];

export const FAQ_BY_SERVICE = {
  ron: RON_FAQS,
  loanSigning: LOAN_SIGNING_FAQS,
  digitize: DIGITIZE_FAQS,
} as const;
