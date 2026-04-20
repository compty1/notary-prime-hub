/**
 * SVC-130: Reschedule conflict detection with alternative slot suggestions
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Clock, CheckCircle2 } from "lucide-react";

interface ConflictResult {
  hasConflict: boolean;
  conflictingAppointment?: {
    serviceType: string;
    confirmationNumber: string;
  };
  alternativeSlots: { date: string; time: string }[];
}

interface RescheduleConflictDetectorProps {
  conflict: ConflictResult;
  onSelectAlternative: (date: string, time: string) => void;
}

export function RescheduleConflictDetector({ conflict, onSelectAlternative }: RescheduleConflictDetectorProps) {
  if (!conflict.hasConflict) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="h-4 w-4" /> Time slot is available
      </div>
    );
  }

  return (
    <Card className="border-warning/30 bg-warning/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <p className="font-medium text-sm text-warning">Scheduling Conflict</p>
            {conflict.conflictingAppointment && (
              <p className="text-xs text-warning mt-0.5">
                Conflicts with {conflict.conflictingAppointment.serviceType} ({conflict.conflictingAppointment.confirmationNumber})
              </p>
            )}
          </div>
        </div>
        
        {conflict.alternativeSlots.length > 0 && (
          <div>
            <p className="text-xs font-medium text-warning mb-2">Suggested alternatives:</p>
            <div className="space-y-1.5">
              {conflict.alternativeSlots.slice(0, 3).map((slot, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs bg-background dark:bg-background"
                  onClick={() => onSelectAlternative(slot.date, slot.time)}
                >
                  <Calendar className="mr-2 h-3 w-3" />
                  {new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  <Clock className="ml-2 mr-1 h-3 w-3" />
                  {slot.time}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
