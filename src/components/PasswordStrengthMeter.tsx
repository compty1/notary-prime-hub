import { useMemo } from "react";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
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
    <div className="mt-2 space-y-1">
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
    </div>
  );
}
