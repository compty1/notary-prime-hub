import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield } from "lucide-react";

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
}

export function NotarizationCertificate({
  signerName, documentType, notaryName, commissionState, commissionNumber,
  commissionExpiry, notarizedAt, sessionId, county = "Franklin",
}: CertificateProps) {
  const dateStr = new Date(notarizedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = new Date(notarizedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });

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

This notarization was performed in compliance with Ohio Revised Code §147.542.
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
    <Card className="border-2 border-primary/20 bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-sans text-lg font-bold">Certificate of Notarization</h3>
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
          <p className="text-xs text-muted-foreground">Ohio Revised Code §147.542 compliant</p>
          <Button size="sm" variant="outline" onClick={downloadCertificate}>
            <Download className="mr-1 h-3 w-3" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
