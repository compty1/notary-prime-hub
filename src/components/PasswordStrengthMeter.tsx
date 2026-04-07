import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Props {
  password: string;
}

export function PasswordStrengthMeter({ password }: Props) {
  const { score, label, color } = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    // Uniqueness bonus
    if (new Set(password).size >= 6) s++;

    const levels: { label: string; color: string }[] = [
      { label: "Very Weak", color: "text-destructive" },
      { label: "Weak", color: "text-destructive" },
      { label: "Fair", color: "text-orange-500" },
      { label: "Good", color: "text-amber-500" },
      { label: "Strong", color: "text-emerald-500" },
    ];
    const idx = Math.min(Math.floor((s / 7) * 4), 4);
    return { score: Math.round((s / 7) * 100), label: levels[idx].label, color: levels[idx].color };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <Progress value={score} className="h-1.5" />
      <p className={cn("text-xs font-medium", color)}>{label}</p>
    </div>
  );
}
