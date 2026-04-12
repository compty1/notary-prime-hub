/**
 * SVC-506: Quick actions toolbar on job detail pages
 */
import { Button } from "@/components/ui/button";
import { 
  Mail, Phone, FileText, Calendar, DollarSign, Printer, 
  ExternalLink, Copy, MoreHorizontal 
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
}

interface QuickActionsToolbarProps {
  appointmentId?: string;
  clientEmail?: string;
  clientPhone?: string;
  confirmationNumber?: string;
  actions?: QuickAction[];
}

export function QuickActionsToolbar({
  appointmentId,
  clientEmail,
  clientPhone,
  confirmationNumber,
  actions = [],
}: QuickActionsToolbarProps) {
  const defaultActions: QuickAction[] = [
    ...(clientEmail ? [{
      label: "Email Client",
      icon: <Mail className="h-4 w-4" />,
      onClick: () => window.open(`mailto:${clientEmail}`, "_blank"),
    }] : []),
    ...(clientPhone ? [{
      label: "Call Client",
      icon: <Phone className="h-4 w-4" />,
      onClick: () => window.open(`tel:${clientPhone}`, "_blank"),
    }] : []),
    ...(confirmationNumber ? [{
      label: "Copy Confirmation #",
      icon: <Copy className="h-4 w-4" />,
      onClick: () => {
        navigator.clipboard.writeText(confirmationNumber);
        toast.success("Confirmation number copied");
      },
    }] : []),
  ];

  const allActions = [...defaultActions, ...actions];

  if (allActions.length === 0) return null;

  // Show first 3 as buttons, rest in overflow menu
  const visible = allActions.slice(0, 3);
  const overflow = allActions.slice(3);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((action, i) => (
        <Button key={i} variant="outline" size="sm" onClick={action.onClick} className="text-xs">
          {action.icon}
          <span className="ml-1.5 hidden sm:inline">{action.label}</span>
        </Button>
      ))}
      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflow.map((action, i) => (
              <DropdownMenuItem key={i} onClick={action.onClick}>
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
