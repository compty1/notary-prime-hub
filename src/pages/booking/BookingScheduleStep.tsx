import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Loader2, AlertTriangle, LocateFixed, CalendarOff } from "lucide-react";
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
}

export default function BookingScheduleStep(props: ScheduleStepProps) {
  const { date, setDate, time, setTime, serviceType, notarizationType, serviceCategories } = props;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
      </div>

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
          <Label>Available Time Slots</Label>
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

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea id="notes" value={props.notes} onChange={e => props.setNotes(e.target.value)} placeholder="Number of documents, special instructions, etc." rows={3} />
      </div>
    </div>
  );
}
