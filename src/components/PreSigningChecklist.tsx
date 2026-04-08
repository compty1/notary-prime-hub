import { useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { text: "Bring a valid, unexpired government-issued photo ID (driver's license, passport, or state ID)", isWarning: false },
  { text: "Do NOT sign your documents before the notary session", isWarning: true },
  { text: "Know what type of notarization you need (Acknowledgment, Jurat, etc.)", isWarning: false },
  { text: "Have all required signers present at the appointment", isWarning: false },
  { text: "Bring the original document(s) — copies cannot be notarized", isWarning: false },
];

interface PreSigningChecklistProps {
  /** If true, all items must be checked before onComplete fires */
  gateBlocking?: boolean;
  onComplete?: () => void;
}

export function PreSigningChecklist({ gateBlocking = false, onComplete }: PreSigningChecklistProps) {
  const [checked, setChecked] = useState<boolean[]>(new Array(items.length).fill(false));

  const toggle = (idx: number) => {
    setChecked((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const allChecked = checked.every(Boolean);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-primary" />
        Pre-Appointment Checklist
      </h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            {gateBlocking ? (
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                aria-label={item.text}
              />
            ) : item.isWarning ? (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" />
            ) : (
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            )}
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
      {gateBlocking && (
        <Button
          size="sm"
          className="w-full"
          disabled={!allChecked}
          onClick={onComplete}
        >
          {allChecked ? "Continue" : `Complete all ${items.length} items to continue`}
        </Button>
      )}
    </div>
  );
}
