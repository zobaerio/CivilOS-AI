import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  User,
  FileText,
  Settings,
  Sparkles,
  Bot,
  FileSearch,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import aiLogo from "@/assets/ai-logo.png";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "File Assistant", url: "/file-assistant", icon: FileSearch },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "New Estimate", url: "/upload", icon: Upload },
  { title: "Demo Estimate", url: "/estimate/demo", icon: FileText },
];

const accountItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Home", url: "/", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <img src={aiLogo} alt="CivilOS AI" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold leading-tight truncate">CivilOS AI</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">AI OS for Civil Engineers</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto p-3">
            <div className="rounded-lg border bg-gradient-to-br from-accent/10 to-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Coming soon
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                AI Chat, BOQ Generator, Site Diary & more modules rolling out.
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
