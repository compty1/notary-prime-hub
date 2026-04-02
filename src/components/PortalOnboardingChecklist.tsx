/**
 * Client portal onboarding checklist component.
 * Item 541: profile completion, ID upload, first appointment.
 */
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface ChecklistItem {
  label: string;
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
      done: !!(profile?.full_name && profile?.phone && profile?.address),
      action: { label: "Edit Profile", href: "#" },
    },
    {
      label: "Upload a valid ID",
      done: documents.some(d => d.file_name?.toLowerCase().includes("id") || d.file_name?.toLowerCase().includes("license") || d.file_name?.toLowerCase().includes("passport")),
      action: { label: "Upload", href: "/mobile-upload" },
    },
    {
      label: "Book your first appointment",
      done: appointments.length > 0,
      action: { label: "Book Now", href: "/book" },
    },
  ];

  const completedCount = items.filter(i => i.done).length;
  const progress = Math.round((completedCount / items.length) * 100);

  if (progress === 100) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Getting Started</span>
          <span className="text-xs font-normal text-muted-foreground">{completedCount}/{items.length} complete</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} className="h-2" />
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {item.done ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
            </div>
            {!item.done && item.action && (
              item.action.href === "#" ? (
                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={onEditProfile}>
                  {item.action.label} <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary" asChild>
                  <Link to={item.action.href}>{item.action.label} <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              )
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
