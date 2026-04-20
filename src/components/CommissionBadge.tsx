/**
 * C-001+: Commission expiry warning badge for notary profiles.
 * Shows warning when commission expires within 90 days.
 */
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle, Shield } from "lucide-react";
import { differenceInDays, parseISO, isValid } from "date-fns";

interface CommissionBadgeProps {
  expirationDate?: string | null;
  className?: string;
}

export function CommissionBadge({ expirationDate, className }: CommissionBadgeProps) {
  if (!expirationDate) {
    return (
      <Badge variant="outline" className={`text-xs gap-1 ${className}`}>
        <Shield className="h-3 w-3" /> Commission Status Unknown
      </Badge>
    );
  }

  const expDate = parseISO(expirationDate);
  if (!isValid(expDate)) return null;

  const daysUntilExpiry = differenceInDays(expDate, new Date());

  if (daysUntilExpiry < 0) {
    return (
      <Badge variant="destructive" className={`text-xs gap-1 ${className}`}>
        <XCircle className="h-3 w-3" /> Commission Expired
      </Badge>
    );
  }

  if (daysUntilExpiry <= 30) {
    return (
      <Badge variant="destructive" className={`text-xs gap-1 ${className}`}>
        <AlertTriangle className="h-3 w-3" /> Expires in {daysUntilExpiry} days
      </Badge>
    );
  }

  if (daysUntilExpiry <= 90) {
    return (
      <Badge className={`text-xs gap-1 bg-warning/10 text-warning border-warning/20 ${className}`}>
        <AlertTriangle className="h-3 w-3" /> Expires in {daysUntilExpiry} days
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`text-xs gap-1 text-success border-success/30 bg-success/5 ${className}`}>
      <CheckCircle2 className="h-3 w-3" /> Active Commission
    </Badge>
  );
}
