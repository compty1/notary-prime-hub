/**
 * Sprint I (I-21..30): KBA attempt counter UI with hard cap per ORC §147.66
 * Visually enforces the 2-attempt maximum — terminates session UI on exceed.
 */
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MAX_KBA_ATTEMPTS, isKbaLimitExceeded } from "@/lib/ohioRonCompliance";

interface KbaAttemptCounterProps {
  attempts: number;
  passed?: boolean;
  onSessionTerminate?: () => void;
}

export function KbaAttemptCounter({ attempts, passed, onSessionTerminate }: KbaAttemptCounterProps) {
  const exceeded = isKbaLimitExceeded(attempts);
  const remaining = Math.max(0, MAX_KBA_ATTEMPTS - attempts);

  if (exceeded && onSessionTerminate) {
    // Defer to next tick so parent can react
    queueMicrotask(onSessionTerminate);
  }

  return (
    <Card className={exceeded ? "border-destructive" : passed ? "border-primary" : undefined}>
      <CardContent className="flex items-center gap-3 p-4">
        {passed ? (
          <ShieldCheck className="h-5 w-5 text-primary" />
        ) : exceeded ? (
          <ShieldAlert className="h-5 w-5 text-destructive" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            KBA Verification
            <Badge variant={exceeded ? "destructive" : passed ? "default" : "secondary"}>
              {passed ? "Passed" : `${attempts}/${MAX_KBA_ATTEMPTS} attempts`}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {exceeded
              ? "Maximum attempts exceeded — session must be terminated per ORC §147.66"
              : passed
              ? "Identity verified successfully"
              : `${remaining} attempt${remaining === 1 ? "" : "s"} remaining`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
