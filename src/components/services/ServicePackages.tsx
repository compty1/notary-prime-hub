import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ServicePackage {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

interface ServicePackagesProps {
  packages: ServicePackage[];
  selected?: string;
  onSelect: (id: string) => void;
}

export function ServicePackages({ packages, selected, onSelect }: ServicePackagesProps) {
  if (!packages.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Select Package</h3>
      <div className="grid gap-3">
        {packages.map(pkg => (
          <Card
            key={pkg.id}
            className={cn(
              "cursor-pointer transition-all border-2",
              selected === pkg.id ? "border-primary bg-primary/5" : "border-transparent hover:border-muted-foreground/20"
            )}
            onClick={() => onSelect(pkg.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{pkg.name}</span>
                  {pkg.popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                </div>
                <span className="font-bold text-primary">{pkg.price}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{pkg.description}</p>
              <ul className="space-y-1">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs">
                    <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
