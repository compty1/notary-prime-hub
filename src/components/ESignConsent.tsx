import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, FileText } from "lucide-react";

interface ESignConsentProps {
  consented: boolean;
  onConsentChange: (consented: boolean) => void;
  consentTimestamp: string | null;
}

export function ESignConsent({ consented, onConsentChange, consentTimestamp }: ESignConsentProps) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Electronic Signature Consent</p>
      </div>
      <div className="text-xs text-muted-foreground space-y-2">
        <p>
          By checking the box below, you acknowledge and agree to the following in accordance with the 
          <strong> Uniform Electronic Transactions Act (UETA)</strong> and the 
          <strong> Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. §7001)</strong>:
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>You consent to conduct this transaction electronically.</li>
          <li>Your electronic signature has the same legal force as a handwritten signature.</li>
          <li>You consent to the <strong>audio and video recording</strong> of this Remote Online Notarization session, as required by <strong>ORC §147.66</strong>.</li>
          <li>You have the right to withdraw this consent at any time before signing.</li>
          <li>You may request a paper copy of any electronically signed document.</li>
          <li>Session recordings will be retained for a minimum of 10 years per Ohio law.</li>
        </ul>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="esign-consent"
          checked={consented}
          onCheckedChange={(checked) => onConsentChange(checked === true)}
        />
        <Label htmlFor="esign-consent" className="text-xs leading-relaxed cursor-pointer">
          I have read and agree to the electronic signature disclosure above. I understand that my electronic signature 
          is legally binding and consent to conducting this notarization electronically.
        </Label>
      </div>
      {consented && consentTimestamp && (
        <p className="text-[10px] text-primary flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Consent recorded at {new Date(consentTimestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}
