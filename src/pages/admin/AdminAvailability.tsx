import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminAvailability() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSlots = async () => {
    const { data } = await supabase.from("time_slots").select("*").order("day_of_week").order("start_time");
    if (data) setSlots(data);
    setLoading(false);
  };

  useEffect(() => { fetchSlots(); }, []);

  const addSlot = async (dayOfWeek: number) => {
    const { error } = await supabase.from("time_slots").insert({
      day_of_week: dayOfWeek,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchSlots();
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("time_slots").delete().eq("id", id);
    fetchSlots();
  };

  const toggleSlot = async (id: string, current: boolean) => {
    await supabase.from("time_slots").update({ is_available: !current }).eq("id", id);
    fetchSlots();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Availability Settings</h1>
      <div className="space-y-4">
        {dayNames.map((day, i) => {
          const daySlots = slots.filter((s) => s.day_of_week === i);
          return (
            <Card key={i} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-base">{day}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => addSlot(i)}>
                  <Plus className="mr-1 h-4 w-4" /> Add Slot
                </Button>
              </CardHeader>
              <CardContent>
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No availability set</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-4 rounded-lg border border-border/50 p-3">
                        <Switch checked={slot.is_available} onCheckedChange={() => toggleSlot(slot.id, slot.is_available)} />
                        <span className="text-sm font-medium">{slot.start_time} — {slot.end_time}</span>
                        <Button variant="ghost" size="sm" onClick={() => deleteSlot(slot.id)} className="ml-auto text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
