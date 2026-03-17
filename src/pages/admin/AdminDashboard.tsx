import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Users, Clock, FileText, ScrollText, BookOpen, Bot, BookMarked, LogOut, Shield, Settings, DollarSign, Eye, FileSignature, Package, MessageSquare, Building2, ShoppingBag, Mail, UserPlus, Target } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const adminNavItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, adminOnly: false },
  { title: "Appointments", url: "/admin/appointments", icon: Calendar, adminOnly: false },
  { title: "Clients", url: "/admin/clients", icon: Users, adminOnly: true },
  { title: "Business Clients", url: "/admin/business-clients", icon: Building2, adminOnly: true },
  { title: "Services Catalog", url: "/admin/services", icon: ShoppingBag, adminOnly: true },
  { title: "Availability", url: "/admin/availability", icon: Clock, adminOnly: true },
  { title: "Documents", url: "/admin/documents", icon: FileText, adminOnly: false },
  { title: "Templates & Forms", url: "/admin/templates", icon: FileSignature, adminOnly: false },
  { title: "Apostille", url: "/admin/apostille", icon: Package, adminOnly: true },
  { title: "Email Management", url: "/admin/email-management", icon: Mail, adminOnly: true },
  { title: "Live Chat", url: "/admin/chat", icon: MessageSquare, adminOnly: true },
  { title: "Journal", url: "/admin/journal", icon: BookMarked, adminOnly: false },
  { title: "Revenue", url: "/admin/revenue", icon: DollarSign, adminOnly: true },
  { title: "Team & Invites", url: "/admin/team", icon: UserPlus, adminOnly: true },
  { title: "Resources", url: "/admin/resources", icon: BookOpen, adminOnly: false },
  { title: "AI Assistant", url: "/admin/ai-assistant", icon: Bot, adminOnly: false },
  { title: "Audit Log", url: "/admin/audit-log", icon: ScrollText, adminOnly: true },
  { title: "Settings", url: "/admin/settings", icon: Settings, adminOnly: true },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, isAdmin } = useAuth();

  const visibleNav = adminNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-primary">
            <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="font-display text-sm font-bold text-sidebar-foreground">{isAdmin ? "Admin Panel" : "Notary Panel"}</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/admin"}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
  const { isAdmin } = useAuth();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex h-12 items-center justify-between border-b border-border/50 bg-background px-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <span className="ml-4 font-display text-sm font-medium text-muted-foreground">
                Shane Goble Notary — {isAdmin ? "Admin" : "Notary"}
              </span>
            </div>
            <DarkModeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
