import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, FileText, Users, Shield, AlertTriangle, CheckCircle, BookOpen, ExternalLink,
  GraduationCap, Scale, Gavel, Globe, Briefcase, Notebook, Stamp, Fingerprint,
  MapPin, Plus, TrendingUp, Zap, FileCheck, UserCheck, ShieldAlert, XCircle,
  FileSearch, Info, Copy, Download, Car, Building2, PenTool, Eye, Printer, ImageIcon,
  MessageSquare, Send, Loader2, Bot
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AnatomyDiagram, DOCUMENT_ANATOMY } from "@/components/AnatomyDiagram";
import { ProcessGuide } from "@/components/ProcessGuide";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: FORM VAULT
// ═══════════════════════════════════════════════════════════════════════════════

interface FormEntry {
  category: string;
  name: string;
  ref: string;
  desc: string;
  items: string[];
  anatomy: Record<string, string>;
  certificateText?: string;
  ohioTip?: string;
  exampleImage?: string;
  anatomyKey?: string;
}

import juratImg from "@/assets/documents/jurat-certificate.jpg";
import ackImg from "@/assets/documents/acknowledgment-certificate.jpg";
import corpImg from "@/assets/documents/corporate-acknowledgment.jpg";
import poaImg from "@/assets/documents/poa-acknowledgment.jpg";
import copyImg from "@/assets/documents/copy-certification.jpg";
import markImg from "@/assets/documents/signature-by-mark.jpg";
import vehicleImg from "@/assets/documents/vehicle-title-notarization.jpg";

const formImageMap: Record<string, string> = {
  "Ohio Jurat (Individual)": juratImg,
  "Acknowledgment (Individual)": ackImg,
  "Acknowledgment (Corp/LLC)": corpImg,
  "Attorney-in-Fact (POA)": poaImg,
  "Copy Certification": copyImg,
  "Signature by Mark (The X)": markImg,
  "Ohio Vehicle Title (Seller)": vehicleImg,
};

const forms: FormEntry[] = [
  {
    category: "General",
    name: "Ohio Jurat (Individual)",
    ref: "ORC §147.55",
    desc: "Used for Affidavits where the signer is sworn in under oath.",
    items: ["State of Ohio / County of...", "Sworn to and subscribed before me", "Signer Identity", "Date of Act", "Notary Signature/Seal"],
    anatomyKey: "jurat",
    anatomy: {
      venue: "Indicates where the notarial act physically took place. Must match your location.",
      testimonium: "The 'Sworn to...' clause proving the oath was administered correctly.",
      verification: "The specific date the signer appeared before you.",
      signature: "Your official signature as commissioned by the Secretary of State.",
      seal: "Must be clear and legible. Do not overlap with text or signatures."
    },
    certificateText: `Sworn to and subscribed before me this ____ day of ________, 20___, by ________________________________ (Signer Name).`,
    ohioTip: "Remember: An oath is a verbal act. You must ask the signer: 'Do you solemnly swear that the statements in this document are true?'"
  },
  {
    category: "General",
    name: "Acknowledgment (Individual)",
    ref: "ORC §147.55",
    desc: "Standard verification that a signer signed willingly.",
    items: ["State of Ohio / County of...", "Acknowledged before me", "Signer Name", "Date of Act", "Notary Seal"],
    anatomyKey: "acknowledgment",
    anatomy: {
      acknowledgment: "Proof the signer appeared and declared the signature is theirs.",
      capacity: "Implicitly confirms the signer is acting as themselves and of their own free will.",
      venue: "Physical location (County) of the signing act."
    },
    certificateText: `The foregoing instrument was acknowledged before me this ____ day of ________, 20___, by ________________________________ (Signer Name).`,
    ohioTip: "Unlike a Jurat, an Acknowledgment verifies the signer's identity and volition, but does not require an oath."
  },
  {
    category: "Corporate",
    name: "Acknowledgment (Corp/LLC)",
    anatomyKey: "corporate",
    ref: "ORC §147.55",
    desc: "Signer acting as an officer or agent for a company.",
    items: ["Officer Name", "Title (e.g. Managing Member)", "Entity Name (LLC/INC)", "State of Incorporation"],
    anatomy: {
      representative: "Critical label identifying the signer's authority to bind the entity.",
      entity: "The legal name of the corporation or partnership being represented.",
      title: "The specific office held (e.g., President, Manager) by the signer."
    },
    certificateText: `The foregoing instrument was acknowledged before me this ____ day of ________, 20___, by ________________________________ (Signer Name), as ________________ (Title) of ________________________________ (Entity Name), a ________________ corporation/partnership, on behalf of the entity.`,
    ohioTip: "When notarizing for a corporation, you are verifying the PERSON's identity, not the entity itself. Always confirm the signer's authority."
  },
  {
    category: "Specialized",
    name: "Attorney-in-Fact (POA)",
    anatomyKey: "poa",
    ref: "Common Law",
    desc: "When signing on behalf of a Principal under a Power of Attorney.",
    items: ["Agent Name", "As Attorney-in-Fact for...", "Principal Name", "Date of POA Reference"],
    anatomy: {
      substitution: "Explains that John Doe is signing for Jane Smith via power of attorney.",
      authority: "Reference to the valid POA document that grants this power."
    },
    certificateText: `The foregoing instrument was acknowledged before me this ____ day of ________, 20___, by ________________________________ as attorney-in-fact for ________________________________, under power of attorney dated ________________.`,
    ohioTip: "Always request to see the original POA document. Verify it hasn't been revoked and covers the type of transaction."
  },
  {
    category: "Specialized",
    name: "Copy Certification",
    anatomyKey: "copy_certification",
    ref: "ORC §147.51",
    desc: "Certifying that a copy is a true replica of an original document.",
    items: ["Type of Document", "Date of Certification", "Custody Statement", "Notary Signature"],
    anatomy: {
      facsimile: "Certifies the copy was made by the notary or under their supervision.",
      custodian: "Identity of the person presenting the original for copying."
    },
    certificateText: `I certify that this is a true, exact, complete, and unaltered photocopy of the original document presented to me by ________________________________ this day.`,
    ohioTip: "Ohio notaries CANNOT certify copies of vital records (birth/death certificates). Direct the client to the appropriate government office."
  },
  {
    category: "Specialized",
    name: "Signature by Mark (The X)",
    anatomyKey: "signature_by_mark",
    ref: "ORC §147.542",
    desc: "Signer cannot sign name but can make a mark.",
    items: ["The Mark (X)", "Witness 1 Signature", "Witness 2 Signature", "Notary Explanation"],
    anatomy: {
      witnessing: "Requires two disinterested witnesses to the making of the mark.",
      mark_verification: "The 'X' or mark made by the signer in lieu of a signature."
    },
    certificateText: `Sworn to and subscribed by mark before me this ____ day of ________, 20___, by ________________________________, who made their mark (X) in the presence of witnesses.`,
    ohioTip: "Two disinterested witnesses must watch the mark being made. One witness writes the signer's name next to the mark."
  },
  {
    category: "Vehicle",
    name: "Ohio Vehicle Title (Seller)",
    anatomyKey: "vehicle_title",
    ref: "ORC §4505.06",
    desc: "Transfer of title — requires strict Jurat compliance. High discipline risk.",
    items: ["Price/Value", "Odometer Reading", "Buyer Info (Name/Address)", "Seller Signature Under Oath"],
    anatomy: {
      odometer: "Critical legal disclosure; any tampering voids the act.",
      price: "Must match the actual transaction value for tax purposes.",
      seller_oath: "The seller is swearing that all info on the title is true."
    },
    certificateText: `Sworn to and subscribed before me this ____ day of ________, 20___, by ________________________________ (Seller), who swore under oath that the purchase price, odometer reading, and sales date are true and correct.`,
    ohioTip: "Vehicle titles are the #1 source of notary discipline in Ohio. Never notarize an 'Open Title' (blank buyer info) — it is a felony."
  },
  {
    category: "General",
    name: "Oath/Affirmation (Oral)",
    anatomyKey: "oath_affirmation",
    ref: "ORC §147.14",
    desc: "Verbal oath not attached to a written document.",
    items: ["Identity Verification", "Verbal Script", "Witnessing of Response", "Journal Entry"],
    anatomy: {
      solemnity: "The spiritual or legal gravity of the spoken promise.",
      script: "The exact words spoken to place the individual under oath."
    },
    certificateText: `On this ____ day of ________, 20___, ________________________________ personally appeared before me and took an oath/affirmation as described in the journal entry for this date.`,
    ohioTip: "Oral oaths are still notarial acts. Record them in your journal with as much detail as possible."
  },
  {
    category: "Correction",
    name: "Certificate Correction",
    anatomyKey: "certificate_correction",
    ref: "ORC §147.54",
    desc: "Amending a certificate after an error is discovered.",
    items: ["Original Date", "Description of Error", "Date of Correction", "Explanation Statement"],
    anatomy: {
      amendment: "Ohio permits correcting errors only on the original certificate, never by replacing it.",
      tracking: "Refers back to the original date of the faulty act."
    },
    certificateText: `I, the undersigned Notary Public, do hereby certify that the notarial certificate dated ________________ contains an error and is hereby corrected to reflect the following...`,
    ohioTip: "Never tear up or replace a defective certificate. Draw a single line through the error, initial, date, and note the correction."
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: DOCUMENT INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════

const docIntel = [
  { name: "General Warranty Deed", keyFlags: ["Legal Description", "Grantor/Grantee", "Conveyance"], notaryRole: "Witness Grantor Signature (Acknowledgment)" },
  { name: "Last Will & Testament", keyFlags: ["Self-Proving Affidavit", "Two Witnesses", "Testator Signature"], notaryRole: "Administer Oath for Self-Proving Affidavit" },
  { name: "Promissory Note", keyFlags: ["Principal Amount", "Interest Rate", "Maturity Date"], notaryRole: "Standard Acknowledgment of Borrower" },
  { name: "Health Care Directive", keyFlags: ["Proxy Designation", "End of Life Instructions"], notaryRole: "Verify Competency & Volition" },
  { name: "Quitclaim Deed", keyFlags: ["No Warranty", "Grantor Release", "Legal Description"], notaryRole: "Acknowledgment of Grantor — no title guarantee" },
  { name: "Affidavit of Heirship", keyFlags: ["Decedent Info", "Heir Listing", "Sworn Statement"], notaryRole: "Administer Jurat — affiant swears facts are true" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: SPECIAL CIRCUMSTANCES
// ═══════════════════════════════════════════════════════════════════════════════

interface SpecialCircumstance {
  id: string;
  title: string;
  iconName: string;
  orc: string;
  summary: string;
  script: string;
  details: string;
  steps: string[];
}

const specialCircumstances: SpecialCircumstance[] = [
  {
    id: "disability",
    title: "Alternative Signer (Physical Disability)",
    iconName: "users",
    orc: "ORC §147.59",
    summary: "Signer is mentally lucid but cannot physically sign.",
    script: '"Do you clearly indicate to me your intent for [Proxy Name] to sign your name on this document on your behalf?"',
    details: "A person who is physically unable to sign a document may direct another individual to sign. The proxy must not be a party to the transaction. The notary certificate MUST state: 'Document signed by [Name of Proxy] at the direction of [Name of Signer] under ORC §147.59.'",
    steps: ["Verify signer intent and mental lucidity.", "ID both Signer & Proxy with acceptable photo ID.", "Ensure Proxy is disinterested (not named in document).", "Proxy signs in signer's presence and yours.", "Note Proxy arrangement in Certificate and Journal."]
  },
  {
    id: "mark",
    title: 'Signature by Mark (The "X")',
    iconName: "fingerprint",
    orc: "ORC §147.542",
    summary: "Signer is illiterate or physically unable to write full name.",
    script: '"Do you acknowledge this mark to be your legal signature on this document?"',
    details: "Requires two disinterested witnesses. Note 'Signature by Mark' clearly. One witness writes the signer's name next to the mark.",
    steps: ["Signer makes X in your presence.", "Two disinterested witnesses observe the mark.", "One witness writes signer's name next to mark.", "Both witnesses sign as witnesses.", "Complete Jurat/Acknowledgment with 'signature by mark' note."]
  },
  {
    id: "venue",
    title: "Determining Correct Venue",
    iconName: "globe",
    orc: "ORC §147.07",
    summary: "Confusion between home city and act location.",
    script: '"I am currently in Franklin County, Ohio, so the venue must reflect where we are standing right now."',
    details: "Venue is the location where the act is performed, regardless of where the document was drafted or where the notary lives. If the certificate has a pre-printed venue that doesn't match your location, cross it out and write the correct one.",
    steps: ["Identify current county where the act is being performed.", "Verify it matches your state of commission (Ohio).", "Cross-out incorrect pre-printed venue if necessary.", "Write in the correct venue clearly.", "Document the venue correction in your journal."]
  },
  {
    id: "vehicle",
    title: "Ohio Vehicle Title Masterclass",
    iconName: "car",
    orc: "ORC §4505.06 / HB 315",
    summary: "#1 source of notary discipline in Ohio. Strict Jurat requirement.",
    script: '"Please raise your right hand. Do you solemnly swear or affirm, under penalty of perjury, that the purchase price, odometer reading, and sales date listed on this title are true and correct to the best of your knowledge?"',
    details: "Vehicle titles require a Jurat (Oath), not just an Acknowledgment. Under HB 315 (2025), notarization is no longer required when a licensed motor vehicle dealer is involved in the transfer. For private sales, full notarization with oath is mandatory.",
    steps: [
      "Ask: 'Is a licensed motor vehicle dealer involved in this transfer?' — if YES, notarization may not be required (HB 315).",
      "Check for white-out or crossed-out text — if present, STOP. Title is void; signer must get a duplicate.",
      "Verify Buyer's Name and Address are filled in BEFORE notarizing — 'Open Title' with blank buyer info is a FELONY.",
      "Administer the oath (Jurat, not Acknowledgment).",
      "Verify the odometer reading and purchase price are filled in.",
      "Complete the notarization — stamp venue on the title itself.",
      "Record in journal with all vehicle title details."
    ]
  },
  {
    id: "representative",
    title: "Representative Capacity & POA",
    iconName: "building",
    orc: "ORC §147.55",
    summary: 'When a signer says "I\'m signing for my dad" or "I\'m the CEO."',
    script: '"Do you acknowledge that you are signing this document in your capacity as [Title] for [Entity/Person], and that you have the legal authority to do so?"',
    details: "When someone signs on behalf of another, the notary must verify the signer's authority. For Attorney-in-Fact: verify the POA document allows the specific act. For Corporate Officers: ensure signer lists their title and company name. For Trustees: signer must sign as 'John Doe, Trustee of the Doe Family Trust.'",
    steps: [
      "Verify the signer's personal identity with acceptable photo ID.",
      "Determine their capacity: Attorney-in-Fact, Corporate Officer, or Trustee.",
      "Request and review authority documents (POA, corporate resolution, trust agreement).",
      "Confirm the authority covers the specific transaction.",
      "Signer signs their own name + title (e.g., 'John Smith, President').",
      "Notarial certificate must reference the representative capacity.",
      "Record entity name and signer's title in journal."
    ]
  },
  {
    id: "duress",
    title: "Signer Under Duress or Coercion",
    iconName: "shield",
    orc: "ORC §147.04",
    summary: "Red flags: nervousness, another person answering for the signer.",
    script: '"Are you signing this document of your own free will?"',
    details: "If you suspect the signer is being forced or coerced, you have a legal obligation to refuse. Watch for: signer reluctant to sign, another party speaking for them, signer seems confused or afraid, evidence of undue influence especially with elderly signers.",
    steps: [
      "Watch for red flags during the interaction.",
      "If possible, speak to the signer PRIVATELY.",
      "Ask directly: 'Are you signing this document of your own free will?'",
      "If you suspect duress: REFUSE to notarize.",
      "Document your refusal and reasons in your journal.",
      "If you suspect elder abuse: contact Ohio Adult Protective Services (1-855-642-1999)."
    ]
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: SIMULATOR LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

const simLevels = [
  {
    title: "The 'Open Title' Trap",
    document: "Ohio Vehicle Title — Back Side",
    error: "Buyer name is blank.",
    options: ["Sign and stamp — the buyer can fill it in later", "Refuse and explain the law to the seller"],
    correct: 1,
    explanation: "Notarizing an 'Open Title' (blank buyer info) is a felony-level offense in Ohio under ORC §4505.06. All buyer information must be completed before notarization."
  },
  {
    title: "The Expired Credential",
    document: "Driver License — Expired 2022",
    error: "Signer presents an expired ID.",
    options: ["Accept if they look like the photo — it's close enough", "Refuse service and explain acceptable ID requirements"],
    correct: 1,
    explanation: "Ohio law (ORC §147.542) requires current, valid government-issued photo ID. Expired documents are NOT acceptable for identification purposes."
  },
  {
    title: "The White-Out Cover-Up",
    document: "Vehicle Title with visible correction fluid",
    error: "White-out visible on the purchase price field.",
    options: ["Notarize anyway — it's just a minor correction", "Refuse — the title is void and needs a duplicate"],
    correct: 1,
    explanation: "Any use of correction fluid on an Ohio vehicle title renders it void. The signer must apply for a duplicate title from the Ohio BMV before the transfer can proceed."
  },
  {
    title: "The Nervous Elder",
    document: "Power of Attorney — Durable",
    error: "An elderly woman seems confused. Her adult son keeps answering your questions for her.",
    options: ["Proceed — her son knows what's best for her", "Speak to the woman privately and assess her willingness"],
    correct: 1,
    explanation: "Under ORC §147.04, you must verify the signer is acting willingly and understands the document. Speak privately to the signer. If you suspect duress or lack of capacity, REFUSE to notarize."
  },
  {
    title: "The Pre-Signed Document",
    document: "Quitclaim Deed — Already Signed",
    error: "The signer says 'I already signed it at home, I just need the stamp.'",
    options: ["Stamp it — you can see their name is written", "Refuse — the signer must sign in your presence"],
    correct: 1,
    explanation: "Ohio law requires the signer to sign in the notary's presence (or acknowledge their signature in your presence for an Acknowledgment). You cannot notarize a document you did not witness being signed or acknowledged."
  },
  {
    title: "The Family Member Request",
    document: "Affidavit — Property Transfer",
    error: "Your sister asks you to notarize her affidavit for a property transfer.",
    options: ["Notarize it — family shouldn't be a problem", "Decline — you have a direct interest conflict"],
    correct: 1,
    explanation: "Ohio law prohibits notarizing for family members (spouse, parent, child, sibling) or when you have a direct financial interest. Refer your sister to another notary."
  },
  {
    title: "The Corporate Signer",
    document: "LLC Operating Agreement Amendment",
    error: "A man says he's the Managing Member of ABC LLC but has no documentation.",
    options: ["Take his word for it and notarize", "Request proof of authority before proceeding"],
    correct: 1,
    explanation: "When notarizing in a representative capacity, you should verify the signer's authority. Request articles of organization, operating agreement, or corporate resolution showing they are authorized to sign on behalf of the entity."
  },
  {
    title: "The RON KBA Failure",
    document: "RON Session — Mortgage Refinance",
    error: "The signer failed KBA on their first attempt.",
    options: ["Allow one more attempt, then terminate if failed", "Skip KBA since you can see their face on video"],
    correct: 0,
    explanation: "Per ORC §147.66, a signer gets up to 2 KBA attempts. If both fail, the session MUST be terminated and rescheduled. KBA cannot be skipped under any circumstances."
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: SERVICE GUIDES (PRESERVED FROM ORIGINAL)
// ═══════════════════════════════════════════════════════════════════════════════

const documentGuides = [
  {
    category: "Real Estate", icon: "🏠",
    guides: [
      { title: "Deed Notarization (Warranty, Quit Claim, TOD)", tags: ["acknowledgment", "real estate"], steps: ["Verify identity of ALL grantors using acceptable government-issued photo ID", "Confirm the grantor(s) understand they are transferring property", "Ensure the document has the legal description of the property", "Have grantor(s) sign in your presence (do NOT accept pre-signed documents)", "Complete the acknowledgment certificate — confirm they signed willingly", "Apply notary seal and signature", "Record in notary journal: date, signer name, ID type/number, document type, fee", "Verify county recorder formatting requirements if applicable"], whoPresent: "All grantors (sellers/transferors). Grantees do NOT need to be present unless also signing.", warnings: ["Never notarize a deed if the signer seems confused about what they're signing", "Check for power of attorney if someone is signing on behalf of another"] },
      { title: "Mortgage Closing Package", tags: ["acknowledgment", "real estate", "batch"], steps: ["Review the closing package — identify which documents require notarization", "Verify identity of ALL borrowers using acceptable photo ID", "Proceed through documents one at a time, explaining each signature line", "For each notarized document: have the borrower sign, then complete the certificate", "Apply seal and signature to each notarized document", "Create separate journal entries for EACH notarized document", "Return completed package to title company/lender"], whoPresent: "All borrowers named on the mortgage.", warnings: ["Closing packages can have 50+ pages — only some require notarization", "Never rush a signer through documents they don't understand", "Some lenders require specific notary certificates — use theirs, not yours"] },
    ],
  },
  {
    category: "Legal Documents", icon: "⚖️",
    guides: [
      { title: "Power of Attorney (All Types)", tags: ["acknowledgment", "legal", "capacity"], steps: ["Verify the principal's identity using acceptable photo ID", "CRITICAL: Assess the principal's mental capacity — they must understand what they're signing", "Confirm the principal understands they are granting authority to the agent", "Have the principal sign in your presence", "Complete the acknowledgment certificate", "Apply seal and signature", "Record in journal with special note about capacity observation"], whoPresent: "Only the PRINCIPAL must appear. The agent/attorney-in-fact does NOT need to be present.", warnings: ["If you have ANY doubt about the principal's mental capacity, DO NOT proceed", "A notary cannot give legal advice about which type of POA to use", "Healthcare POA in Ohio requires 2 witnesses per ORC §1337.12"] },
      { title: "Affidavits & Sworn Statements (Jurat)", tags: ["jurat", "oath", "legal"], steps: ["Verify the affiant's identity using acceptable photo ID", "Have the affiant read the document (or confirm they have read it)", "Administer the oath or affirmation — REQUIRED for jurats", "Oath script: 'Do you solemnly swear (or affirm) that the statements in this document are true and correct to the best of your knowledge?'", "After the affiant responds 'I do,' have them sign the document", "Complete the jurat certificate (different from acknowledgment!)", "Apply seal and signature", "Record in journal — note that oath was administered"], whoPresent: "The affiant (person making the sworn statement).", warnings: ["A JURAT requires an oath — this is NOT optional", "The difference between acknowledgment and jurat matters legally", "If using wrong certificate type, the document may be rejected"] },
    ],
  },
  {
    category: "Estate Planning", icon: "📋",
    guides: [
      { title: "Last Will & Testament", tags: ["acknowledgment", "witnesses", "estate"], steps: ["Verify the testator's identity using acceptable photo ID", "Ensure TWO disinterested witnesses are present (ORC §2107.03)", "Witnesses must NOT be beneficiaries of the will", "Testator signs the will in presence of both witnesses and notary", "Both witnesses sign the will", "If there's a self-proving affidavit: administer oath to testator and witnesses", "All three (testator + 2 witnesses) sign the self-proving affidavit", "Notarize the self-proving affidavit (NOT the will itself)", "Apply seal and signature to the affidavit", "Record in journal"], whoPresent: "Testator + 2 disinterested witnesses. All must be present simultaneously.", warnings: ["The NOTARY should not be a beneficiary or named in the will", "You notarize the SELF-PROVING AFFIDAVIT, not the will itself", "Witnesses must be competent adults who are NOT beneficiaries"] },
      { title: "Healthcare Directive / Living Will", tags: ["acknowledgment", "witnesses", "healthcare"], steps: ["Verify the principal's identity using acceptable photo ID", "Confirm the principal is of sound mind and acting voluntarily", "Ensure TWO witnesses are present per ORC §1337.12", "Witnesses cannot be: attending physician, nursing home admin, or the named agent", "Principal signs the directive", "Both witnesses sign", "Notarize the document", "Apply seal and record in journal"], whoPresent: "Principal + 2 qualified witnesses.", warnings: ["Witness restrictions are strict — verify each witness is eligible", "This document has serious life-and-death implications — ensure the principal understands"] },
    ],
  },
  {
    category: "I-9 Employment Verification", icon: "📝",
    guides: [
      { title: "I-9 Authorized Representative Procedure", tags: ["I-9", "employment", "verification"], steps: ["Confirm you are acting as an Authorized Representative for the employer, NOT as a notary", "Do NOT use your notary seal or stamp — this is NOT a notarial act", "The employer must provide you with the I-9 form (or the employee brings it)", "Review Section 1 — confirm the employee has completed it", "Examine the employee's identity and work authorization documents from List A, or List B + List C", "Verify the documents appear genuine and relate to the employee presenting them", "Complete Section 2: record document titles, issuing authority, document numbers, and expiration dates", "Sign and date Section 2 as 'Authorized Representative'", "Return the completed I-9 to the employer — do NOT keep copies of employee documents unless employer instructs you to", "Bill as a separate service — this is NOT subject to Ohio's $5 notary fee cap"], whoPresent: "The employee in person. The employer does NOT need to be present — that's why they hired you.", warnings: ["DO NOT notarize the I-9 form — there is no notarial certificate on it", "DO NOT give immigration or legal advice", "DO NOT determine whether documents are fraudulent — only that they 'reasonably appear genuine'", "You cannot do I-9 verification remotely — the employee MUST be physically present", "Keep records of the date, employee name, and employer for your own records (separate from notary journal)"] },
      { title: "I-9 Re-verification (Section 3)", tags: ["I-9", "re-verification", "employment"], steps: ["Employer contacts you for re-verification of expiring work authorization", "Meet with the employee in person", "Examine the new or renewed work authorization document", "Complete Section 3 of the existing I-9 form", "Sign and date as Authorized Representative", "Return to employer"], whoPresent: "The employee. Must be in-person.", warnings: ["Only work authorization documents need re-verification, NOT identity documents", "Do NOT ask for more documents than required — this could be discriminatory"] },
    ],
  },
  {
    category: "Apostille & International", icon: "🌍",
    guides: [
      { title: "Apostille Facilitation (Ohio SOS)", tags: ["apostille", "international", "authentication"], steps: ["Receive the client's document — determine if it's a public document eligible for apostille", "Eligible documents: birth/death certificates, court documents, notarized documents, articles of incorporation", "If the document needs notarization first, notarize it before submitting for apostille", "Complete the Ohio Secretary of State Apostille Request Form", "Include payment: $10 per document (check or money order payable to 'Ohio Secretary of State')", "Submit to: Ohio Secretary of State, 22 N. Fourth St., Columbus, OH 43215", "Processing: standard is 5-7 business days; expedited (additional $10/doc) is 1-2 business days", "Track the request and notify client when completed", "Mail or deliver the apostilled document to the client", "Bill client for: your service fee + apostille fees + postage/shipping"], whoPresent: "Client provides documents — they don't need to be present for the SOS submission.", warnings: ["Some countries require consular legalization INSTEAD of apostille — check if the destination country is a Hague Convention member", "Ohio SOS only apostilles Ohio-originated documents", "Federal documents (FBI checks, etc.) must go through the U.S. Department of State"] },
    ],
  },
  {
    category: "Document Preparation", icon: "📄",
    guides: [
      { title: "Clerical Document Field-Filling", tags: ["document prep", "clerical", "field-filling"], steps: ["Client provides the blank form/template or you retrieve from your template library", "Confirm you are ONLY filling in factual information provided by the client — NOT drafting legal language", "Fill in standard fields: names, addresses, dates, property descriptions, etc.", "Read back all filled fields to the client for verification", "Have the client review the completed document before signing", "If the document also needs notarization, proceed with the notarization after review", "Bill document preparation and notarization as separate line items"], whoPresent: "The client (to provide information and review).", warnings: ["NEVER draft legal language, select legal terms, or advise which form to use — this is unauthorized practice of law", "Only fill in factual information the client provides", "Document 'Prepared by: [Your name], at the direction of [Client name]' on the document"] },
    ],
  },
  {
    category: "RON Session Management", icon: "🖥️",
    guides: [
      { title: "SignNow RON Session Setup & Execution", tags: ["RON", "remote", "SignNow", "online"], steps: ["Verify you have an active Ohio RON commission and authorization", "From the appointment, click 'Start RON Session' to create a SignNow session", "The system automatically adds the client as primary signer and sends invitation", "Signer completes Knowledge-Based Authentication (KBA) — they must answer 5 questions correctly", "Signer completes ID verification (credential analysis) via SignNow", "Once both KBA and ID verification pass, the live video session begins", "During session: verify signer identity on camera, confirm willingness", "Walk through each document — signer applies electronic signature", "Apply your electronic notary seal and signature", "Complete the session — SignNow auto-generates the recording", "Download the notarized document and recording for your records", "Record in notary journal with RON-specific fields: session ID, KBA result, recording reference", "Deliver notarized document to signer via SignNow or email"], whoPresent: "Signer(s) via live audio-video connection. Must be real-time, not pre-recorded.", warnings: ["RON sessions MUST be recorded and stored for minimum 10 years per ORC §147.66", "Signer must be in a jurisdiction that recognizes Ohio RON (most U.S. states do)", "If KBA fails 2 attempts, the session must be terminated", "Ensure stable internet connection for both parties", "Signer cannot use a virtual background — face must be clearly visible"] },
    ],
  },
  {
    category: "Business & Bulk Services", icon: "🏢",
    guides: [
      { title: "Business Client Onboarding", tags: ["business", "onboarding", "corporate"], steps: ["Meet with the business representative to understand their notarization needs", "Verify the business entity: request articles of incorporation, operating agreement, or corporate resolution", "Identify authorized signers — request a list with titles and authorization documentation", "Set up a business profile in the system with all authorized signers", "Discuss pricing: volume discounts, monthly billing, or per-notarization pricing", "Establish preferred scheduling: walk-in availability, scheduled appointments, or on-site visits", "Provide the business with a dedicated booking link or account", "Set up recurring appointment schedule if applicable (e.g., weekly I-9 verification)", "Document all agreements and authorized signer information securely"], whoPresent: "Business representative with authority to establish the service agreement.", warnings: ["Each individual signer must still present valid ID at time of notarization", "Corporate resolutions can expire — verify authorization is current", "Maintain a file for each business client with their authorized signer list"] },
    ],
  },
  {
    category: "Witness Coordination", icon: "👥",
    guides: [
      { title: "Witness Services & Coordination", tags: ["witness", "coordination", "estate"], steps: ["Determine how many witnesses are required for the document (varies by document type)", "Verify witness eligibility — disinterested parties, not beneficiaries, competent adults", "If providing witness services: you or your staff can serve as witnesses if not otherwise disqualified", "If coordinating external witnesses: confirm availability and eligibility before the appointment", "At the appointment: introduce witnesses to the signer, explain their role", "Witnesses observe the signing and sign the document themselves", "If a self-proving affidavit is involved: administer oath to witnesses as well", "Record witness names and information in your journal"], whoPresent: "Signer + required number of witnesses + notary.", warnings: ["The NOTARY generally should NOT serve as a witness AND notary on the same document", "Witnesses must be disinterested — they should have no stake in the document", "For Ohio wills: exactly TWO witnesses required, neither can be a beneficiary"] },
    ],
  },
  {
    category: "Situational Guides", icon: "🔧",
    guides: [
      { title: "Signer Has Limited English Proficiency", tags: ["special", "interpreter"], steps: ["Determine if the signer can communicate their understanding of the document", "A qualified interpreter may assist — the interpreter should be a disinterested party", "The notary does NOT need to understand the document's language", "The notary DOES need to communicate directly with the signer for the oath/acknowledgment", "Consider having the interpreter take an oath to translate accurately", "Document the interpreter's name and the language used in your journal", "Complete notarization as normal"], whoPresent: "The signer + qualified interpreter (if needed).", warnings: ["Never sign as interpreter yourself", "If you cannot communicate with the signer at all, you should decline"] },
      { title: "Signer Appears Under Duress or Coercion", tags: ["special", "refusal", "ethics"], steps: ["Watch for red flags: nervousness, another person answering for the signer, reluctance to sign", "Speak to the signer PRIVATELY if possible", "Ask the signer directly: 'Are you signing this document of your own free will?'", "If you suspect duress: REFUSE to notarize. This is your legal obligation.", "Document your refusal and the reasons in your journal", "If you suspect elder abuse: contact Adult Protective Services (Ohio: 1-855-642-1999)"], whoPresent: "Ideally, speak with the signer alone to assess voluntariness.", warnings: ["NEVER notarize if you suspect the signer is being coerced", "Trust your instincts — if something feels wrong, it probably is"] },
      { title: "Notarizing for a Corporation/LLC", tags: ["business", "entity", "authority"], steps: ["Verify the signer's personal identity using acceptable photo ID", "Determine the signer's authority to sign on behalf of the entity", "Ask to see: articles of incorporation, corporate resolution, operating agreement, or letter of authority", "The signer signs their own name + their title (e.g., 'John Smith, President')", "The notarial certificate should reference the signer's representative capacity", "Record the entity name and signer's title in your journal"], whoPresent: "The authorized representative of the entity.", warnings: ["You are notarizing the PERSON's signature, not the entity", "If you doubt their authority, ask for documentation"] },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: COMPLIANCE, GUIDES, EXTERNAL RESOURCES
// ═══════════════════════════════════════════════════════════════════════════════

const complianceReminders = [
  { title: "Seal Requirements", items: ["Must include: your name, 'Notary Public', 'State of Ohio'", "Commission expiration date", "Must be legible and reproducible when photocopied"] },
  { title: "Journal Requirements (ORC §147.551)", items: ["Date and time of notarial act", "Type of notarial act", "Document type and description", "Signer's name and address", "ID type and number", "Fee charged", "For RON: session recording stored 10+ years"] },
  { title: "Prohibited Acts", items: ["Cannot notarize your own signature", "Cannot notarize for spouse, parent, child, or sibling", "Cannot notarize if you have a direct financial interest", "Cannot practice law or give legal advice", "Cannot notarize a document you know is false", "Cannot notarize without the signer present"] },
  { title: "Acceptable Forms of ID (ORC §147.542)", items: ["Valid Ohio driver's license or state ID", "Valid U.S. passport or passport card", "Valid U.S. military ID", "Valid foreign passport", "Note: Social Security cards, credit cards, and expired IDs are NOT acceptable"] },
  { title: "Fees (ORC §147.08)", items: ["Maximum fee per notarial act: $5.00 (Ohio statutory limit)", "RON technology fee: up to $10.00 per session (HB 315 2025)", "Travel fees are NOT regulated — set your own", "Always provide a receipt when requested"] },
];

const newNotaryGuide = [
  { step: "1", title: "Meet Ohio Requirements", content: "You must be at least 18 years old, a legal resident of Ohio, able to read and write English, and have no felony convictions. If you're applying for the first time, you must also complete a state-approved notary education course." },
  { step: "2", title: "Complete Required Education", content: "First-time Ohio notaries must complete a 3-hour education course from an approved provider. The Ohio Secretary of State maintains a list of approved providers on their website. For RON, additional 3-hour RON training is required." },
  { step: "3", title: "Apply with Ohio Secretary of State", content: "Submit your application online or by mail to the Ohio Secretary of State. Application fee is approximately $15. You'll need to provide personal information, education certificate number, and choose your commission county." },
  { step: "4", title: "Obtain a Surety Bond", content: "Ohio requires a $10,000 surety bond ($25,000 for online notaries). Purchase from a licensed surety company. The bond protects the public if you make an error. File the bond with the county clerk of courts in your commission county." },
  { step: "5", title: "Purchase Your Notary Seal", content: "Your seal must include: your name as commissioned, 'Notary Public', 'State of Ohio', and your commission expiration date. Both embossing seals and ink stamps are acceptable in Ohio. Order from an authorized vendor." },
  { step: "6", title: "Take Your Oath of Office", content: "After your commission is approved, take the oath of office before the county clerk of courts. You must do this before performing any notarial acts. Keep a copy of your commission certificate." },
  { step: "7", title: "Purchase a Notary Journal", content: "While not mandatory for all acts in Ohio, a journal is REQUIRED for RON sessions and strongly recommended for all notarizations. Record every notarial act including date, signer info, document type, ID type, and fee charged." },
  { step: "8", title: "For RON: Apply for RON Authorization", content: "Submit a separate RON application to the Ohio SOS. Complete 3 hours of additional RON-specific training. Choose an approved RON technology provider (like SignNow). RON commission is separate from traditional commission." },
];

const externalResources = [
  { category: "Ohio Secretary of State", links: [
    { title: "Notary Public Main Page", url: "https://www.ohiosos.gov/notary/", desc: "Official Ohio SOS notary hub — forms, laws, FAQs" },
    { title: "Notary Application Portal", url: "https://notary.ohiosos.gov/", desc: "Online notary application and filing portal" },
    { title: "Notary Resources & FAQs", url: "https://www.ohiosos.gov/notary/information/", desc: "Frequently asked questions and notary guidance" },
    { title: "Application Requirements", url: "https://www.ohiosos.gov/notary/application-requirements/", desc: "Requirements to become a notary in Ohio" },
    { title: "Notary Law Updates", url: "https://www.ohiosos.gov/notary/summary-of-notary-law-changes/", desc: "Summary of recent Ohio notary law changes" },
  ]},
  { category: "Ohio Revised Code", links: [
    { title: "ORC Chapter 147 — Notaries Public", url: "https://codes.ohio.gov/ohio-revised-code/chapter-147", desc: "Complete Ohio notary law chapter" },
    { title: "ORC §147.53 — Administering Oaths", url: "https://codes.ohio.gov/ohio-revised-code/section-147.53", desc: "Requirements for administering oaths and affirmations" },
    { title: "ORC §147.542 — Identification Requirements", url: "https://codes.ohio.gov/ohio-revised-code/section-147.542", desc: "Acceptable ID for notarization" },
    { title: "ORC §147.551 — Journal Keeping", url: "https://codes.ohio.gov/ohio-revised-code/section-147.551", desc: "Notary journal requirements" },
    { title: "ORC §147.65-.66 — RON Authorization", url: "https://codes.ohio.gov/ohio-revised-code/section-147.65", desc: "Remote online notarization statutes" },
  ]},
  { category: "National Notary Association (NNA)", links: [
    { title: "NNA Main Website", url: "https://www.nationalnotary.org/", desc: "Training, supplies, best practices" },
    { title: "NNA Notary Bulletin", url: "https://www.nationalnotary.org/notary-bulletin", desc: "News and updates for notaries" },
    { title: "NNA Signing Agent Certification", url: "https://www.nationalnotary.org/notary-signing-agent", desc: "Become a certified signing agent for loan closings" },
  ]},
  { category: "Other Professional Resources", links: [
    { title: "American Society of Notaries", url: "https://www.asnnotary.org/", desc: "Professional association, education, resources" },
    { title: "Notary.net — Ohio Info", url: "https://www.notary.net/states/ohio", desc: "State-specific notary requirements and resources" },
    { title: "SignNow RON Platform", url: "https://www.signnow.com/", desc: "RON platform for remote online notarization sessions" },
  ]},
  { category: "Multi-State RON Laws & Standards", links: [
    { title: "NCSL — RON State Legislation Tracker", url: "https://www.ncsl.org/financial-services/remote-online-notarization", desc: "National Conference of State Legislatures tracker of RON legislation across all 50 states" },
    { title: "MISMO RON Standards", url: "https://www.mismo.org/standards-and-resources/ron", desc: "Mortgage Industry Standards Maintenance Organization RON technical standards" },
    { title: "ALTA — Best Practices for RON", url: "https://www.alta.org/ron/", desc: "American Land Title Association RON best practices and guidelines" },
    { title: "Uniform Law Commission — RULONA", url: "https://www.uniformlaws.org/committees/community-home?CommunityKey=a28e4ad0-2e77-4e77-879a-1581ef195127", desc: "Revised Uniform Law on Notarial Acts — model legislation adopted by many states" },
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: DEMO JOURNAL
// ═══════════════════════════════════════════════════════════════════════════════

const demoJournalEntries = [
  { id: 1, date: "2025-04-01", signer: "John Doe", type: "Acknowledgment", docType: "Warranty Deed", fee: 5.00, status: "Completed" },
  { id: 2, date: "2025-04-02", signer: "Jane Smith", type: "Jurat", docType: "Affidavit", fee: 5.00, status: "Completed" },
  { id: 3, date: "2025-04-03", signer: "Robert Johnson", type: "Jurat", docType: "Vehicle Title", fee: 5.00, status: "Refused — ID Expired" },
  { id: 4, date: "2025-04-05", signer: "Maria Garcia", type: "Acknowledgment", docType: "Power of Attorney", fee: 5.00, status: "Completed" },
  { id: 5, date: "2025-04-07", signer: "David Chen", type: "Copy Certification", docType: "Diploma", fee: 5.00, status: "Completed" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: ICON RESOLVER
// ═══════════════════════════════════════════════════════════════════════════════

function getCircumstanceIcon(name: string) {
  switch (name) {
    case "users": return <Users className="h-5 w-5 text-blue-500" />;
    case "fingerprint": return <Fingerprint className="h-5 w-5 text-orange-500" />;
    case "globe": return <Globe className="h-5 w-5 text-indigo-500" />;
    case "car": return <Car className="h-5 w-5 text-red-500" />;
    case "building": return <Building2 className="h-5 w-5 text-emerald-500" />;
    case "shield": return <ShieldAlert className="h-5 w-5 text-amber-500" />;
    default: return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminResources() {
  usePageMeta({ title: "Notar — Ohio Notary Toolkit", noIndex: true });
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("vault");
  const [searchTerm, setSearchTerm] = useState("");
  const [formCategory, setFormCategory] = useState("All");
  const [selectedForm, setSelectedForm] = useState<FormEntry | null>(null);
  const [selectedCircumstance, setSelectedCircumstance] = useState<SpecialCircumstance | null>(null);
  const [simLevel, setSimLevel] = useState(0);
  const [simFeedback, setSimFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simScore, setSimScore] = useState({ correct: 0, total: 0 });

  // AI Chat state for document assistant
  const [docChatMessages, setDocChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [docChatInput, setDocChatInput] = useState("");
  const [docChatLoading, setDocChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [docChatMessages]);

  // Reset chat when form changes
  useEffect(() => { setDocChatMessages([]); setDocChatInput(""); }, [selectedForm?.name]);

  const sendDocChat = async () => {
    if (!docChatInput.trim() || docChatLoading || !selectedForm) return;
    const userMsg = { role: "user" as const, content: docChatInput.trim() };
    const updated = [...docChatMessages, userMsg];
    setDocChatMessages(updated);
    setDocChatInput("");
    setDocChatLoading(true);

    try {
      // Save user message to chat_messages for history
      if (user) {
        await supabase.from("chat_messages").insert({
          sender_id: user.id,
          message: `[Doc Q: ${selectedForm.name}] ${userMsg.content}`,
          is_admin: true,
        });
      }

      const systemPrompt = `You are Notar AI, an Ohio notary law expert. The user is asking about: "${selectedForm.name}" (${selectedForm.ref}). Certificate text: "${selectedForm.certificateText || ""}". Ohio tip: "${selectedForm.ohioTip || ""}". Provide accurate, Ohio-specific answers citing ORC sections. Be concise but thorough.`;

      const { data, error } = await supabase.functions.invoke("notary-assistant", {
        body: {
          messages: [
            { role: "system", content: systemPrompt },
            ...updated.map(m => ({ role: m.role, content: m.content })),
          ],
        },
      });

      if (error) throw error;
      const reply = data?.reply || data?.text || data?.response || "I couldn't generate a response.";
      const assistantMsg = { role: "assistant" as const, content: reply };
      setDocChatMessages(prev => [...prev, assistantMsg]);

      // Save AI response to chat_messages for history
      if (user) {
        await supabase.from("chat_messages").insert({
          sender_id: user.id,
          message: `[Doc A: ${selectedForm.name}] ${reply}`,
          is_admin: true,
        });
      }
    } catch (e: any) {
      setDocChatMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setDocChatLoading(false);
    }
  };

  // Filtered forms
  const filteredForms = formCategory === "All" ? forms : forms.filter(f => f.category === formCategory);

  // Filtered service guides
  const filteredGuides = documentGuides.map((cat) => ({
    ...cat,
    guides: cat.guides.filter(
      (g) => g.title.toLowerCase().includes(searchTerm.toLowerCase()) || g.tags.some((t) => t.includes(searchTerm.toLowerCase()))
    ),
  })).filter((cat) => cat.guides.length > 0);

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Sim handler
  const handleSimChoice = (index: number) => {
    const level = simLevels[simLevel];
    const isCorrect = index === level.correct;
    setSimFeedback({ type: isCorrect ? "success" : "error", msg: level.explanation });
    setSimScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
  };

  const nextSimLevel = () => {
    setSimLevel((simLevel + 1) % simLevels.length);
    setSimFeedback(null);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="font-sans text-2xl font-bold text-foreground italic">
            Notar
            <span className="ml-2 text-xs font-normal not-italic uppercase tracking-[0.2em] text-muted-foreground">
              Ohio Notary Toolkit
            </span>
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">Official Resource Library & Statutory Toolset — ORC §147 Compliant</p>
      </div>

      {/* SEARCH */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search guides, forms, ORC references..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="vault"><BookOpen className="mr-1 h-4 w-4" /> Form Vault</TabsTrigger>
              <TabsTrigger value="special"><AlertTriangle className="mr-1 h-4 w-4" /> Special Acts</TabsTrigger>
              <TabsTrigger value="guides"><FileText className="mr-1 h-4 w-4" /> Service Guides</TabsTrigger>
              <TabsTrigger value="journal"><Notebook className="mr-1 h-4 w-4" /> Registry</TabsTrigger>
              <TabsTrigger value="sim"><Gavel className="mr-1 h-4 w-4" /> Sim Lab</TabsTrigger>
              <TabsTrigger value="reference"><Scale className="mr-1 h-4 w-4" /> Reference</TabsTrigger>
            </TabsList>

            {/* ═══════════════ TAB 1: FORM VAULT ═══════════════ */}
            <TabsContent value="vault" className="space-y-6">
              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {["All", "General", "Corporate", "Specialized", "Vehicle", "Correction"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFormCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
                      formCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Form cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredForms.map((f, i) => (
                  <Card
                    key={i}
                    className="cursor-pointer hover:border-primary/50 transition-all group hover:shadow-md"
                    onClick={() => setSelectedForm(f)}
                  >
                    <div className="p-4 border-b bg-muted/30 rounded-t-2xl flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{f.category}</span>
                        <h3 className="font-bold text-foreground leading-tight mt-1">{f.name}</h3>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all">
                        <FileText className="h-4 w-4" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-4 h-8 line-clamp-2">{f.desc}</p>
                      <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                        <span>{f.ref}</span>
                        <span className="bg-muted px-2 py-1 rounded group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          Anatomy View →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ═══════════════ TAB 2: SPECIAL ACTS ═══════════════ */}
            <TabsContent value="special" className="space-y-8">
              {/* Document Intelligence */}
              <section>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" /> Document Intelligence
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docIntel.map((doc, i) => (
                    <Card key={i} className="group hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-foreground">{doc.name}</h3>
                          <FileCheck className="h-5 w-5 text-muted-foreground/30 group-hover:text-green-500 transition-colors" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {doc.keyFlags.map((flag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[9px] font-bold uppercase tracking-wider">{flag}</Badge>
                          ))}
                        </div>
                        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                          <p className="text-[10px] font-bold text-primary uppercase mb-1">Notary Requirement</p>
                          <p className="text-xs font-semibold text-foreground">{doc.notaryRole}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Special Circumstances & Modules */}
              <section>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-primary" /> Special Circumstances & Protocols
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specialCircumstances.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary"
                      onClick={() => setSelectedCircumstance(item)}
                    >
                      <CardContent className="p-5 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border">
                          {getCircumstanceIcon(item.iconName)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground mb-1 text-sm">{item.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.summary}</p>
                          <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                            <Badge variant="outline" className="text-[10px]">{item.orc}</Badge>
                            <span className="text-primary">Protocol →</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </TabsContent>

            {/* ═══════════════ TAB 3: SERVICE GUIDES ═══════════════ */}
            <TabsContent value="guides" className="space-y-8">
              {filteredGuides.length === 0 ? (
                <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">No guides match your search.</CardContent></Card>
              ) : (
                filteredGuides.map((category) => (
                  <div key={category.category}>
                    <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-semibold">
                      <span>{category.icon}</span> {category.category}
                    </h2>
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.guides.map((guide, i) => (
                        <AccordionItem key={i} value={`${category.category}-${i}`} className="rounded-lg border border-border/50 bg-card px-4">
                          <AccordionTrigger className="text-left text-sm font-medium">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{guide.title}</span>
                              {guide.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pb-2">
                              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300"><Users className="h-3 w-3" /> Who Must Be Present</p>
                                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">{guide.whoPresent}</p>
                              </div>
                              <div>
                                <p className="mb-2 text-xs font-semibold text-muted-foreground">Step-by-Step Procedure</p>
                                <div className="space-y-2">
                                  {guide.steps.map((step, j) => (
                                    <div key={j} className="flex gap-3">
                                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{j + 1}</div>
                                      <p className="text-sm">{step}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {guide.warnings.length > 0 && (
                                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300"><AlertTriangle className="h-3 w-3" /> Important Warnings</p>
                                  <ul className="mt-1 space-y-1">
                                    {guide.warnings.map((w, k) => (
                                      <li key={k} className="flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />{w}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))
              )}
            </TabsContent>

            {/* ═══════════════ TAB 4: REGISTRY / JOURNAL ═══════════════ */}
            <TabsContent value="journal" className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="p-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">Total Volume</h4>
                    <p className="text-3xl font-black">{demoJournalEntries.length}</p>
                    <div className="mt-4 flex items-center justify-between text-xs opacity-70">
                      <span>YTD Acts</span>
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Revenue Generated</h4>
                    <p className="text-3xl font-black text-foreground">
                      ${demoJournalEntries.filter(e => e.status === "Completed").reduce((a, b) => a + b.fee, 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase">ORC §147.08 Compliant</p>
                  </CardContent>
                </Card>
                <Card className="border-dashed cursor-pointer hover:border-primary transition-all group">
                  <CardContent className="p-6 flex items-center justify-center h-full">
                    <div className="text-center">
                      <Plus className="mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-xs font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">Record New Act</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Journal table */}
              <Card>
                <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3">
                  <h3 className="font-bold flex items-center gap-2">
                    <Notebook className="h-4 w-4 text-primary" /> Professional Journal
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Download className="h-3 w-3 mr-1" /> Export CSV
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Signer Name</th>
                        <th className="px-4 py-3">Act Type</th>
                        <th className="px-4 py-3">Document</th>
                        <th className="px-4 py-3">Fee</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {demoJournalEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{entry.date}</td>
                          <td className="px-4 py-3 text-xs font-bold text-foreground">{entry.signer}</td>
                          <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px] font-bold uppercase">{entry.type}</Badge></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{entry.docType}</td>
                          <td className="px-4 py-3 text-xs font-mono">${entry.fee.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={entry.status.includes("Refused") ? "destructive" : "default"} className="text-[10px]">
                              {entry.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* ═══════════════ TAB 5: SIM LAB ═══════════════ */}
            <TabsContent value="sim" className="space-y-6">
              {!showSimulator ? (
                <Card className="bg-primary text-primary-foreground overflow-hidden">
                  <CardContent className="py-16 px-8 text-center">
                    <Gavel className="h-12 w-12 mx-auto mb-4 opacity-80" />
                    <h2 className="text-3xl font-black mb-3">Statutory Sim Lab</h2>
                    <p className="opacity-70 mb-8 max-w-lg mx-auto">
                      Train on real-world pitfalls, illegal requests, and document fraud attempts. {simLevels.length} scenarios covering Ohio's highest-risk areas.
                    </p>
                    {simScore.total > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-bold opacity-80">Previous Score: {simScore.correct}/{simScore.total} ({Math.round((simScore.correct / simScore.total) * 100)}%)</p>
                      </div>
                    )}
                    <Button
                      onClick={() => { setShowSimulator(true); setSimLevel(0); setSimFeedback(null); setSimScore({ correct: 0, total: 0 }); }}
                      size="lg"
                      variant="secondary"
                      className="font-bold uppercase tracking-wider"
                    >
                      Start Simulator
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <CardContent className="p-6 md:p-10">
                    {/* Progress */}
                    <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
                      <span>Scenario {simLevel + 1} of {simLevels.length}</span>
                      <span>Score: {simScore.correct}/{simScore.total}</span>
                    </div>
                    <Progress value={((simLevel + 1) / simLevels.length) * 100} className="mb-6 h-2" />

                    <h3 className="text-2xl font-black mb-2 text-foreground">{simLevels[simLevel].title}</h3>

                    {/* Document display */}
                    <div className="aspect-video bg-primary rounded-2xl mb-8 flex items-center justify-center">
                      <div className="text-center text-primary-foreground">
                        <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-80" />
                        <p className="font-bold uppercase tracking-wider text-sm">{simLevels[simLevel].document}</p>
                        <p className="text-xs opacity-60 mt-2 max-w-xs mx-auto">
                          <AlertTriangle className="inline h-3 w-3 mr-1" />
                          {simLevels[simLevel].error}
                        </p>
                      </div>
                    </div>

                    {simFeedback ? (
                      <div className={`p-6 rounded-2xl mb-4 border-2 ${
                        simFeedback.type === "success"
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                          : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {simFeedback.type === "success" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                          <p className="font-black uppercase">{simFeedback.type === "success" ? "Correct!" : "Incorrect"}</p>
                        </div>
                        <p className="text-sm font-medium">{simFeedback.msg}</p>
                        <Button onClick={nextSimLevel} className="mt-4 w-full" variant={simFeedback.type === "success" ? "default" : "destructive"}>
                          {simLevel < simLevels.length - 1 ? "Next Scenario" : "Restart Simulator"}
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {simLevels[simLevel].options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSimChoice(i)}
                            className="p-5 rounded-2xl border-2 border-border bg-card hover:border-primary transition-all font-semibold text-foreground text-sm text-left"
                          >
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold mr-2">{String.fromCharCode(65 + i)}</span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════ TAB 6: REFERENCE & LAW ═══════════════ */}
            <TabsContent value="reference" className="space-y-8">
              {/* Compliance Reminders */}
              <section>
                <h2 className="font-sans text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Compliance Checklist
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {complianceReminders.map((section) => (
                    <Card key={section.title} className="border-border/50">
                      <CardContent className="p-5">
                        <h3 className="mb-3 font-sans text-sm font-bold">{section.title}</h3>
                        <ul className="space-y-1.5">
                          {section.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs"><CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" /><span>{item}</span></li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* New Notary Guide */}
              <section>
                <h2 className="font-sans text-lg font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> New Notary — Getting Started
                </h2>
                <div className="space-y-3">
                  {newNotaryGuide.map((item) => (
                    <Card key={item.step} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">{item.step}</div>
                          <div>
                            <h3 className="font-sans text-sm font-bold mb-0.5">{item.title}</h3>
                            <p className="text-xs text-muted-foreground">{item.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Common Mistakes */}
              <section>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-sans text-sm font-bold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" /> Common Mistakes to Avoid
                    </h3>
                    <ul className="space-y-1.5 text-xs">
                      {[
                        "Notarizing a document without the signer physically present",
                        "Accepting an expired ID as valid identification",
                        "Notarizing for a family member or document you have interest in",
                        "Forgetting to administer the oath for jurat certificates",
                        "Not recording every notarial act in your journal",
                        "Using an acknowledgment certificate when a jurat is required (or vice versa)",
                        "Giving legal advice about which document to use",
                        "Notarizing a pre-signed document without the signer re-signing in your presence",
                        "Charging more than Ohio's statutory fee limit",
                        "Not keeping your seal secure — you are liable if someone else uses it",
                      ].map((mistake, i) => (
                        <li key={i} className="flex items-start gap-2"><XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" /><span>{mistake}</span></li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              {/* External Resources */}
              <section>
                <h2 className="font-sans text-lg font-semibold mb-4 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" /> External Resources & Ohio Law
                </h2>
                {externalResources.map((section) => (
                  <div key={section.category} className="mb-6">
                    <h3 className="text-sm font-bold mb-3">{section.category}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {section.links.map((link) => (
                        <Card key={link.title} className="border-border/50">
                          <CardContent className="p-3">
                            <p className="font-medium text-xs mb-0.5">{link.title}</p>
                            <p className="text-[10px] text-muted-foreground mb-2">{link.desc}</p>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="h-7 text-[10px]">
                                <ExternalLink className="h-3 w-3 mr-1" /> Open
                              </Button>
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </TabsContent>
          </Tabs>
        </div>

        {/* ═══════════════ SIDEBAR (DESKTOP) ═══════════════ */}
        <aside className="hidden lg:block w-72 space-y-5 shrink-0">
          {/* Notary Health Score */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5">
              <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold mb-5 opacity-80">Notary Health Score</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                    <span>Journal Compliance</span>
                    <span>92%</span>
                  </div>
                  <div className="h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-foreground w-[92%] rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                    <span>ID Verification Rate</span>
                    <span>100%</span>
                  </div>
                  <div className="h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-foreground w-full rounded-full" />
                  </div>
                </div>
                <div className="pt-3 border-t border-primary-foreground/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold opacity-80">CREDENTIALS ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold opacity-80">E&O INSURANCE CURRENT</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venue Scout */}
          <Card>
            <CardContent className="p-5">
              <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold mb-3 text-muted-foreground">Venue Scout</h4>
              <div className="bg-muted/50 p-3 rounded-xl flex items-center gap-3 mb-3 border border-border">
                <MapPin className="text-primary h-5 w-5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Current Venue</p>
                  <p className="text-xs font-bold text-foreground">Franklin County, OH</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Venue is where the act is performed, not where the document was drafted. Always confirm county matches your location.
              </p>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardContent className="p-5">
              <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold mb-3 text-muted-foreground">Quick Links</h4>
              <div className="space-y-2">
                {[
                  { label: "Fee Calculator", icon: Scale, tab: "" },
                  { label: "Certificates", icon: Stamp, tab: "" },
                  { label: "Journal Entry", icon: Notebook, tab: "journal" },
                  { label: "Ohio SOS", icon: Globe, tab: "" },
                ].map((link, i) => (
                  <button
                    key={i}
                    onClick={() => link.tab ? setActiveTab(link.tab) : null}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all text-left"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ═══════════════ FORM ANATOMY MODAL ═══════════════ */}
      <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          {selectedForm && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileSearch className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedForm.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1 uppercase font-mono tracking-tighter">{selectedForm.ref} Statutory Standard</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                {/* Certificate Preview */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="relative overflow-hidden border-2 min-h-[400px]">
                    <CardContent className="p-8 md:p-10 font-serif text-foreground">
                      {/* Hotspot indicators */}
                      <div className="absolute top-8 left-8 w-3 h-3 bg-primary rounded-full animate-ping opacity-50" />
                      <div className="absolute top-8 left-8 w-3 h-3 bg-primary rounded-full" />
                      <div className="absolute bottom-12 right-12 w-3 h-3 bg-primary rounded-full animate-ping opacity-50" />
                      <div className="absolute bottom-12 right-12 w-3 h-3 bg-primary rounded-full" />

                      <div className="space-y-6 text-base">
                        <div>
                          <div className="font-bold text-sm uppercase mb-1">State of Ohio</div>
                          <div className="font-bold text-sm uppercase border-b border-border inline-block pr-12 pb-1">County of _________________</div>
                        </div>

                        <div className="leading-relaxed mt-8 py-4 italic border-l-4 border-primary/20 pl-5 text-muted-foreground">
                          {selectedForm.certificateText}
                        </div>

                        <div className="pt-12 flex justify-between items-end">
                          <div className="text-center">
                            <div className="w-44 border-b-2 border-foreground mx-auto" />
                            <div className="text-[10px] font-bold uppercase mt-2 font-sans">Notary Signature</div>
                          </div>
                          <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center text-muted-foreground/20">
                            <Stamp className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Example Document Image */}
                  {formImageMap[selectedForm.name] && (
                    <Card className="overflow-hidden">
                      <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Example Document</span>
                        <Badge variant="outline" className="text-[9px] ml-auto">SAMPLE — NOT A LEGAL DOCUMENT</Badge>
                      </div>
                      <img
                        src={formImageMap[selectedForm.name]}
                        alt={`Example ${selectedForm.name}`}
                        className="w-full max-h-[300px] object-cover object-top"
                        loading="lazy"
                      />
                    </Card>
                  )}

                  {/* Process Guides */}
                  <Accordion type="single" collapsible className="space-y-2">
                    <AccordionItem value="mobile-process" className="rounded-lg border border-border/50 bg-card px-4">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          Mobile Notary Process
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pb-2">
                          {[
                            "Confirm appointment details and travel destination",
                            "Gather supplies: journal, seal, ink pad, ID scanner, blank certificates",
                            "Verify signer identity with acceptable government-issued photo ID",
                            "Review document for completeness — no blank fields",
                            "Administer oath (Jurat) or take acknowledgment as required",
                            "Signer signs in your presence — witness the actual signing",
                            "Complete the notarial certificate with correct venue (county)",
                            "Apply notary seal — clear, legible, not overlapping signatures",
                            "Record all details in notary journal (14 mandatory fields)",
                            "Collect payment — $5/act max + travel fee + any applicable surcharges"
                          ].map((step, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{i + 1}</div>
                              <p className="text-xs text-foreground">{step}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="ron-process" className="rounded-lg border border-border/50 bg-card px-4">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          Online (RON) Process via SignNow
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pb-2">
                          {[
                            "Log into SignNow RON platform — verify active Ohio RON commission",
                            "Send signing invitation to signer via SignNow",
                            "Signer completes KBA (Knowledge-Based Authentication) — 5 questions, must get 4/5 correct",
                            "Signer completes credential analysis (ID verification) via SignNow",
                            "Start live video session — confirm signer identity on camera",
                            "Begin session recording (mandatory per ORC §147.66)",
                            "Present each document — signer applies electronic signature",
                            "Administer oath verbally for Jurats over video",
                            "Apply electronic notary seal and signature",
                            "End recording — download and store for 10-year retention",
                            "Complete journal entry with RON-specific fields",
                            "Deliver notarized documents electronically via SignNow"
                          ].map((step, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{i + 1}</div>
                              <p className="text-xs text-foreground">{step}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Anatomy Panel */}
                <div className="lg:col-span-4 space-y-4">
                  <Card>
                    <CardContent className="p-5">
                      <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
                        <Info className="h-3.5 w-3.5 text-primary" /> Statutory Requirements
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(selectedForm.anatomy).map(([key, val], i) => (
                          <div key={i}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <div className="text-[10px] font-bold uppercase text-foreground">{key.replace(/_/g, " ")}</div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3">{val}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ohio Tip */}
                  {selectedForm.ohioTip && (
                    <Card className="bg-primary text-primary-foreground">
                      <CardContent className="p-5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-80">Ohio Tip</h4>
                        <p className="text-xs leading-relaxed opacity-90">{selectedForm.ohioTip}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => copyToClipboard(`STATE OF OHIO\nCOUNTY OF ___________\n\n${selectedForm.certificateText}\n\n_______________________________\nNotary Public, State of Ohio\nMy Commission Expires: ________`)}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy Text
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => window.print()}
                    >
                      <Printer className="h-3 w-3 mr-1" /> Print
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════ SPECIAL CIRCUMSTANCE MODAL ═══════════════ */}
      <Dialog open={!!selectedCircumstance} onOpenChange={() => setSelectedCircumstance(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedCircumstance && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCircumstance.title}</DialogTitle>
                <Badge variant="outline" className="w-fit mt-1">{selectedCircumstance.orc}</Badge>
              </DialogHeader>

              <div className="space-y-5 mt-4">
                {/* Statutory Rule */}
                <Card className="bg-muted/50">
                  <CardContent className="p-5">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Statutory Rule</h4>
                    <p className="text-sm text-foreground leading-relaxed italic">{selectedCircumstance.details}</p>
                  </CardContent>
                </Card>

                {/* Script */}
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="p-5">
                    <div className="text-[10px] font-bold uppercase mb-2 opacity-80">Recommended Script</div>
                    <p className="text-sm font-mono leading-relaxed">{selectedCircumstance.script}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3 text-[10px]"
                      onClick={() => copyToClipboard(selectedCircumstance.script)}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy Script
                    </Button>
                  </CardContent>
                </Card>

                {/* Steps */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Protocol Steps</h4>
                  {selectedCircumstance.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] shrink-0">{idx + 1}</div>
                      <span className="text-xs font-medium text-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MOBILE BOTTOM NAV ═══════════════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-2 flex justify-around sm:hidden z-40">
        {[
          { id: "vault", icon: BookOpen, label: "Vault" },
          { id: "special", icon: AlertTriangle, label: "Acts" },
          { id: "journal", icon: Notebook, label: "Journal" },
          { id: "sim", icon: Gavel, label: "Sim" },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              activeTab === btn.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <btn.icon className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
