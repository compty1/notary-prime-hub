import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, Printer } from "lucide-react";
import { useRef } from "react";

interface CertificateProps {
  signerName: string;
  documentType: string;
  notaryName: string;
  commissionState: string;
  commissionNumber?: string;
  commissionExpiry?: string;
  notarizedAt: string;
  sessionId?: string;
  county?: string;
  verificationUrl?: string;
}

export function NotarizationCertificate({
  signerName, documentType, notaryName, commissionState, commissionNumber,
  commissionExpiry, notarizedAt, sessionId, county = "Franklin", verificationUrl,
}: CertificateProps) {
  const dateStr = new Date(notarizedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = new Date(notarizedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const printRef = useRef<HTMLDivElement>(null);

  const printCertificate = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate of Notarization — ${signerName}</title>
        <style>
          @page { size: letter; margin: 1in; }
          body { font-family: Georgia, 'Times New Roman', serif; color: #1a2744; margin: 0; padding: 40px; }
          .cert-border { border: 3px double #1a2744; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .seal-img { width: 100px; height: 100px; object-fit: contain; margin: 0 auto 16px; display: block; }
          .title { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
          .subtitle { font-size: 14px; color: #666; margin: 6px 0 0; }
          .body { font-size: 14px; line-height: 1.8; margin: 24px 0; }
          .details { border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 16px 0; margin: 24px 0; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
          .detail-label { font-size: 12px; color: #888; }
          .detail-value { font-size: 13px; font-weight: 600; }
          .signature-block { margin-top: 40px; text-align: center; }
          .signature-line { width: 300px; border-top: 1px solid #333; margin: 40px auto 8px; }
          .compliance { font-size: 11px; color: #888; text-align: center; margin-top: 30px; }
          .verify { font-size: 11px; color: #4f46e5; text-align: center; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="header">
            <img src="/images/notary-seal.png" class="seal-img" alt="Notary Seal" />
            <p class="title">Certificate of Notarization</p>
            <p class="subtitle">State of ${commissionState} — County of ${county}</p>
          </div>
          <div class="body">
            <p>On this <strong>${dateStr}</strong>, before me, <strong>${notaryName}</strong>, a Notary Public in and for the State of ${commissionState}, personally appeared <strong>${signerName}</strong>, known to me (or proved to me on the basis of satisfactory evidence) to be the person whose name is subscribed to the within instrument, and acknowledged to me that they executed the same in their authorized capacity, and that by their signature on the instrument, the person, or the entity upon behalf of which the person acted, executed the instrument.</p>
          </div>
          <div class="details">
            <div class="details-grid">
              <div><span class="detail-label">Document Type:</span><br><span class="detail-value">${documentType}</span></div>
              <div><span class="detail-label">Date & Time:</span><br><span class="detail-value">${dateStr} at ${timeStr}</span></div>
              ${commissionNumber ? `<div><span class="detail-label">Commission #:</span><br><span class="detail-value">${commissionNumber}</span></div>` : ""}
              ${sessionId ? `<div><span class="detail-label">Session ID:</span><br><span class="detail-value">${sessionId}</span></div>` : ""}
            </div>
          </div>
          <div class="signature-block">
            <p style="font-size:12px;color:#888;">WITNESS my hand and official seal.</p>
            <div class="signature-line"></div>
            <p style="font-weight:bold;">${notaryName}</p>
            <p style="font-size:12px;">Notary Public, State of ${commissionState}</p>
            ${commissionNumber ? `<p style="font-size:11px;color:#666;">Commission #: ${commissionNumber}</p>` : ""}
            ${commissionExpiry ? `<p style="font-size:11px;color:#666;">Commission Expires: ${commissionExpiry}</p>` : ""}
          </div>
          <p class="compliance">This notarization was performed via communication technology in compliance with Ohio Revised Code §147.63 and §147.542.</p>
          <p class="compliance" style="margin-top:4px;">The signer appeared remotely via audio-video communication technology. Identity was verified through credential analysis and knowledge-based authentication (KBA) per ORC §147.66.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const downloadCertificate = () => {
    const content = `
CERTIFICATE OF NOTARIZATION
State of ${commissionState} — County of ${county}

On this ${dateStr}, before me, ${notaryName}, a Notary Public in and for the State of ${commissionState}, personally appeared ${signerName}, known to me (or proved to me on the basis of satisfactory evidence) to be the person whose name is subscribed to the within instrument, and acknowledged to me that they executed the same in their authorized capacity, and that by their signature on the instrument, the person, or the entity upon behalf of which the person acted, executed the instrument.

Document Type: ${documentType}
Date & Time: ${dateStr} at ${timeStr}
${sessionId ? `Session ID: ${sessionId}` : ""}

WITNESS my hand and official seal.

_______________________________
${notaryName}
Notary Public, State of ${commissionState}
${commissionNumber ? `Commission #: ${commissionNumber}` : ""}
${commissionExpiry ? `Commission Expires: ${commissionExpiry}` : ""}

This notarization was performed via communication technology in compliance with Ohio Revised Code §147.63 and §147.542.
The signer appeared remotely via audio-video communication technology. Identity was verified through credential analysis and knowledge-based authentication (KBA) per ORC §147.66.
${verificationUrl ? `Verify: ${verificationUrl}` : ""}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notarization-certificate-${signerName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-2 border-primary/20 bg-card" ref={printRef}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="/images/notary-seal.png" alt="Notary Seal" className="h-10 w-10 rounded-full object-contain" />
            <div>
              <h3 className="font-sans text-lg font-bold">Certificate of Notarization</h3>
              <p className="text-xs text-muted-foreground">State of {commissionState} — County of {county}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">ORC §147.542</Badge>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-muted-foreground">Signer:</span> <span className="font-medium">{signerName}</span></div>
            <div><span className="text-muted-foreground">Document:</span> <span className="font-medium">{documentType}</span></div>
            <div><span className="text-muted-foreground">Notary:</span> <span className="font-medium">{notaryName}</span></div>
            <div><span className="text-muted-foreground">State:</span> <span className="font-medium">{commissionState}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{dateStr}</span></div>
            <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{timeStr}</span></div>
            {commissionNumber && <div><span className="text-muted-foreground">Commission #:</span> <span className="font-mono text-xs">{commissionNumber}</span></div>}
            {sessionId && <div><span className="text-muted-foreground">Session ID:</span> <span className="font-mono text-xs">{sessionId}</span></div>}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Ohio Revised Code §147.63 & §147.542 compliant • RON via communication technology</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={printCertificate}>
              <Printer className="mr-1 h-3 w-3" /> Print PDF
            </Button>
            <Button size="sm" variant="outline" onClick={downloadCertificate}>
              <Download className="mr-1 h-3 w-3" /> Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
