import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, Printer } from "lucide-react";

interface Callout {
  id: number;
  label: string;
  description: string;
  x: number; // percentage from left
  y: number; // percentage from top
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
        img { max-width: 100%; margin-bottom: 20px; }
        @media print { body { padding: 0; } }
      </style></head><body>
        <h1>${title} — Document Anatomy</h1>
        <img src="${imageSrc}" alt="${title}" />
        <ul class="callout-list">
          ${callouts.map(c => `<li><span class="callout-num">${c.id}.</span><strong>${c.label}</strong> — ${c.description}</li>`).join("")}
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
            className="absolute w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer border-2 border-background"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
            onClick={() => setSelectedCallout(c)}
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
            className={`flex items-start gap-2 p-2 rounded text-sm cursor-pointer transition-colors ${selectedCallout?.id === c.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}
            onClick={() => setSelectedCallout(c)}
          >
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{c.id}</span>
            <div>
              <span className="font-medium">{c.label}</span>
              <p className="text-muted-foreground text-xs mt-0.5">{c.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img src={imageSrc} alt={title} className="w-full rounded" />
            {callouts.map(c => (
              <div
                key={c.id}
                className="absolute w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md border-2 border-background"
                style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
              >
                {c.id}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Predefined anatomy callouts for each Ohio document type */
export const DOCUMENT_ANATOMY: Record<string, { image: string; callouts: { id: number; label: string; description: string; x: number; y: number }[] }> = {
  acknowledgment: {
    image: "/images/documents/acknowledgment-certificate.jpg",
    callouts: [
      { id: 1, label: "Venue", description: "State and county where notarization occurs (State of Ohio, County of Franklin)", x: 50, y: 8 },
      { id: 2, label: "Certificate Title", description: "Identifies this as an Acknowledgment — signer acknowledges voluntary execution", x: 50, y: 15 },
      { id: 3, label: "Signer Name", description: "Full legal name of the person who appeared before the notary", x: 60, y: 30 },
      { id: 4, label: "Certificate Language", description: "Ohio statutory acknowledgment wording per ORC §147.55", x: 40, y: 50 },
      { id: 5, label: "Notary Signature", description: "Official signature of the commissioned Ohio notary public", x: 30, y: 85 },
      { id: 6, label: "Notary Seal", description: "Official Ohio notary seal impression — must include commission number and expiration", x: 80, y: 85 },
    ],
  },
  jurat: {
    image: "/images/documents/jurat-certificate.jpg",
    callouts: [
      { id: 1, label: "Venue", description: "State of Ohio, County of Franklin — where the oath was administered", x: 50, y: 8 },
      { id: 2, label: "Certificate Title", description: "Identifies this as a Jurat — signer swore/affirmed content truthfulness", x: 50, y: 18 },
      { id: 3, label: "Date of Act", description: "Specific date the signer appeared and swore the oath", x: 45, y: 35 },
      { id: 4, label: "Signer Name", description: "Per HB 315, the signer's name must appear within the jurat certificate", x: 40, y: 40 },
      { id: 5, label: "Notary Signature & Commission", description: "Notary's signature with commission number and expiration date", x: 30, y: 80 },
      { id: 6, label: "Official Seal", description: "Ohio notary seal — circular format with notary name, 'Notary Public', and 'State of Ohio'", x: 80, y: 85 },
    ],
  },
  copy_certification: {
    image: "/images/documents/copy-certification.jpg",
    callouts: [
      { id: 1, label: "Venue", description: "State and county where certification occurs", x: 50, y: 8 },
      { id: 2, label: "Certification Language", description: "Notary certifies the copy is true, exact, complete, and unaltered", x: 40, y: 35 },
      { id: 3, label: "Original Document Reference", description: "Title/description of the original document being copied", x: 50, y: 30 },
      { id: 4, label: "Notary Seal", description: "Official seal verifying the notary's authority to certify copies", x: 20, y: 85 },
      { id: 5, label: "Notary Signature", description: "Commission number and signature of the Ohio notary", x: 70, y: 85 },
    ],
  },
  poa: {
    image: "/images/documents/poa-acknowledgment.jpg",
    callouts: [
      { id: 1, label: "Document Title", description: "Power of Attorney designation with state venue", x: 50, y: 5 },
      { id: 2, label: "Granting Clause", description: "Identifies the principal and the powers being granted", x: 40, y: 25 },
      { id: 3, label: "Acknowledgment Section", description: "Notary certificate confirming the principal acknowledged voluntary execution", x: 40, y: 75 },
      { id: 4, label: "Signature Lines", description: "Lines for principal, notary, and optional witnesses", x: 60, y: 90 },
      { id: 5, label: "Notary Seal", description: "Official seal authenticating the notarization", x: 25, y: 92 },
    ],
  },
  corporate: {
    image: "/images/documents/corporate-acknowledgment.jpg",
    callouts: [
      { id: 1, label: "Venue", description: "State and county of notarization", x: 50, y: 8 },
      { id: 2, label: "Representative Capacity", description: "Identifies the signer's title and authority within the corporation", x: 40, y: 45 },
      { id: 3, label: "Corporation Name", description: "Legal entity name — must match articles of incorporation", x: 50, y: 55 },
      { id: 4, label: "Board Authority", description: "Statement that execution was authorized by the Board of Directors", x: 50, y: 65 },
      { id: 5, label: "Notary Seal & Signature", description: "Official seal and signature of the notary public", x: 50, y: 85 },
    ],
  },
  signature_by_mark: {
    image: "/images/documents/signature-by-mark.jpg",
    callouts: [
      { id: 1, label: "Title", description: "Identifies this as a Signature by Mark procedure", x: 50, y: 5 },
      { id: 2, label: "Mark (X)", description: "The signer's mark — used when the signer cannot write their signature", x: 55, y: 45 },
      { id: 3, label: "Witness Signatures", description: "Two witnesses are required to attest the mark was made voluntarily", x: 30, y: 55 },
      { id: 4, label: "Notary Certificate", description: "Notary certifies the mark was made in the presence of witnesses", x: 40, y: 80 },
      { id: 5, label: "Notary Seal", description: "Official Ohio notary seal", x: 80, y: 90 },
    ],
  },
  vehicle_title: {
    image: "/images/documents/vehicle-title-notarization.jpg",
    callouts: [
      { id: 1, label: "Ohio BMV Header", description: "Official Ohio BMV Certificate of Title format", x: 50, y: 5 },
      { id: 2, label: "Transfer/Assignment", description: "Section where seller transfers ownership to buyer", x: 50, y: 35 },
      { id: 3, label: "Odometer Disclosure", description: "Federal odometer statement — required per 49 USC §32705", x: 40, y: 50 },
      { id: 4, label: "Notary Acknowledgment", description: "Notary section at bottom — per HB 315, dealer transfers are exempt", x: 50, y: 85 },
      { id: 5, label: "Notary Seal", description: "Official notary seal verifying the transfer signatures", x: 20, y: 92 },
    ],
  },
  self_proving_affidavit: {
    image: "/images/documents/self-proving-affidavit.jpg",
    callouts: [
      { id: 1, label: "Venue", description: "State and county where the affidavit is executed", x: 20, y: 5 },
      { id: 2, label: "Affidavit Title", description: "Self-Proving Affidavit attached to a Last Will & Testament", x: 50, y: 10 },
      { id: 3, label: "Testator Signature", description: "The person making the will signs before the notary", x: 50, y: 55 },
      { id: 4, label: "Witness Signatures", description: "Two witnesses sign affirming they observed the testator's signature", x: 50, y: 70 },
      { id: 5, label: "Notary Certificate", description: "Notary administers oath to witnesses and seals the affidavit", x: 50, y: 88 },
    ],
  },
};
