import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface AutomationsTabProps {
  automations: Record<string, { name: string; description: string; triggers: string[] }>;
}

export default function AutomationsTab({ automations }: AutomationsTabProps) {
  return (
    <div className="space-y-4">
      {Object.entries(automations).map(([fnName, auto]) => (
        <Card key={fnName} className="rounded-[24px] border-2 border-border shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-black text-sm text-foreground">{auto.name}</h3>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold rounded-lg border-2">{fnName}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{auto.description}</p>
            <div className="flex flex-wrap gap-1">
              {auto.triggers.map(t => (
                <Badge key={t} className="bg-primary/10 text-primary text-[10px] rounded-md font-bold">{t}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
