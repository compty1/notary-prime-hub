/**
 * Portal quick action cards — restyled with colored icon backgrounds.
 */
import { Upload, Calendar, MessageSquare, FileText, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface QuickAction {
  icon: typeof Upload;
  label: string;
  href: string;
  iconColor: string;
  iconBg: string;
}

const ACTIONS: QuickAction[] = [
  { icon: Calendar, label: "Book Appointment", href: "/book", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-900/30" },
  { icon: Upload, label: "Upload Document", href: "/mobile-upload", iconColor: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-50 dark:bg-purple-900/30" },
  { icon: MessageSquare, label: "Message Us", href: "/portal?tab=chat", iconColor: "text-green-600 dark:text-green-400", iconBg: "bg-green-50 dark:bg-green-900/30" },
  { icon: FileText, label: "View Documents", href: "/portal?tab=documents", iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-900/30" },
];

export function PortalQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map(action => (
        <Link key={action.label} to={action.href}>
          <Card className="rounded-2xl border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <div className={`p-3 rounded-xl ${action.iconBg}`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
