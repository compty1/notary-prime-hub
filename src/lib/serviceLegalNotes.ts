/**
 * SVC-168: Per-service legal notes
 * Returns service-specific legal disclaimers linked from booking.
 */

export interface ServiceLegalNote {
  serviceType: string;
  notes: string[];
  orcReferences?: string[];
}

const LEGAL_NOTES: ServiceLegalNote[] = [
  {
    serviceType: "notarization",
    notes: [
      "This service involves a notarial act performed by a commissioned Ohio notary public.",
      "Notary fees are capped at $5.00 per notarial act per Ohio ORC §147.08.",
      "You must present valid government-issued photo identification.",
      "The notary cannot provide legal advice or draft legal documents.",
    ],
    orcReferences: ["ORC §147.08", "ORC §147.53"],
  },
  {
    serviceType: "ron",
    notes: [
      "Remote Online Notarization (RON) sessions are recorded per Ohio ORC §147.63.",
      "By proceeding, you consent to audio-video recording of the entire session.",
      "Recordings are retained for a minimum of 10 years per ORC §147.141.",
      "You must complete Knowledge-Based Authentication (KBA) with a maximum of 2 attempts.",
      "The notary must be physically present in Ohio during the session.",
    ],
    orcReferences: ["ORC §147.63", "ORC §147.66", "ORC §147.141"],
  },
  {
    serviceType: "court_forms",
    notes: [
      "This service provides document preparation only — NOT legal advice.",
      "We are not attorneys and cannot represent you in court.",
      "You are responsible for reviewing all documents before filing.",
      "Court filing fees are separate from document preparation fees.",
      "Unauthorized practice of law (UPL) disclaimers apply per ORC §4705.07.",
    ],
    orcReferences: ["ORC §4705.07"],
  },
  {
    serviceType: "estate_planning",
    notes: [
      "Estate planning documents are prepared based on information you provide.",
      "We strongly recommend review by a licensed attorney before execution.",
      "Healthcare directives must comply with ORC §1337.12.",
      "Witnesses may be required depending on document type.",
    ],
    orcReferences: ["ORC §1337.12", "ORC §2107.03"],
  },
  {
    serviceType: "apostille",
    notes: [
      "Apostilles are issued by the Ohio Secretary of State's office.",
      "We facilitate the process but do not issue apostilles directly.",
      "Processing times vary and are subject to the Secretary of State's schedule.",
      "Documents must be originally notarized by an Ohio notary public.",
    ],
  },
  {
    serviceType: "i9_verification",
    notes: [
      "I-9 verification is performed as an authorized representative.",
      "We do not make employment eligibility determinations.",
      "All I-9 forms and supporting documents are handled per USCIS guidelines.",
      "Employer retains final responsibility for I-9 compliance.",
    ],
  },
  {
    serviceType: "loan_signing",
    notes: [
      "Loan signing agents do not provide legal or financial advice.",
      "All loan documents are prepared by the lender or title company.",
      "Review all documents carefully before signing.",
      "Contact your lender with any questions about loan terms.",
    ],
  },
];

/** Get legal notes for a service type */
export function getServiceLegalNotes(serviceType: string): ServiceLegalNote | undefined {
  const lower = serviceType.toLowerCase();
  return LEGAL_NOTES.find(n => lower.includes(n.serviceType.toLowerCase()));
}

/** Get all legal notes */
export function getAllServiceLegalNotes(): ServiceLegalNote[] {
  return LEGAL_NOTES;
}
