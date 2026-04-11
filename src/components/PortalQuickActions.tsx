/**
 * Portal quick action cards — restyled with 3D icons.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Icon3D, FEATURE_3D_ICON } from "@/lib/icon3dMap";

interface QuickAction {
  icon3d: string;
  label: string;
  href: string;
}

const ACTIONS: QuickAction[] = [
  { icon3d: FEATURE_3D_ICON.schedule, label: "Book Appointment", href: "/book" },
  { icon3d: FEATURE_3D_ICON.upload, label: "Upload Document", href: "/mobile-upload" },
  { icon3d: FEATURE_3D_ICON.email, label: "Message Us", href: "/portal?tab=chat" },
  { icon3d: FEATURE_3D_ICON.download, label: "View Documents", href: "/portal?tab=documents" },
  { icon3d: FEATURE_3D_ICON.tools, label: "Document Studio", href: "/docudex" },
];

export function PortalQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {ACTIONS.map(action => (
        <Link key={action.label} to={action.href}>
          <Card className="rounded-2xl border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <Icon3D src={action.icon3d} alt={action.label} className="h-[92px] w-[92px]" />
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
