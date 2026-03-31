import { CheckCircle, AlertTriangle } from "lucide-react";

const items = [
  "Bring a valid, unexpired government-issued photo ID (driver's license, passport, or state ID)",
  "Do NOT sign your documents before the notary session",
  "Know what type of notarization you need (Acknowledgment, Jurat, etc.)",
  "Have all required signers present at the appointment",
  "Bring the original document(s) — copies cannot be notarized",
];

export function PreSigningChecklist() {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-primary" />
        Pre-Appointment Checklist
      </h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            {item.includes("Do NOT sign") ? (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" />
            ) : (
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
