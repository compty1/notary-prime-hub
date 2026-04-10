import { CheckCircle, Upload, Shield, Monitor, Video, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStep {
  key: string;
  label: string;
  icon: React.ElementType;
}

const STEPS: ProgressStep[] = [
  { key: "upload", label: "Upload Doc", icon: Upload },
  { key: "verify_id", label: "Verify ID", icon: Shield },
  { key: "tech_check", label: "Tech Check", icon: Monitor },
  { key: "meet_notary", label: "Meet Notary", icon: Video },
  { key: "download", label: "Download", icon: Download },
];

interface AppointmentRecord {
  status: string;
  notarization_type?: string;
  [key: string]: unknown;
}

interface DocumentRecord {
  status: string;
  [key: string]: unknown;
}

interface Props {
  appointments: AppointmentRecord[];
  documents: DocumentRecord[];
}

function deriveStep(appointments: AppointmentRecord[], documents: DocumentRecord[]): number {
  if (!appointments.length && !documents.length) return 0;

  const hasDoc = documents.length > 0;
  const activeAppt = appointments.find(a =>
    !["completed", "cancelled", "no_show"].includes(a.status)
  );
  const completedAppt = appointments.find(a => a.status === "completed");

  if (completedAppt) return 5; // All done
  if (activeAppt?.status === "in_session") return 4; // Meet notary
  if (activeAppt?.status === "confirmed" || activeAppt?.status === "kba_pending") return 3; // Tech check
  if (activeAppt && hasDoc) return 2; // Verify ID
  if (hasDoc) return 1; // Uploaded doc
  if (activeAppt) return 1; // Has appointment but no doc
  return 0;
}

export default function ClientProgressTracker({ appointments, documents }: Props) {
  const currentStep = deriveStep(appointments, documents);

  if (currentStep === 0 && !appointments.length) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Your Progress</h3>
        <span className="text-xs text-muted-foreground">
          {currentStep >= 5 ? "Complete!" : `Step ${Math.min(currentStep + 1, 5)} of 5`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-muted mb-4 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${(currentStep / 5) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep && currentStep < 5;
          const Icon = done ? CheckCircle : step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary/20 text-primary ring-2 ring-primary/40 animate-pulse",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[10px] text-center leading-tight",
                  done && "text-primary font-medium",
                  active && "text-foreground font-medium",
                  !done && !active && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
