import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, Printer, ExternalLink } from "lucide-react";

interface Callout {
  id: number;
  label: string;
  description: string;
  x: number;
  y: number;
  orc?: string;
  link?: string;
}

interface AnatomyDiagramProps {
  imageSrc: string;
  title: string;
  callouts: Callout[];
}

export function AnatomyDiagram({ imageSrc, title, callouts }: AnatomyDiagramProps) {
  const [selectedCallout, setSelectedCallout] = useState<Callout | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${title} — Anatomy</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 16px; }
        .callout-list { list-style: none; padding: 0; }
        .callout-list li { margin: 8px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .callout-num { font-weight: bold; color: #1a56db; margin-right: 8px; }
        .orc { font-size: 10px; color: #666; margin-left: 4px; }
        img { max-width: 100%; margin-bottom: 20px; }
        @media print { body { padding: 0; } }
      </style></head><body>
        <h1>${title} — Document Anatomy</h1>
        <img src="${imageSrc}" alt="${title}" />
        <ul class="callout-list">
          ${callouts.map(c => `<li><span class="callout-num">${c.id}.</span><strong>${c.label}</strong>${c.orc ? ` <span class="orc">(${c.orc})</span>` : ""} — ${c.description}</li>`).join("")}
        </ul>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{title} — Anatomy</h4>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setLightboxOpen(true)}>
            <ZoomIn className="h-3.5 w-3.5 mr-1" /> Enlarge
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Image with callout markers */}
      <div className="relative inline-block w-full max-w-md rounded-lg border border-border overflow-hidden" role="img" aria-label={`Annotated diagram of ${title} with ${callouts.length} callouts`}>
        <img src={imageSrc} alt={`${title} document anatomy diagram`} className="w-full" loading="lazy" />
        {callouts.map(c => (
          <button
            key={c.id}
            className={`absolute w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer border-2 border-background ${
              selectedCallout?.id === c.id ? "bg-destructive text-destructive-foreground scale-110" : "bg-primary text-primary-foreground"
            }`}
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
            onClick={() => setSelectedCallout(selectedCallout?.id === c.id ? null : c)}
            aria-label={`Callout ${c.id}: ${c.label}`}
          >
            {c.id}
          </button>
        ))}
      </div>

      {/* Callout legend */}
      <div className="grid gap-2">
        {callouts.map(c => (
          <div
            key={c.id}
            className={`flex items-start gap-2 p-2.5 rounded-lg text-sm cursor-pointer transition-all ${
              selectedCallout?.id === c.id
                ? "bg-primary/10 border border-primary/30 shadow-sm"
                : "hover:bg-muted/50 border border-transparent"
            }`}
            onClick={() => setSelectedCallout(selectedCallout?.id === c.id ? null : c)}
          >
            <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
              selectedCallout?.id === c.id ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
            }`}>{c.id}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{c.label}</span>
                {c.orc && <Badge variant="outline" className="text-[9px] font-mono">{c.orc}</Badge>}
                {c.link && (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{c.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title} — Full Document Anatomy</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img src={imageSrc} alt={title} className="w-full rounded" />
            {callouts.map(c => (
              <button
                key={c.id}
                className={`absolute w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shadow-lg border-2 border-background cursor-pointer hover:scale-110 transition-transform ${
                  selectedCallout?.id === c.id ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                }`}
                style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
                onClick={() => setSelectedCallout(selectedCallout?.id === c.id ? null : c)}
              >
                {c.id}
              </button>
            ))}
          </div>
          {/* Full legend in lightbox */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {callouts.map(c => (
              <div key={c.id} className={`flex items-start gap-2 p-3 rounded-lg border transition-all ${
                selectedCallout?.id === c.id ? "border-primary bg-primary/5" : "border-border"
              }`}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{c.id}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{c.label}</span>
                    {c.orc && <Badge variant="outline" className="text-[9px]">{c.orc}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Predefined anatomy callouts for each Ohio document type — COMPLETE with ORC references */
export const DOCUMENT_ANATOMY: Record<string, { image: string; callouts: { id: number; label: string; description: string; x: number; y: number; orc?: string; link?: string }[] }> = {
  acknowledgment: {
    image: new URL("@/assets/documents/acknowledgment-certificate.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Venue (State & County)", description: "Identifies WHERE the notarial act physically took place — must match your actual location at the time of the act, not where the document was drafted or the signer lives.", x: 50, y: 8, orc: "ORC §147.07", link: "https://codes.ohio.gov/ohio-revised-code/section-147.07" },
      { id: 2, label: "Certificate Title", description: "Identifies this as an ACKNOWLEDGMENT — signer acknowledges they signed voluntarily and of their own free will. This is NOT an oath. The signer does not swear to the truthfulness of the contents.", x: 50, y: 18, orc: "ORC §147.55" },
      { id: 3, label: "Signer Name", description: "Full legal name of the person who personally appeared before the notary. Must match the name on their government-issued photo ID. Middle names/initials should be consistent.", x: 60, y: 35 },
      { id: 4, label: "Acknowledgment Language", description: "Ohio statutory wording: 'The foregoing instrument was acknowledged before me this ___ day of ______.' This confirms the signer appeared before you and declared the signature is theirs.", x: 40, y: 50, orc: "ORC §147.55", link: "https://codes.ohio.gov/ohio-revised-code/section-147.55" },
      { id: 5, label: "Date of Notarial Act", description: "The exact date the signer appeared before you. Must match the actual date of the act — backdating or forward-dating is illegal and grounds for commission revocation.", x: 35, y: 60, orc: "ORC §147.141" },
      { id: 6, label: "Notary Signature", description: "Your official signature as commissioned by the Ohio Secretary of State. Must be your actual handwritten signature (or electronic signature for RON), not a stamp or printed name.", x: 30, y: 85, orc: "ORC §147.04" },
      { id: 7, label: "Notary Seal/Stamp", description: "Official Ohio notary seal — circular format containing: your name, 'Notary Public', 'State of Ohio', commission number, and commission expiration date. Must be clear, legible, and NOT overlap signatures or text.", x: 78, y: 85, orc: "ORC §147.04", link: "https://codes.ohio.gov/ohio-revised-code/section-147.04" },
    ],
  },
  jurat: {
    image: new URL("@/assets/documents/jurat-certificate.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Venue (State & County)", description: "State of Ohio, County of _____ — where the oath was physically administered. For RON sessions, use the notary's location county per ORC §147.66.", x: 50, y: 8, orc: "ORC §147.07" },
      { id: 2, label: "Jurat Certificate Title", description: "Identifies this as a JURAT — the signer SWORE or AFFIRMED the truthfulness of the document contents under oath. Critical distinction: a Jurat requires an oath; an Acknowledgment does not.", x: 50, y: 18, orc: "ORC §147.55" },
      { id: 3, label: "Oath Administration", description: "The 'Sworn to and subscribed' language proves you VERBALLY administered an oath: 'Do you solemnly swear that the statements in this document are true?' The signer MUST respond affirmatively.", x: 45, y: 30, orc: "ORC §147.14", link: "https://codes.ohio.gov/ohio-revised-code/section-147.14" },
      { id: 4, label: "Date of Act", description: "Specific date the signer appeared and swore the oath before you. This date cannot differ from when the oath was actually administered.", x: 40, y: 40 },
      { id: 5, label: "Signer Name", description: "Per HB 315, the signer's full legal name must appear within the jurat certificate. Must match their government-issued photo ID.", x: 55, y: 45 },
      { id: 6, label: "Notary Signature & Commission", description: "Notary's handwritten signature with printed name, commission number, and expiration date below. Your commission must be active on the date of the act.", x: 30, y: 80, orc: "ORC §147.04" },
      { id: 7, label: "Official Seal", description: "Ohio notary seal — circular format with notary name, 'Notary Public', 'State of Ohio', commission number, and expiration. Blue or black ink. Must not overlap text.", x: 78, y: 85, orc: "ORC §147.04" },
    ],
  },
  copy_certification: {
    image: new URL("@/assets/documents/copy-certification.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Venue", description: "State and county where the copy certification is being performed. Must match your physical location.", x: 50, y: 8, orc: "ORC §147.07" },
      { id: 2, label: "Certification Language", description: "Notary certifies the copy is 'true, exact, complete, and unaltered.' YOU must make the copy or supervise its making — you cannot certify a copy someone else made without your observation.", x: 40, y: 35, orc: "ORC §147.51", link: "https://codes.ohio.gov/ohio-revised-code/section-147.51" },
      { id: 3, label: "Original Document Reference", description: "Title/description of the original document being copied. Be specific: 'U.S. Passport of John A. Smith, No. 12345678' rather than just 'passport'.", x: 50, y: 28 },
      { id: 4, label: "Custodian Identity", description: "The name of the person who presented the original document to you for copying. They must present the original in person.", x: 45, y: 50 },
      { id: 5, label: "Vital Records Prohibition", description: "CRITICAL: Ohio notaries CANNOT certify copies of vital records (birth certificates, death certificates, marriage certificates). Direct clients to the appropriate government office.", x: 50, y: 65, orc: "ORC §147.51" },
      { id: 6, label: "Notary Seal & Signature", description: "Official seal and signature verifying the notary's authority to certify copies.", x: 40, y: 85, orc: "ORC §147.04" },
    ],
  },
  poa: {
    image: new URL("@/assets/documents/poa-acknowledgment.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Document Title & Venue", description: "Power of Attorney designation with State of Ohio venue. Identifies the type of POA: General, Limited, Durable, or Healthcare.", x: 50, y: 5 },
      { id: 2, label: "Granting Clause", description: "Identifies the PRINCIPAL (person granting power) and the AGENT/attorney-in-fact (person receiving power). Lists specific powers being granted.", x: 40, y: 25 },
      { id: 3, label: "Durability Clause", description: "If present, states the POA survives the principal's incapacity. Without this clause, the POA becomes void if the principal becomes incapacitated.", x: 45, y: 40 },
      { id: 4, label: "Principal's Signature", description: "The principal MUST sign in your presence. You are verifying the PRINCIPAL's identity and willingness, not the agent's. Assess mental capacity before proceeding.", x: 50, y: 60, orc: "ORC §1337.12", link: "https://codes.ohio.gov/ohio-revised-code/section-1337.12" },
      { id: 5, label: "Acknowledgment Section", description: "Notary certificate confirming the principal acknowledged voluntary execution. Use ACKNOWLEDGMENT (not Jurat) unless the document specifically requires an oath.", x: 40, y: 75, orc: "ORC §147.55" },
      { id: 6, label: "Witness Signatures", description: "Healthcare POAs in Ohio require TWO witnesses per ORC §1337.12. Witnesses cannot be the attending physician, nursing home admin, or the named agent.", x: 60, y: 85 },
      { id: 7, label: "Notary Seal", description: "Official seal authenticating the notarization. Verifies the notary's authority and commission status.", x: 25, y: 92, orc: "ORC §147.04" },
    ],
  },
  corporate: {
    image: new URL("@/assets/documents/corporate-acknowledgment.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Venue", description: "State and county of notarization — where the corporate officer physically appeared before you.", x: 50, y: 8, orc: "ORC §147.07" },
      { id: 2, label: "Officer Name & Personal ID", description: "You verify the PERSON's identity, not the corporation's. The signer must present their personal government-issued photo ID.", x: 40, y: 30 },
      { id: 3, label: "Representative Capacity", description: "Identifies the signer's TITLE and AUTHORITY within the corporation (e.g., 'Managing Member', 'President', 'CEO'). This must be stated in the certificate.", x: 40, y: 45, orc: "ORC §147.55" },
      { id: 4, label: "Corporation/Entity Name", description: "Legal entity name — must match articles of incorporation or operating agreement. Use the EXACT legal name including 'LLC', 'Inc.', 'Corp.', etc.", x: 50, y: 55 },
      { id: 5, label: "'On Behalf Of' Language", description: "The certificate must state the signer is acting 'on behalf of the entity.' Without this language, the notarization may only bind the individual, not the corporation.", x: 50, y: 65 },
      { id: 6, label: "Authority Verification", description: "Best practice: request proof of authority (corporate resolution, operating agreement, or articles of incorporation showing the signer is authorized to bind the entity).", x: 50, y: 75 },
      { id: 7, label: "Notary Seal & Signature", description: "Official seal and signature of the notary public verifying the corporate officer's identity and voluntary execution.", x: 50, y: 88, orc: "ORC §147.04" },
    ],
  },
  signature_by_mark: {
    image: new URL("@/assets/documents/signature-by-mark.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Certificate Title", description: "Identifies this as a Signature by Mark procedure — used when the signer cannot write their full signature due to illiteracy, physical disability, or other limitation.", x: 50, y: 5, orc: "ORC §147.542", link: "https://codes.ohio.gov/ohio-revised-code/section-147.542" },
      { id: 2, label: "The Mark (X)", description: "The signer's 'X' or other mark — placed where a signature would normally go. This mark IS the signer's legal signature for the purposes of this document.", x: 55, y: 30 },
      { id: 3, label: "Signer's Name (Written by Witness)", description: "One of the two witnesses writes the signer's full legal name NEXT TO the mark. This identifies whose mark it is.", x: 45, y: 42 },
      { id: 4, label: "Witness 1 Signature", description: "First disinterested witness who OBSERVED the mark being made. Must be a competent adult with no interest in the document.", x: 30, y: 55 },
      { id: 5, label: "Witness 2 Signature", description: "Second disinterested witness who also observed the mark. Both witnesses MUST be present simultaneously when the mark is made.", x: 60, y: 55 },
      { id: 6, label: "Notary Certificate with Mark Note", description: "Notary certifies the mark was made in the presence of two witnesses. Certificate MUST include: 'Signature by Mark' notation and names of both witnesses.", x: 40, y: 78, orc: "ORC §147.542" },
      { id: 7, label: "Notary Seal", description: "Official Ohio notary seal verifying the notarization. Same requirements as any other notarial act.", x: 78, y: 90, orc: "ORC §147.04" },
    ],
  },
  vehicle_title: {
    image: new URL("@/assets/documents/vehicle-title-notarization.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Ohio BMV Header", description: "Official Ohio Bureau of Motor Vehicles Certificate of Title format. This is a controlled government form — any alterations, white-out, or damage may render it VOID.", x: 50, y: 5 },
      { id: 2, label: "Buyer Information", description: "MUST be completely filled in BEFORE notarization. An 'Open Title' (blank buyer name/address) is a FELONY under ORC §4505.06. Never notarize with blank buyer fields.", x: 50, y: 25, orc: "ORC §4505.06", link: "https://codes.ohio.gov/ohio-revised-code/section-4505.06" },
      { id: 3, label: "Odometer Disclosure", description: "Federal odometer statement required per 49 USC §32705. The seller SWEARS the odometer reading is accurate. Any alteration to this field voids the title.", x: 40, y: 45 },
      { id: 4, label: "Purchase Price", description: "Must match the actual transaction value. This field is used for tax calculations by the county clerk. Misrepresenting the price is fraud.", x: 60, y: 55 },
      { id: 5, label: "Seller Signature Under Oath", description: "The seller SWEARS (Jurat, not Acknowledgment) that all information is true and correct. You MUST administer the oath verbally before the seller signs.", x: 50, y: 70, orc: "ORC §147.14" },
      { id: 6, label: "HB 315 Dealer Exemption", description: "Under HB 315 (2025), notarization is NOT required when a licensed motor vehicle dealer is involved. Ask: 'Is a dealer involved in this transfer?' before proceeding.", x: 50, y: 78, link: "https://www.legislature.ohio.gov/legislation/135/hb315" },
      { id: 7, label: "Notary Seal & Signature", description: "Official notary seal verifying the transfer signatures. Stamp directly on the title form in the designated notary area. This is a JURAT — you administered an oath.", x: 25, y: 92, orc: "ORC §147.04" },
    ],
  },
  self_proving_affidavit: {
    image: new URL("@/assets/documents/self-proving-affidavit.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Venue", description: "State and county where the affidavit is executed. All parties (testator, witnesses, notary) must be physically present at this location.", x: 20, y: 5, orc: "ORC §147.07" },
      { id: 2, label: "Affidavit Title", description: "Self-Proving Affidavit attached to a Last Will & Testament. This affidavit allows the will to be admitted to probate without requiring witness testimony in court.", x: 50, y: 10, orc: "ORC §2107.24", link: "https://codes.ohio.gov/ohio-revised-code/section-2107.24" },
      { id: 3, label: "Testator's Sworn Statement", description: "The testator swears: (1) this is their will, (2) they signed it willingly, (3) they are of sound mind, and (4) they are not under duress or undue influence.", x: 50, y: 30 },
      { id: 4, label: "Testator Signature", description: "The person making the will signs before the notary AND both witnesses. All must be present simultaneously — no separate signing sessions.", x: 50, y: 50 },
      { id: 5, label: "Witness Sworn Statements", description: "Both witnesses swear: (1) the testator told them this is their will, (2) the testator signed in their presence, (3) the testator appeared to be of sound mind.", x: 50, y: 60, orc: "ORC §2107.03" },
      { id: 6, label: "Witness Signatures", description: "TWO disinterested witnesses sign the affidavit. Witnesses CANNOT be beneficiaries of the will. The notary should also NOT be a beneficiary.", x: 50, y: 70 },
      { id: 7, label: "Notary Certificate & Seal", description: "Notary administers the oath to BOTH the testator AND the witnesses, then completes the jurat and applies seal. You notarize the AFFIDAVIT, not the will itself.", x: 50, y: 88, orc: "ORC §147.04" },
    ],
  },
  oath_affirmation: {
    image: new URL("@/assets/documents/oath-affirmation-certificate.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Verbal Act", description: "An oral oath/affirmation is a verbal notarial act — no document is signed. The notary witnesses the person making a solemn promise under penalty of perjury.", x: 50, y: 15, orc: "ORC §147.14", link: "https://codes.ohio.gov/ohio-revised-code/section-147.14" },
      { id: 2, label: "Identity Verification", description: "Even for verbal oaths, you MUST verify the person's identity with acceptable government-issued photo ID.", x: 50, y: 30, orc: "ORC §147.542" },
      { id: 3, label: "Oath Script", description: "Speak the oath clearly: 'Do you solemnly swear (or affirm) that [the statement] is true and correct to the best of your knowledge?' Wait for affirmative response.", x: 50, y: 50 },
      { id: 4, label: "Journal Entry", description: "Record the oral oath in your journal with: date, time, person's name, ID details, subject matter of the oath, and that the person responded affirmatively.", x: 50, y: 75, orc: "ORC §147.542" },
    ],
  },
  certificate_correction: {
    image: new URL("@/assets/documents/acknowledgment-certificate.jpg", import.meta.url).href,
    callouts: [
      { id: 1, label: "Original Certificate", description: "The original certificate that contains the error. NEVER tear up or replace a defective certificate — corrections must be made on the original.", x: 50, y: 20, orc: "ORC §147.54", link: "https://codes.ohio.gov/ohio-revised-code/section-147.54" },
      { id: 2, label: "Error Identification", description: "Draw a single line through the error so the original text remains readable. Never use white-out, correction tape, or scratch out text beyond legibility.", x: 50, y: 40 },
      { id: 3, label: "Correction & Initials", description: "Write the correct information nearby, then initial and date the correction. Both the notary and signer should initial corrections.", x: 50, y: 55 },
      { id: 4, label: "Correction Statement", description: "Add a marginal note: 'Corrected on [date] by [Notary Name], Notary Public, to change [description of error].' This creates an audit trail.", x: 50, y: 70 },
      { id: 5, label: "Journal Update", description: "Record the correction in your journal as a separate entry referencing the original journal entry number and date.", x: 50, y: 85 },
    ],
  },
};
