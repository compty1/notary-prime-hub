import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, ExternalLink } from "lucide-react";

// KBA is handled natively by SignNow during the RON session.
// This component is informational only — it explains the KBA step to users.

interface KBAVerificationProps {
  signerName: string;
  onComplete: (passed: boolean) => void;
  onCancel: () => void;
}

export default function KBAVerification({ signerName, onComplete, onCancel }: KBAVerificationProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-sans font-semibold">Knowledge-Based Authentication (KBA)</h3>
          <Badge variant="outline" className="text-xs">ORC §147.66</Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          KBA is required for Remote Online Notarization under Ohio law. The signer must correctly answer identity verification questions generated from public records.
        </p>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm font-medium">KBA is handled by SignNow</p>
          </div>
          <p className="text-sm text-muted-foreground">
            When the RON session begins, <strong>{signerName}</strong> will complete KBA directly within SignNow's platform as part of the signing workflow. SignNow's built-in KBA is MISMO-compliant and meets all Ohio requirements:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>5 knowledge-based questions from public records</li>
            <li>Must answer at least 4 of 5 correctly (80% threshold)</li>
            <li>2-minute time limit per question set</li>
            <li>Maximum of 2 attempts permitted</li>
            <li>Results are logged and stored with the session record</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onComplete(true)}>
            <ExternalLink className="mr-1 h-4 w-4" /> Proceed to SignNow Session
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
