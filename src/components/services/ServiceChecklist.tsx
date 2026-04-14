import { CheckCircle, Circle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface ChecklistItem {
  label: string;
  description?: string;
  required?: boolean;
}

interface ServiceChecklistProps {
  items: ChecklistItem[];
  title?: string;
  checked?: string[];
  onToggle?: (label: string) => void;
}

export function ServiceChecklist({ items, title = "What to Prepare", checked = [], onToggle }: ServiceChecklistProps) {
  if (!items.length) return null;
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {title}
        </h3>
        <ul className="space-y-2">
          {items.map((item, i) => {
            const isChecked = checked.includes(item.label);
            return (
              <li
                key={i}
                className="flex items-start gap-2 text-sm cursor-pointer"
                onClick={() => onToggle?.(item.label)}
              >
                {isChecked ? (
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={isChecked ? "line-through text-muted-foreground" : ""}>
                    {item.label}
                    {item.required && <span className="text-destructive ml-1">*</span>}
                  </span>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
