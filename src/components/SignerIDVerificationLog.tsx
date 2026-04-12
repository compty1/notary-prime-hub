import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface VerificationEntry {
  method: string;
  status: "passed" | "failed" | "pending";
  timestamp?: string;
  details?: string;
}

interface Props {
  kbaAttempts?: number;
  kbaCompleted?: boolean;
  idType?: string;
  idVerified?: boolean;
  recordingConsent?: boolean;
  esignConsent?: boolean;
}

export function SignerIDVerificationLog({ kbaAttempts = 0, kbaCompleted, idType, idVerified, recordingConsent, esignConsent }: Props) {
  const entries: VerificationEntry[] = [
    {
      method: "Knowledge-Based Authentication (KBA)",
      status: kbaCompleted ? "passed" : kbaAttempts > 0 ? "pending" : "pending",
      details: `${kbaAttempts}/2 attempts used per ORC §147.66`,
    },
    {
      method: `ID Verification${idType ? ` (${idType})` : ""}`,
      status: idVerified ? "passed" : "pending",
      details: idType ? `Government-issued ${idType} validated` : "Awaiting ID presentation",
    },
    {
      method: "Recording Consent (ORC §147.63)",
      status: recordingConsent ? "passed" : "pending",
    },
    {
      method: "E-Sign Consent (UETA/ESIGN)",
      status: esignConsent ? "passed" : "pending",
    },
  ];

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "passed") return <CheckCircle className="h-4 w-4 text-primary" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" /> Signer Verification Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
            <StatusIcon status={entry.status} />
            <div className="flex-1">
              <p className="text-sm font-medium">{entry.method}</p>
              {entry.details && <p className="text-xs text-muted-foreground">{entry.details}</p>}
            </div>
            <Badge variant={entry.status === "passed" ? "default" : entry.status === "failed" ? "destructive" : "secondary"}>
              {entry.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
