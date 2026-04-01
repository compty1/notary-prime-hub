import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Loader2, AlertTriangle, LocateFixed, CalendarOff, Info } from "lucide-react";
import { CharCounter } from "@/components/CharCounter";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { formatTimeSlot, isDigitalOnly, requiresNotarizationType, US_STATES, getHolidaysForYear, MINIMUM_ADVANCE_HOURS } from "./bookingConstants";

interface ScheduleStepProps {
  date: string; setDate: (v: string) => void;
  time: string; setTime: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  serviceType: string;
  notarizationType: string;
  serviceCategories: Record<string, string>;
  availableSlots: any[];
  suggestedSlots: any[];
  loadingSlots: boolean;
  leadTimeWarning: string | null;
  // Location
  clientAddress: string; setClientAddress: (v: string) => void;
  clientCity: string; setClientCity: (v: string) => void;
  clientState: string; setClientState: (v: string) => void;
  clientZip: string; setClientZip: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  locatingUser: boolean;
  userLat: number | null;
  userLon: number | null;
  onUseLocation: () => void;
  outsideServiceArea?: boolean;
  travelDistance?: number | null;
}

export default function BookingScheduleStep(props: ScheduleStepProps) {
  const { date, setDate, time, setTime, serviceType, notarizationType, serviceCategories } = props;

  // Holiday detection
  const holidayName = useMemo(() => {
    if (!date) return null;
    const year = new Date(date + "T00:00:00").getFullYear();
    const holidays = getHolidaysForYear(year);
    return holidays[date] || null;
  }, [date]);

  // Minimum advance time check
  const advanceWarning = useMemo(() => {
    if (!date || !time) return null;
    const selected = new Date(`${date}T${time}`);
    const minTime = new Date(Date.now() + MINIMUM_ADVANCE_HOURS * 60 * 60 * 1000);
    if (selected < minTime) return `Appointments require at least ${MINIMUM_ADVANCE_HOURS} hours advance notice. Please select a later time.`;
    return null;
  }, [date, time]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
      </div>

      {holidayName && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300">
          <CalendarOff className="h-4 w-4 flex-shrink-0" /> <strong>{holidayName}</strong> — We may have limited availability on this holiday. Consider an alternate date.
        </div>
      )}

      {date && props.loadingSlots && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
        </div>
      )}

      {date && !props.loadingSlots && props.availableSlots.length === 0 && props.suggestedSlots.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" /> No availability on this date
          </p>
          <p className="mb-3 text-xs text-muted-foreground">Here are the nearest available slots:</p>
          <div className="space-y-2">
            {props.suggestedSlots.map((s: any, i: number) => (
              <Button key={i} variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => { setDate(s.date); setTime(s.slot.start_time); }}>
                <Calendar className="mr-2 h-3 w-3" />
                {new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — {formatTimeSlot(s.slot.start_time)} to {formatTimeSlot(s.slot.end_time)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {date && props.availableSlots.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <Label>Available Time Slots</Label>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> All times shown in Eastern Time (ET)
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {props.availableSlots.map((slot: any) => (
              <Button key={slot.id} variant={time === slot.start_time ? "default" : "outline"} size="sm" className={time === slot.start_time ? "bg-primary text-primary-foreground" : ""} onClick={() => setTime(slot.start_time)}>
                <Clock className="mr-1 h-3 w-3" /> {formatTimeSlot(slot.start_time)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {props.availableSlots.length === 0 && !props.loadingSlots && date && props.suggestedSlots.length === 0 && (
        <div><Label htmlFor="time">Time</Label><Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
      )}

      {props.leadTimeWarning && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {props.leadTimeWarning}
        </div>
      )}

      {advanceWarning && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {advanceWarning}
        </div>
      )}

      {props.outsideServiceArea && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Outside service area (~{props.travelDistance?.toFixed(0)} miles)</p>
            <p className="text-muted-foreground">Your location appears to be outside our standard travel radius. Consider switching to <strong>Remote Online Notarization (RON)</strong> for a seamless experience from anywhere.</p>
          </div>
        </div>
      )}

      {!isDigitalOnly(serviceType, serviceCategories) && notarizationType === "in_person" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Meeting Location</Label>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={props.onUseLocation} disabled={props.locatingUser}>
              {props.locatingUser ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <LocateFixed className="mr-1 h-3 w-3" />} Use My Location
            </Button>
          </div>
          <AddressAutocomplete value={props.clientAddress} onChange={props.setClientAddress} userLat={props.userLat} userLon={props.userLon} onSelect={s => { props.setClientAddress(s.address); props.setClientCity(s.city); props.setClientState(s.state); props.setClientZip(s.zip); props.setLocation(s.fullAddress); }} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="City" value={props.clientCity} onChange={e => props.setClientCity(e.target.value)} />
            <Input placeholder="State" value={props.clientState} onChange={e => props.setClientState(e.target.value)} maxLength={2} />
            <Input placeholder="Zip Code" value={props.clientZip} onChange={e => props.setClientZip(e.target.value)} maxLength={5} />
          </div>
          <p className="text-xs text-muted-foreground">Search for a business, address, or landmark — suggestions appear as you type</p>
        </div>
      )}

      {serviceType && requiresNotarizationType(serviceType, serviceCategories) && (
        <div>
          <Label>State of Document Execution</Label>
          <Select value={props.clientState} onValueChange={props.setClientState}>
            <SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger>
            <SelectContent>
              {US_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Where will this document be used or recorded?</p>
        </div>
      )}

      {serviceType && requiresNotarizationType(serviceType, serviceCategories) && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p><strong>Cancellation Policy:</strong> Appointments may be cancelled or rescheduled at no charge up to 2 hours before the scheduled time. Late cancellations or no-shows may incur a fee.</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="notes">Additional Notes</Label>
          <CharCounter current={props.notes.length} max={500} />
        </div>
        <Textarea id="notes" value={props.notes} onChange={e => props.setNotes(e.target.value.slice(0, 500))} placeholder="Number of documents, special instructions, etc." rows={3} />
      </div>
    </div>
  );
}
