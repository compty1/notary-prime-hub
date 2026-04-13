/**
 * Sprint 1/4: UPL Guard Wrapper
 * Mandatory legal disclaimer for all legal support intake forms (ORC §4705.07).
 * Wraps any service that could be construed as unauthorized practice of law.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface UPLGuardProps {
  serviceName: string;
  children: React.ReactNode;
}

const UPL_DISCLAIMER = `This service provides document preparation, clerical assistance, and administrative support ONLY. We do NOT provide legal advice, legal representation, or legal opinions. Per Ohio Revised Code §4705.07, the unauthorized practice of law is prohibited. If you need legal advice, please consult a licensed attorney. By proceeding, you acknowledge that this service is clerical in nature and does not constitute legal counsel.`;

export function UPLGuard({ serviceName, children }: UPLGuardProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (acknowledged) {
    return <>{children}</>;
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg">Legal Disclaimer Required</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Before using <strong>{serviceName}</strong>, please read and acknowledge the following:
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{UPL_DISCLAIMER}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="upl-ack"
            checked={acknowledged}
            onCheckedChange={v => setAcknowledged(!!v)}
          />
          <Label htmlFor="upl-ack" className="text-sm cursor-pointer">
            I understand that this is a clerical/administrative service and does not constitute legal advice or representation.
            <span className="text-destructive ml-1">*</span>
          </Label>
        </div>

        <Button
          disabled={!acknowledged}
          onClick={() => setAcknowledged(true)}
          className="w-full"
        >
          I Acknowledge — Proceed to {serviceName}
        </Button>
      </CardContent>
    </Card>
  );
}
