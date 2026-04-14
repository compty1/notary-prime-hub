import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ServiceAddOn {
  id: string;
  label: string;
  price: string;
  description?: string;
}

interface ServiceAddOnsProps {
  addOns: ServiceAddOn[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ServiceAddOns({ addOns, selected, onChange }: ServiceAddOnsProps) {
  if (!addOns.length) return null;
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Add-Ons</h3>
      <div className="space-y-2">
        {addOns.map(a => (
          <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm cursor-pointer">{a.label}</Label>
                <span className="text-sm font-medium text-primary">{a.price}</span>
              </div>
              {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
