import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Users, Clock, FileText, ScrollText, BookOpen, Bot, BookMarked, LogOut, Shield, Settings, DollarSign, Eye, FileSignature, Package, MessageSquare, Building2, ShoppingBag } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Appointments", url: "/admin/appointments", icon: Calendar },
  { title: "Clients", url: "/admin/clients", icon: Users },
  { title: "Business Clients", url: "/admin/business-clients", icon: Building2 },
  { title: "Services Catalog", url: "/admin/services", icon: ShoppingBag },
  { title: "Availability", url: "/admin/availability", icon: Clock },
  { title: "Documents", url: "/admin/documents", icon: FileText },
  { title: "Templates & Forms", url: "/admin/templates", icon: FileSignature },
  { title: "Apostille", url: "/admin/apostille", icon: Package },
  { title: "Live Chat", url: "/admin/chat", icon: MessageSquare },
  { title: "Journal", url: "/admin/journal", icon: BookMarked },
  { title: "Revenue", url: "/admin/revenue", icon: DollarSign },
  { title: "Resources", url: "/admin/resources", icon: BookOpen },
  { title: "AI Assistant", url: "/admin/ai-assistant", icon: Bot },
  { title: "Audit Log", url: "/admin/audit-log", icon: ScrollText },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-primary">
            <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && <span className="font-display text-sm font-bold text-sidebar-foreground">Admin Panel</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex h-12 items-center justify-between border-b border-border/50 bg-background px-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <span className="ml-4 font-display text-sm font-medium text-muted-foreground">Shane Goble Notary — Admin</span>
            </div>
            <DarkModeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
