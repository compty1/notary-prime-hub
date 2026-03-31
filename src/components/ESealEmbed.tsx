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
      <div className="flex items-center gap-3">
        <img
          src="/images/notary-seal.png"
          alt={`${notaryName} — Notary Seal`}
          className="h-16 w-16 rounded-full object-contain border border-primary/20 bg-background p-1"
        />
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-sans text-xs font-bold tracking-wide uppercase text-primary">Electronic Notary Seal</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{notaryName}</p>
          <p className="text-xs text-muted-foreground">Notary Public — State of {commissionState}</p>
        </div>
      </div>

      <div className="w-full border-t border-primary/20 pt-2 space-y-1">
        {commissionNumber && <p className="text-xs text-muted-foreground">Commission #{commissionNumber}</p>}
        {commissionExpiry && <p className="text-xs text-muted-foreground">Expires: {commissionExpiry}</p>}
      </div>

      <div className="flex items-center gap-1">
        {status === "valid" ? (
          <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary text-xs">
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
