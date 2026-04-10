import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard, FileText, Shield, Clock, FolderOpen, Sparkles, Bell, Package,
  Bot, PenTool, FileEdit, GraduationCap, Stamp, MessageSquare, Mail,
  DollarSign, Star, ShoppingBag, UserPlus, Settings, LogOut, CheckCircle
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

interface ClientSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  profile: { full_name?: string | null; email?: string | null; [key: string]: unknown } | null;
  unreadCount: number;
  onSignOut: () => void;
}

const sidebarGroups = [
  {
    label: "My Sessions",
    items: [
      { key: "overview", label: "Overview", icon: LayoutDashboard },
      { key: "appointments", label: "Active Notarizations", icon: FileText },
      { key: "status", label: "Document Status", icon: Shield },
      { key: "requests", label: "Service Requests", icon: Clock },
    ],
  },
  {
    label: "My Documents",
    items: [
      { key: "documents", label: "Document Library", icon: FolderOpen },
      { key: "reminders", label: "Reminders", icon: Bell },
      { key: "apostille", label: "Apostille Requests", icon: Package },
    ],
  },
  {
    label: "Workspace",
    items: [
      { key: "ai-tools", label: "AI Tools Hub", icon: Bot },
      { key: "link:/docudex", label: "DocuDex Editor", icon: FileEdit },
      { key: "link:/ai-writer", label: "AI Writer", icon: PenTool },
      { key: "link:/resume-builder", label: "Resume Builder", icon: FileText },
      { key: "link:/grants", label: "Grant Generator", icon: GraduationCap },
      { key: "link:/signature-generator", label: "Signature Generator", icon: Stamp },
    ],
  },
  {
    label: "Communication",
    items: [
      { key: "chat", label: "Live Chat", icon: MessageSquare },
      { key: "correspondence", label: "Correspondence", icon: Mail },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "payments", label: "Payments & Billing", icon: DollarSign },
      { key: "reviews", label: "Reviews & Feedback", icon: Star },
      { key: "services", label: "Available Services", icon: ShoppingBag },
      { key: "referral", label: "Refer a Friend", icon: UserPlus },
      { key: "my-page", label: "My Notary Page", icon: CheckCircle },
    ],
  },
];

export function ClientSidebar({ activeSection, onSectionChange, profile, unreadCount, onSignOut }: ClientSidebarProps) {
  const navigate = useNavigate();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" showText theme="dark" />
        </Link>
        {profile && (
          <div className="mt-4">
            <p className="text-sm font-black text-white truncate">{profile.full_name || "Client"}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-0.5">Client Portal</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {sidebarGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-3 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isLink = item.key.startsWith("link:");
                  const isActive = !isLink && activeSection === item.key;
                  const showBadge = item.key === "chat" && unreadCount > 0;

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => {
                          if (isLink) {
                            navigate(item.key.replace("link:", ""));
                          } else {
                            onSectionChange(item.key);
                          }
                        }}
                        className={`rounded-xl transition-all ${
                          isActive
                            ? "bg-[#eab308] text-white shadow-lg shadow-yellow-500/20 font-bold"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                        {showBadge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Verified Client</span>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
