import { CheckCircle, Clock, AlertTriangle, FileText, Upload, Shield } from "lucide-react";

interface TimelineStep {
  key: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface ProgressTimelineProps {
  status: string;
  type?: "service_request" | "document" | "appointment";
}

const SERVICE_REQUEST_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "in_progress", label: "In Progress" },
  { key: "awaiting_client", label: "Awaiting Your Input" },
  { key: "completed", label: "Completed" },
];

const DOCUMENT_STEPS = [
  { key: "uploaded", label: "Uploaded" },
  { key: "pending_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "notarized", label: "Notarized" },
];

const APPOINTMENT_STEPS = [
  { key: "scheduled", label: "Scheduled" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_session", label: "In Session" },
  { key: "completed", label: "Completed" },
];

const stepIcons: Record<string, React.ElementType> = {
  submitted: Upload,
  in_progress: Clock,
  awaiting_client: AlertTriangle,
  completed: CheckCircle,
  uploaded: Upload,
  pending_review: FileText,
  approved: CheckCircle,
  notarized: Shield,
  scheduled: Clock,
  confirmed: CheckCircle,
  in_session: Shield,
};

export function ProgressTimeline({ status, type = "service_request" }: ProgressTimelineProps) {
  const steps = type === "document"
    ? DOCUMENT_STEPS
    : type === "appointment"
      ? APPOINTMENT_STEPS
      : SERVICE_REQUEST_STEPS;

  // Handle cancelled status
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span>Cancelled</span>
      </div>
    );
  }

  const currentIdx = steps.findIndex(s => s.key === status);
  const resolvedSteps: TimelineStep[] = steps.map((s, i) => ({
    ...s,
    completed: i < currentIdx,
    current: i === currentIdx,
  }));

  return (
    <div className="flex items-center gap-1" role="progressbar" aria-valuenow={currentIdx + 1} aria-valuemax={steps.length}>
      {resolvedSteps.map((step, i) => {
        const Icon = stepIcons[step.key] || FileText;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors ${
                  step.completed
                    ? "bg-primary text-primary-foreground"
                    : step.current
                      ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step.completed ? <CheckCircle className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              </div>
              <span className={`text-[9px] max-w-[60px] text-center leading-tight ${step.current ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < resolvedSteps.length - 1 && (
              <div className={`h-0.5 w-4 mt-[-12px] ${step.completed ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
