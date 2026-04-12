import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { logConsent } from "@/lib/consentLogging";
import { useAuth } from "@/contexts/AuthContext";

interface ConsentItem {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  version?: string;
}

interface ConsentCheckboxesProps {
  consents: ConsentItem[];
  values: Record<string, boolean>;
  onChange: (id: string, checked: boolean) => void;
}

export function ConsentCheckboxes({ consents, values, onChange }: ConsentCheckboxesProps) {
  const { user } = useAuth();

  const handleChange = (item: ConsentItem, checked: boolean) => {
    onChange(item.id, checked);
    if (user) {
      logConsent({
        consentType: item.id,
        granted: checked,
        version: item.version || "1.0",
      }, user.id);
    }
  };

  return (
    <div className="space-y-3">
      {consents.map(item => (
        <div key={item.id} className="flex items-start gap-3">
          <Checkbox
            id={`consent-${item.id}`}
            checked={values[item.id] || false}
            onCheckedChange={(checked) => handleChange(item, !!checked)}
          />
          <div className="grid gap-0.5 leading-none">
            <Label htmlFor={`consent-${item.id}`} className="text-sm cursor-pointer">
              {item.label}{item.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
