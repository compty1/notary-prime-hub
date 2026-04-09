import { useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  showChecklist?: boolean;
}

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrengthMeter({ password, showChecklist = true }: PasswordStrengthMeterProps) {
  const { score, label, color } = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "bg-muted" };
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    const levels = [
      { label: "Very Weak", color: "bg-destructive" },
      { label: "Weak", color: "bg-destructive" },
      { label: "Fair", color: "bg-amber-500" },
      { label: "Good", color: "bg-amber-500" },
      { label: "Strong", color: "bg-primary" },
      { label: "Very Strong", color: "bg-primary" },
    ];
    const level = levels[s];
    return { score: s, label: level.label, color: level.color };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? color : "bg-muted"}`}
          />
        ))}
      </div>
      <p className={`text-xs ${score <= 2 ? "text-destructive" : score <= 3 ? "text-amber-600" : "text-primary"}`}>
        {label}
      </p>
      {/* #3432: Real-time password requirements checklist */}
      {showChecklist && (
        <ul className="space-y-0.5">
          {REQUIREMENTS.map((req) => {
            const met = req.test(password);
            return (
              <li key={req.label} className="flex items-center gap-1.5 text-xs">
                {met ? (
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className={met ? "text-foreground" : "text-muted-foreground"}>{req.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
