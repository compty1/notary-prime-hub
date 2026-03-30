import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle } from "lucide-react";

interface ESealProps {
  notaryName: string;
  commissionState: string;
  commissionNumber?: string;
  commissionExpiry?: string;
  documentId: string;
  verificationUrl?: string;
  status?: "valid" | "revoked";
}

export function ESealEmbed({
  notaryName, commissionState, commissionNumber, commissionExpiry,
  documentId, verificationUrl, status = "valid",
}: ESealProps) {
  const baseUrl = verificationUrl || `${window.location.origin}/verify/${documentId}`;

  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-sans text-sm font-bold tracking-wide uppercase text-primary">Electronic Notary Seal</span>
      </div>

      <div className="w-full border-t border-primary/20 pt-2 space-y-1">
        <p className="text-sm font-semibold text-foreground">{notaryName}</p>
        <p className="text-xs text-muted-foreground">Notary Public — State of {commissionState}</p>
        {commissionNumber && <p className="text-xs text-muted-foreground">Commission #{commissionNumber}</p>}
        {commissionExpiry && <p className="text-xs text-muted-foreground">Expires: {commissionExpiry}</p>}
      </div>

      <div className="flex items-center gap-1">
        {status === "valid" ? (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
            <CheckCircle className="mr-1 h-3 w-3" /> Valid
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">Revoked</Badge>
        )}
      </div>

      <a href={baseUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline break-all">
        Verify: {baseUrl}
      </a>
    </div>
  );
}
