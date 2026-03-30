import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OhioComplianceNoticeProps {
  type?: "ron" | "in_person" | "general";
}

export function OhioComplianceNotice({ type = "general" }: OhioComplianceNoticeProps) {
  const notices: Record<string, string> = {
    ron: "Remote Online Notarization is performed in compliance with Ohio Revised Code §147.60–147.66. The signer must present valid government-issued photo ID, complete knowledge-based authentication (KBA), and appear via live audio-video. Sessions are recorded and stored per ORC requirements.",
    in_person: "In-person notarization is performed in accordance with Ohio Revised Code §147. Signers must present valid, unexpired government-issued photo ID and personally appear before the notary.",
    general: "All notarization services comply with Ohio Revised Code Chapter 147 and applicable Secretary of State regulations.",
  };

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Info className="h-4 w-4 text-primary" />
      <AlertDescription className="text-xs text-muted-foreground">
        {notices[type]}
      </AlertDescription>
    </Alert>
  );
}
