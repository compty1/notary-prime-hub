import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminAvailability() {
  usePageMeta({ title: "Availability", noIndex: true });
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSlots = async () => {
    const { data } = await supabase.from("time_slots").select("*").order("day_of_week").order("start_time");
    if (data) setSlots(data);
    setLoading(false);
  };

  useEffect(() => { fetchSlots(); }, []);

  const checkOverlap = (dayOfWeek: number, startTime: string, endTime: string, excludeId?: string) => {
    return slots.some((s) => {
      if (s.day_of_week !== dayOfWeek) return false;
      if (excludeId && s.id === excludeId) return false;
      return startTime < s.end_time && endTime > s.start_time;
    });
  };

  const addSlot = async (dayOfWeek: number) => {
    if (checkOverlap(dayOfWeek, "09:00", "17:00")) {
      toast({ title: "Overlap detected", description: "This time range overlaps with an existing slot.", variant: "destructive" });
      return;
    }
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

  const updateSlotTime = async (id: string, field: "start_time" | "end_time", value: string) => {
    const slot = slots.find((s) => s.id === id);
    if (!slot) return;
    const newStart = field === "start_time" ? value : slot.start_time;
    const newEnd = field === "end_time" ? value : slot.end_time;
    if (newStart >= newEnd) {
      toast({ title: "Invalid time", description: "Start time must be before end time.", variant: "destructive" });
      return;
    }
    if (checkOverlap(slot.day_of_week, newStart, newEnd, id)) {
      toast({ title: "Overlap detected", description: "This time range overlaps with another slot.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("time_slots").update({ [field]: value }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSlots((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;
  }

  return (
    <div>
      <h1 className="mb-6 font-sans text-2xl font-bold text-foreground">Availability Settings</h1>
      <div className="space-y-4">
        {dayNames.map((day, i) => {
          const daySlots = slots.filter((s) => s.day_of_week === i);
          return (
            <Card key={i} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-sans text-base">{day}</CardTitle>
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
                      <div key={slot.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                        <Switch checked={slot.is_available} onCheckedChange={() => toggleSlot(slot.id, slot.is_available)} />
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateSlotTime(slot.id, "start_time", e.target.value)}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateSlotTime(slot.id, "end_time", e.target.value)}
                          className="w-28"
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-auto text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete time slot?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this availability slot for {day}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSlot(slot.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
