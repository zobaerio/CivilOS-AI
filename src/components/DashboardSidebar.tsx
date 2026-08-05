import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight, Lock, Wrench, Sparkles, CreditCard } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/lib/subscription";
import {
  topNav, bottomNav, constructionTools, analyticsNav, settingsNav,
  findActiveCategory, type NavCategory,
} from "@/lib/navigation";
import aiLogo from "@/assets/ai-logo.png";
import InstallCivilOS from "@/components/InstallCivilOS";

function CategoryGroup({
  cat, collapsed, pathname, locked,
}: { cat: NavCategory; collapsed: boolean; pathname: string; locked: (f?: string) => boolean }) {
  const active = cat.items.some((i) => i.url === pathname);
  const [open, setOpen] = useState(active);
  useEffect(() => { if (active) setOpen(true); }, [active]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={active && !open} tooltip={cat.label} className="justify-between">
            <span className="flex items-center gap-2 min-w-0">
              <cat.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{cat.label}</span>}
            </span>
            {!collapsed && (
              <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {!collapsed && (
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <SidebarMenuSub>
              {cat.items.map((item) => (
                <SidebarMenuSubItem key={item.url + item.title}>
                  <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                    <NavLink to={item.url} className="flex items-center justify-between gap-2">
                      <span className="truncate">{item.title}</span>
                      {locked(item.feature) && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { plan, hasFeature } = useSubscription();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const locked = (feature?: string) => !!feature && !hasFeature(feature);
  const toolsActive = findActiveCategory(pathname) !== null;
  const [toolsOpen, setToolsOpen] = useState(toolsActive);
  useEffect(() => { if (toolsActive) setToolsOpen(true); }, [toolsActive]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <img src={aiLogo} alt="CivilOS AI" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold leading-tight truncate">CivilOS AI</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">
                The AI Operating System for Civil Engineers
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">Workspace</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={collapsed ? true : toolsOpen} onOpenChange={setToolsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Construction Tools" className="justify-between font-medium">
                      <span className="flex items-center gap-2 min-w-0">
                        <Wrench className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">Construction Tools</span>}
                      </span>
                      {!collapsed && (
                        <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${toolsOpen ? "rotate-90" : ""}`} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <SidebarMenu className={collapsed ? "" : "ml-2 border-l pl-1"}>
                      {constructionTools.map((cat) => (
                        <CategoryGroup key={cat.label} cat={cat} collapsed={collapsed} pathname={pathname} locked={locked} />
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <CategoryGroup cat={analyticsNav} collapsed={collapsed} pathname={pathname} locked={locked} />

              {bottomNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <CategoryGroup
                cat={{ ...settingsNav, items: settingsNav.items.filter((i) => !i.adminOnly || isAdmin) }}
                collapsed={collapsed} pathname={pathname} locked={locked}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="p-3 mt-auto">
            <div className="space-y-2">
            <InstallCivilOS triggerOnly />
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> {plan?.name || "Free"} plan
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Unlock AI Drawing, AI Writer, analytics & team seats.
              </p>
              <NavLink to="/billing" className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline">
                <CreditCard className="h-3 w-3" /> Plans &amp; Billing
              </NavLink>
            </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
