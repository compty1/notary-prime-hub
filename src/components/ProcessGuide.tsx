import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Printer, Download, MapPin, Laptop, CheckCircle } from "lucide-react";

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  tips?: string[];
}

const MOBILE_STEPS: ProcessStep[] = [
  { step: 1, title: "Pre-Appointment Preparation", description: "Confirm appointment details, verify document type eligibility, gather supplies (journal, seal, stamps, blank certificates).", tips: ["Check Ohio SOS prohibited document list", "Verify client ID requirements in advance", "Charge device and test mobile hotspot"] },
  { step: 2, title: "Travel & Venue Setup", description: "Navigate to client location, confirm address. Set up a clean, well-lit workspace with privacy.", tips: ["Mileage starts from your base address", "Note parking and venue details in journal", "Request a quiet room for signing"] },
  { step: 3, title: "ID Verification", description: "Examine government-issued photo ID. Verify identity matches document signer. Check expiration date.", tips: ["Acceptable: Driver's license, passport, state ID", "ID must not be expired", "Record ID details in notary journal"] },
  { step: 4, title: "Document Review", description: "Review document for completeness. Ensure all blanks are filled before notarization. Do NOT advise on content (UPL).", tips: ["Check for blank spaces — do not notarize incomplete documents", "Verify document type matches requested notarial act", "Never explain legal meaning of documents"] },
  { step: 5, title: "Signing Ceremony", description: "Administer oath (jurat) or confirm acknowledgment. Witness the signing. Signer must sign in your presence.", tips: ["For jurats: 'Do you solemnly swear/affirm...'", "For acknowledgments: 'Do you acknowledge signing voluntarily?'", "Signer must be willing and aware"] },
  { step: 6, title: "Journal Entry", description: "Complete notary journal entry with all 14 required data points per ORC §147.141.", tips: ["Date, time, type of act, document title", "Signer name, address, ID type & number", "Signature of signer in journal", "Fee charged"] },
  { step: 7, title: "Seal Application", description: "Apply your official Ohio notary seal impression. Must be clear and legible.", tips: ["Seal must show: your name, 'Notary Public', 'State of Ohio'", "Commission number and expiration date", "Do not obscure text with the seal impression"] },
  { step: 8, title: "Payment Collection", description: "Collect payment per Ohio fee schedule. Provide receipt. Maximum $5 per notarial act per ORC §147.08.", tips: ["Accept cash, check, or card", "Provide itemized receipt", "Travel and convenience fees are separate from notarial fees"] },
];

const RON_STEPS: ProcessStep[] = [
  { step: 1, title: "Platform Login (SignNow)", description: "Log into SignNow and create a new document session. Upload the document(s) to be notarized.", tips: ["Ensure stable internet connection (10+ Mbps)", "Use Chrome or Edge for best compatibility", "Verify your digital certificate is current"] },
  { step: 2, title: "Tech Check", description: "Run the tech check with the signer: webcam, microphone, screen share, and internet speed.", tips: ["Both parties need webcam + microphone", "Connection must support real-time video", "Test before the scheduled session time"] },
  { step: 3, title: "KBA Verification", description: "Signer completes Knowledge-Based Authentication — 5 questions, must pass with 4/5 correct. Max 2 attempts per ORC §147.66.", tips: ["Questions pulled from credit bureau records", "Signer has 2 minutes per question set", "If both attempts fail, session must be terminated"] },
  { step: 4, title: "Credential Analysis", description: "Signer presents government-issued photo ID on camera. Verify against KBA identity. Check for tampering.", tips: ["ID must be current and unexpired", "Compare photo to live video feed", "Check for alterations, hologram presence"] },
  { step: 5, title: "Document Presentation", description: "Present the document on screen. Allow signer to review all pages. Answer procedural questions only (no legal advice).", tips: ["Signer must be able to read the entire document", "Confirm understanding of what they are signing", "Do NOT summarize or explain legal terms"] },
  { step: 6, title: "E-Signature & E-Seal", description: "Signer applies their e-signature. Notary applies digital notary seal and signature. SignNow records tamper-evident audit trail.", tips: ["Digital seal must meet Ohio e-seal requirements", "Audit trail includes timestamps and IP addresses", "Document becomes tamper-evident after sealing"] },
  { step: 7, title: "Recording Management", description: "The entire session is recorded per Ohio RON requirements. Recording must be retained for 10 years per ORC §147.63.", tips: ["Recording starts when signer joins session", "Includes all audio and video of the ceremony", "Store securely with encryption at rest"] },
  { step: 8, title: "Journal Entry & Completion", description: "Complete digital journal entry. Send completed document to signer. Archive session recording.", tips: ["Digital journal must capture same 14 data points as paper", "Provide signer with certified copy via email", "SignNow sends automatic completion notification"] },
];

interface ProcessGuideProps {
  mode?: "mobile" | "ron" | "both";
  compact?: boolean;
}

export function ProcessGuide({ mode = "both", compact = false }: ProcessGuideProps) {
  const [activeMode, setActiveMode] = useState<"mobile" | "ron">(mode === "ron" ? "ron" : "mobile");

  const getGuideHtml = () => {
    const steps = activeMode === "mobile" ? MOBILE_STEPS : RON_STEPS;
    const title = activeMode === "mobile" ? "Mobile Notary Process Guide — Ohio" : "Remote Online Notarization (RON) Process Guide — Ohio";
    return `<html><head><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 20px; border-bottom: 2px solid hsl(var(--primary)); padding-bottom: 8px; }
        .step { margin: 16px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; }
        .step-num { display: inline-block; width: 28px; height: 28px; border-radius: 50%; background: hsl(var(--primary)); color: white; text-align: center; line-height: 28px; font-weight: bold; margin-right: 8px; }
        .step-title { font-weight: bold; font-size: 14px; }
        .step-desc { margin: 8px 0; font-size: 13px; color: #374151; }
        .tips { margin-top: 8px; padding-left: 20px; font-size: 12px; color: #6b7280; }
        .tips li { margin: 4px 0; }
        .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 15px; } }
      </style></head><body>
        <h1>${title}</h1>
        <p style="color:#6b7280;font-size:12px;">Notar — Professional Ohio Notary Services</p>
        ${steps.map(s => `
          <div class="step">
            <span class="step-num">${s.step}</span>
            <span class="step-title">${s.title}</span>
            <p class="step-desc">${s.description}</p>
            ${s.tips ? `<ul class="tips">${s.tips.map(t => `<li>✓ ${t}</li>`).join("")}</ul>` : ""}
          </div>
        `).join("")}
        <div class="footer">© 2026 Notar. For informational purposes only. This is not legal advice.</div>
      </body></html>`;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(getGuideHtml());
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const blob = new Blob([getGuideHtml()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeMode === "mobile" ? "mobile" : "ron"}-notary-process-guide.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const steps = activeMode === "mobile" ? MOBILE_STEPS : RON_STEPS;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">
            {activeMode === "mobile" ? "Mobile Notary Process" : "RON Process (SignNow)"}
          </CardTitle>
          <div className="flex gap-2">
            {mode === "both" && (
              <>
                <Button
                  size="sm"
                  variant={activeMode === "mobile" ? "default" : "outline"}
                  onClick={() => setActiveMode("mobile")}
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" /> Mobile
                </Button>
                <Button
                  size="sm"
                  variant={activeMode === "ron" ? "default" : "outline"}
                  onClick={() => setActiveMode("ron")}
                >
                  <Laptop className="h-3.5 w-3.5 mr-1" /> RON
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1" /> Print Guide
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-1" /> Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {compact ? (
          <div className="grid gap-2">
            {steps.map(s => (
              <div key={s.step} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.step}</span>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {steps.map(s => (
              <AccordionItem key={s.step} value={`step-${s.step}`}>
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{s.step}</span>
                    {s.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                  {s.tips && (
                    <div className="space-y-1">
                      {s.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          {tip}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
