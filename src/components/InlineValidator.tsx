/**
 * SVC-468: Inline validation on blur for form fields
 * Provides real-time validation feedback as users move between fields
 */
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidatedFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  validate: (value: string) => string | null; // Returns error message or null
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
}

export function ValidatedField({
  id, label, value, onChange, validate, type = "text",
  placeholder, required, maxLength, className,
}: ValidatedFieldProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlur = useCallback(() => {
    setTouched(true);
    setError(validate(value));
  }, [value, validate]);

  const handleChange = useCallback((v: string) => {
    onChange(v);
    if (touched) setError(validate(v));
  }, [onChange, touched, validate]);

  const isValid = touched && !error && value.length > 0;

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            error && touched ? "border-destructive focus-visible:ring-destructive" : "",
            isValid ? "border-success/30 focus-visible:ring-green-500" : "",
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {isValid && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
        )}
        {error && touched && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
        )}
      </div>
      {error && touched && (
        <p id={`${id}-error`} className="text-xs text-destructive flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Common validators */
export const validators = {
  required: (label: string) => (v: string) => v.trim() ? null : `${label} is required`,
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email address",
  phone: (v: string) => /^\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4}$/.test(v.replace(/\s/g, "")) ? null : "Enter a valid phone number",
  zip: (v: string) => /^\d{5}(-\d{4})?$/.test(v) ? null : "Enter a valid ZIP code",
  minLength: (n: number) => (v: string) => v.length >= n ? null : `Must be at least ${n} characters`,
};
