/**
 * Client portal onboarding checklist component — restyled to match mockup.
 */
import { CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ChecklistItem {
  label: string;
  subtitle: string;
  done: boolean;
  action?: { label: string; href: string };
}

interface PortalOnboardingChecklistProps {
  profile: any;
  documents: any[];
  appointments: any[];
  onEditProfile: () => void;
}

export function PortalOnboardingChecklist({ profile, documents, appointments, onEditProfile }: PortalOnboardingChecklistProps) {
  const items: ChecklistItem[] = [
    {
      label: "Complete your profile",
      subtitle: "Tell us a bit more about yourself",
      done: !!(profile?.full_name && profile?.phone && profile?.address),
      action: { label: "Edit Profile", href: "#" },
    },
    {
      label: "Upload a valid ID",
      subtitle: "Government issued ID for verification",
      done: documents.some(d => d.file_name?.toLowerCase().includes("id") || d.file_name?.toLowerCase().includes("license") || d.file_name?.toLowerCase().includes("passport")),
      action: { label: "Upload", href: "/mobile-upload" },
    },
    {
      label: "Book your first appointment",
      subtitle: "Connect with a licensed notary",
      done: appointments.length > 0,
      action: { label: "Book Now", href: "/book" },
    },
  ];

  const completedCount = items.filter(i => i.done).length;
  const progress = Math.round((completedCount / items.length) * 100);

  if (progress === 100) return null;

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <div className="p-6 border-b border-border/50 bg-muted/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Zap className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Getting Started</h3>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-background border border-border px-2 py-1 rounded-full">
          {completedCount}/{items.length} Complete
        </span>
      </div>
      <CardContent className="p-6 space-y-5">
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-1000 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-xl border border-dashed ${
                item.done ? "bg-muted/50 border-border/50 opacity-60" : "bg-background border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <div>
                  <h5 className={`text-sm font-bold ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </h5>
                  <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                </div>
              </div>
              {!item.done && item.action && (
                item.action.href === "#" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg h-7 px-3"
                    onClick={onEditProfile}
                  >
                    {item.action.label}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg h-7 px-3"
                    asChild
                  >
                    <Link to={item.action.href}>{item.action.label}</Link>
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
