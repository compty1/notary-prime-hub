import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Users, Clock, FileText, ScrollText, BookOpen, Bot, BookMarked, LogOut, Shield, Settings, DollarSign, Eye, FileSignature, Package, MessageSquare, Building2, ShoppingBag, Mail, UserPlus, Target, GraduationCap, Plug, ClipboardList, PenTool, ListChecks, Handshake, Bug, TrendingUp, ShieldCheck, Webhook, FileEdit, Workflow, Globe } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { AdminNotificationCenter } from "@/components/AdminNotificationCenter";
import { Logo } from "@/components/Logo";

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
      { title: "Notary Pages", url: "/admin/notary-pages", icon: Globe, adminOnly: true },
      { title: "Professionals", url: "/admin/professionals", icon: Users, adminOnly: true },
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
    <Sidebar collapsible="icon" className="border-r-0 bg-[#212529]">
      <SidebarContent className="bg-[#212529]" role="navigation" aria-label="Admin navigation">
        {/* Logo + title */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
          <Logo size="sm" showText={!collapsed} theme="dark" />
        </div>

        {sidebarGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end={item.url === "/admin"}
                          className="text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all"
                          activeClassName="bg-primary text-white shadow-lg shadow-primary/20 font-bold">
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        <div className="mt-auto p-4 border-t border-white/10">
          <Link to="/portal" className="mb-2 block">
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl">
              <Eye className="mr-2 h-4 w-4" />{!collapsed && "Client View"}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl">
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
        <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none">
          Skip to main content
        </a>
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
            <div className="flex items-center">
              <SidebarTrigger />
              <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {isAdmin ? "Admin Panel" : "Notary Panel"}
              </span>
              <kbd className="ml-3 hidden sm:inline-flex items-center gap-1 rounded-lg border border-border bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <div className="flex items-center gap-1">
              <AdminNotificationCenter />
              <DarkModeToggle />
            </div>
          </header>
          <main id="admin-main" className="flex-1 overflow-auto p-6 bg-muted"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
