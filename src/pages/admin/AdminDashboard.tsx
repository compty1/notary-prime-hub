import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Users, Clock, FileText, ScrollText, BookOpen, Bot, BookMarked, LogOut, Shield, Settings, DollarSign, Eye, FileSignature, Package, MessageSquare, Building2, ShoppingBag, Mail, UserPlus, Target, GraduationCap, Plug, ClipboardList, PenTool, ListChecks, Handshake, Bug, TrendingUp, ShieldCheck, Webhook, FileEdit, Workflow } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { AdminNotificationCenter } from "@/components/AdminNotificationCenter";

const sidebarGroups = [
  {
    label: "Operations",
    items: [
      { title: "Overview", url: "/admin", icon: LayoutDashboard, adminOnly: false },
      { title: "Appointments", url: "/admin/appointments", icon: Calendar, adminOnly: false },
      { title: "Availability", url: "/admin/availability", icon: Clock, adminOnly: true },
      { title: "Task Queue", url: "/admin/task-queue", icon: ListChecks, adminOnly: true },
      { title: "Process Flows", url: "/admin/process-flows", icon: Workflow, adminOnly: true },
      { title: "Performance", url: "/admin/performance", icon: TrendingUp, adminOnly: true },
    ],
  },
  {
    label: "Clients & CRM",
    items: [
      { title: "Clients", url: "/admin/clients", icon: Users, adminOnly: true },
      { title: "Business Clients", url: "/admin/business-clients", icon: Building2, adminOnly: true },
      { title: "Lead Portal", url: "/admin/leads", icon: Target, adminOnly: true },
      { title: "CRM", url: "/admin/crm", icon: Handshake, adminOnly: true },
      { title: "Service Requests", url: "/admin/service-requests", icon: ClipboardList, adminOnly: true },
    ],
  },
  {
    label: "Documents & Tools",
    items: [
      { title: "Documents", url: "/admin/documents", icon: FileText, adminOnly: false },
      { title: "Templates & Forms", url: "/admin/templates", icon: FileSignature, adminOnly: false },
      { title: "DocuDex Pro", url: "/admin/docudex-pro", icon: FileEdit, adminOnly: false },
      { title: "Content Workspace", url: "/admin/content-workspace", icon: PenTool, adminOnly: true },
      { title: "Apostille", url: "/admin/apostille", icon: Package, adminOnly: true },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, adminOnly: true },
      { title: "Email Management", url: "/admin/email-management", icon: Mail, adminOnly: true },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Revenue", url: "/admin/revenue", icon: DollarSign, adminOnly: true },
      { title: "Services Catalog", url: "/admin/services", icon: ShoppingBag, adminOnly: true },
    ],
  },
  {
    label: "Compliance & Journal",
    items: [
      { title: "Journal", url: "/admin/journal", icon: BookMarked, adminOnly: false },
      { title: "Compliance Report", url: "/admin/compliance-report", icon: ShieldCheck, adminOnly: true },
      { title: "Audit Log", url: "/admin/audit-log", icon: ScrollText, adminOnly: true },
    ],
  },
  {
    label: "System",
    items: [
      { title: "AI Assistant", url: "/admin/ai-assistant", icon: Bot, adminOnly: false },
      { title: "Team & Invites", url: "/admin/team", icon: UserPlus, adminOnly: true },
      { title: "Webhooks", url: "/admin/webhooks", icon: Webhook, adminOnly: true },
      { title: "Integration Testing", url: "/admin/integrations", icon: Plug, adminOnly: true },
      { title: "User Management", url: "/admin/users", icon: Shield, adminOnly: true },
      { title: "Build Tracker", url: "/admin/build-tracker", icon: Bug, adminOnly: true },
      { title: "Resources", url: "/admin/resources", icon: BookOpen, adminOnly: false },
      { title: "Settings", url: "/admin/settings", icon: Settings, adminOnly: true },
    ],
  },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, isAdmin } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-sans text-sm font-semibold text-sidebar-foreground">{isAdmin ? "Admin Panel" : "Notary Panel"}</span>}
        </div>
        {sidebarGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-sidebar-foreground/50">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end={item.url === "/admin"}
                          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold">
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
        <div className="mt-auto p-4">
          <Link to="/portal" className="mb-2 block">
            <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <Eye className="mr-2 h-4 w-4" />{!collapsed && "Client View"}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <LogOut className="mr-2 h-4 w-4" />{!collapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminDashboard() {
  usePageMeta({ title: "Admin Dashboard", noIndex: true });
  const { isAdmin } = useAuth();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Skip to main content */}
        <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none">
          Skip to main content
        </a>
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex h-12 items-center justify-between border-b border-border/50 bg-background px-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <span className="ml-4 font-sans text-sm font-medium text-muted-foreground">
                Notar — {isAdmin ? "Admin" : "Notary"}
              </span>
              <kbd className="ml-3 hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <div className="flex items-center gap-1">
              <AdminNotificationCenter />
              <DarkModeToggle />
            </div>
          </header>
          <main id="admin-main" className="flex-1 overflow-auto p-6"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
