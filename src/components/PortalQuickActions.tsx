/**
 * Portal quick action cards for the overview tab.
 * Item 554: Upload Doc, Book Appointment, Message quick actions.
 */
import { Upload, Calendar, MessageSquare, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface QuickAction {
  icon: typeof Upload;
  label: string;
  href: string;
  color: string;
}

const ACTIONS: QuickAction[] = [
  { icon: Calendar, label: "Book Appointment", href: "/book", color: "text-primary" },
  { icon: Upload, label: "Upload Document", href: "/mobile-upload", color: "text-primary" },
  { icon: MessageSquare, label: "Message Us", href: "/portal?tab=chat", color: "text-primary" },
  { icon: FileText, label: "View Documents", href: "/portal?tab=documents", color: "text-primary" },
];

export function PortalQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map(action => (
        <Link key={action.label} to={action.href}>
          <Card className="border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <action.icon className={`h-6 w-6 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
