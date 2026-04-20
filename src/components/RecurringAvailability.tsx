import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Plus, Trash2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TimeBlock { day: string; start: string; end: string; active: boolean }

interface RecurringAvailabilityProps {
  blocks: TimeBlock[];
  onChange: (blocks: TimeBlock[]) => void;
}

export function RecurringAvailability({ blocks, onChange }: RecurringAvailabilityProps) {
  const addBlock = () => {
    onChange([...blocks, { day: "Monday", start: "09:00", end: "17:00", active: true }]);
  };

  const updateBlock = (idx: number, updates: Partial<TimeBlock>) => {
    const next = blocks.map((b, i) => i === idx ? { ...b, ...updates } : b);
    onChange(next);
  };

  const removeBlock = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Recurring Weekly Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {blocks.map((block, idx) => (
          <div key={idx} className="flex items-center gap-2 flex-wrap">
            <Switch checked={block.active} onCheckedChange={v => updateBlock(idx, { active: v })} />
            <Select value={block.day} onValueChange={v => updateBlock(idx, { day: v })}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="time" value={block.start} onChange={e => updateBlock(idx, { start: e.target.value })} className="w-[110px]" />
            <span className="text-muted-foreground text-sm">to</span>
            <Input type="time" value={block.end} onChange={e => updateBlock(idx, { end: e.target.value })} className="w-[110px]" />
            <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> removeBlock(idx)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addBlock}>
          <Plus className="mr-1 h-3 w-3" /> Add Time Block
        </Button>
      </CardContent>
    </Card>
  );
}
