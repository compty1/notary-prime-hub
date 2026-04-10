/**
 * Notary Attestation Panel — shown in the Finalize step before sealing.
 * Displays KBA verdict, visual identity match checkbox, journal preview, and notes.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Shield, AlertCircle, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotaryAttestationPanelProps {
  signerName: string;
  signingPlatform: string;
  kbaCompleted: boolean;
  idVerified: boolean;
  oathAdministered: boolean;
  recordingConsent: boolean;
  recordingConsentAt: string | null;
  sessionUniqueId: string | null;
  /** Notarization session DB ID for persisting attestation */
  sessionId?: string;
  onAttestationComplete: (notes: string) => void;
  disabled?: boolean;
}

export function NotaryAttestationPanel({
  signerName,
  signingPlatform,
  kbaCompleted,
  idVerified,
  oathAdministered,
  recordingConsent,
  recordingConsentAt,
  sessionUniqueId,
  onAttestationComplete,
  disabled,
}: NotaryAttestationPanelProps) {
  const [visualMatchConfirmed, setVisualMatchConfirmed] = useState(false);
  const [attestationNotes, setAttestationNotes] = useState("");

  const allPassed = kbaCompleted && idVerified && oathAdministered && recordingConsent;
  const canFinalize = allPassed && visualMatchConfirmed;

  const journalEntries = [
    { label: "Identity Proofing", value: `KBA via ${signingPlatform}`, passed: kbaCompleted },
    { label: "Photo ID Verification", value: idVerified ? "Government ID Matched" : "Pending", passed: idVerified },
    { label: "Oath/Affirmation", value: oathAdministered ? "Administered" : "Pending", passed: oathAdministered },
    { label: "Recording Consent", value: recordingConsentAt ? `Given at ${new Date(recordingConsentAt).toLocaleTimeString()}` : "Pending", passed: recordingConsent },
    { label: "Visual Match", value: visualMatchConfirmed ? "Confirmed by Notary" : "Awaiting Confirmation", passed: visualMatchConfirmed },
  ];

  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Notary Attestation</h3>
            <p className="text-xs text-muted-foreground">Review and confirm before applying seal</p>
          </div>
        </div>

        {/* KBA Verdict */}
        <div className={cn(
          "p-4 rounded-xl border",
          kbaCompleted ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
        )}>
          <div className="flex items-center gap-2 mb-1">
            {kbaCompleted ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm font-bold text-foreground">
              {kbaCompleted ? "KBA Passed" : "KBA Not Completed"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Signer <strong>{signerName}</strong> {kbaCompleted ? "successfully passed" : "has not yet passed"} KBA via {signingPlatform}.
          </p>
          {sessionUniqueId && (
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Session: {sessionUniqueId}</p>
          )}
        </div>

        {/* Visual Match Checkbox */}
        <div className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/30">
          <input
            type="checkbox"
            id="visual-match"
            checked={visualMatchConfirmed}
            onChange={(e) => setVisualMatchConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <Label htmlFor="visual-match" className="text-xs text-foreground leading-relaxed cursor-pointer">
            I have reviewed the identity verification results and confirm the signer's identity matches the government-issued photo ID presented during this session. I am satisfied that the person appearing before me is the person named in the document.
          </Label>
        </div>

        {/* Journal Preview */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Attestation Journal Preview</h4>
          {journalEntries.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                {entry.passed ? (
                  <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
                <span className="font-medium text-foreground">{entry.label}</span>
              </div>
              <span className={cn("text-[11px]", entry.passed ? "text-primary" : "text-muted-foreground")}>{entry.value}</span>
            </div>
          ))}
        </div>

        {/* Notary Notes */}
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Notary Notes (optional)</Label>
          <Textarea
            value={attestationNotes}
            onChange={(e) => setAttestationNotes(e.target.value)}
            placeholder="Any additional observations or notes for the journal entry..."
            className="text-xs min-h-[60px]"
          />
        </div>

        {/* Finalize Button */}
        <Button
          className="w-full"
          disabled={!canFinalize || disabled}
          onClick={() => onAttestationComplete(attestationNotes)}
        >
          <Shield className="mr-2 h-4 w-4" />
          {canFinalize ? "Confirm Attestation & Apply Seal" : "Complete All Checks to Continue"}
        </Button>

        {!allPassed && (
          <p className="text-[10px] text-destructive text-center">
            All verification steps must be completed before the notary seal can be applied.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
