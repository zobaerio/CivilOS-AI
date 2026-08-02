import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, Bell, Bot, FileSearch, PenTool, Ruler,
  Calculator, ClipboardList, Hammer, Camera, ClipboardCheck, FileText,
  Package, ShoppingCart, Truck, Wrench, Receipt, Wallet, TrendingUp,
  BarChart3, Lightbulb, FileBarChart, User, Building2, Shield, Sparkles,
  Upload,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import aiLogo from "@/assets/ai-logo.png";

type Item = { title: string; url: string; icon: any };
type Group = { label: string; items: Item[] };

const groups: Group[] = [
  { label: "📊 Overview", items: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "All Modules", url: "/modules", icon: Sparkles },
    { title: "My Projects", url: "/projects", icon: FolderOpen },
    { title: "Notifications", url: "/notifications", icon: Bell },
  ]},
  { label: "🤖 AI Workspace", items: [
    { title: "AI Engineering Assistant", url: "/ai-engineer", icon: Bot },
    { title: "AI Engineer Chat", url: "/ai-assistant", icon: Bot },
    { title: "File AI Analyzer", url: "/file-assistant", icon: FileSearch },
    { title: "AI Office Writer", url: "/ai-writer", icon: PenTool },
    { title: "AI Drawing Reader", url: "/ai-drawing", icon: Ruler },
  ]},
  { label: "📐 Quantity Surveying", items: [
    { title: "BOQ Hub", url: "/boq-hub", icon: Calculator },
    { title: "BOQ Generator (Lite)", url: "/boq", icon: Calculator },
    { title: "Rate Analysis", url: "/rate-analysis", icon: ClipboardList },
    { title: "BBS Generator", url: "/bbs", icon: Ruler },
    { title: "Material Calculator", url: "/material-calc", icon: Calculator },
  ]},
  { label: "🏗️ Site Management", items: [
    { title: "Site Diary", url: "/site-diary", icon: Hammer },
    { title: "Progress Reports", url: "/progress-reports", icon: ClipboardCheck },
    { title: "Site Inspections", url: "/inspections", icon: ClipboardCheck },
    { title: "Photo Upload", url: "/site-photos", icon: Camera },
  ]},
  { label: "📋 Tender", items: [
    { title: "Tender Analyzer", url: "/tender", icon: ClipboardList },
    { title: "Document Checker", url: "/tender-docs", icon: FileText },
    { title: "Bid Preparation", url: "/bid-prep", icon: FileText },
  ]},
  { label: "🏭 Construction ERP", items: [
    { title: "Inventory", url: "/inventory", icon: Package },
    { title: "Requisitions", url: "/requisitions", icon: ClipboardList },
    { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
    { title: "Vendors", url: "/vendors", icon: Truck },
    { title: "Equipment", url: "/equipment", icon: Wrench },
  ]},
  { label: "💰 Finance", items: [
    { title: "Invoices", url: "/invoices", icon: Receipt },
    { title: "Contractor Bills", url: "/contractor-bills", icon: Receipt },
    { title: "Payments", url: "/payments", icon: Wallet },
    { title: "Cash Flow", url: "/cash-flow", icon: TrendingUp },
  ]},
  { label: "📊 Analytics", items: [
    { title: "Project Analytics", url: "/analytics", icon: BarChart3 },
    { title: "AI Insights", url: "/ai-insights", icon: Lightbulb },
    { title: "Reports Center", url: "/reports", icon: FileBarChart },
  ]},
  { label: "⚙️ Settings", items: [
    { title: "Profile", url: "/profile", icon: User },
    { title: "Company Settings", url: "/company-settings", icon: Building2 },
    { title: "Notification Settings", url: "/settings/notifications", icon: Bell },
    { title: "Affiliate Program", url: "/affiliate", icon: Sparkles },
    { title: "Admin Dashboard", url: "/admin", icon: Shield },
    { title: "New Estimate", url: "/upload", icon: Upload },
  ]},
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (p: string) => pathname === p;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <img src={aiLogo} alt="CivilOS AI" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold leading-tight truncate">CivilOS AI</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">v1.0 · AI OS for Civil Engineers</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
        ))}

        {!collapsed && (
          <div className="p-3">
            <div className="rounded-lg border bg-gradient-to-br from-accent/10 to-primary/10 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Upgrade Plan
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Unlock unlimited AI queries, exports & team seats.
              </p>
              <NavLink to="/#pricing" className="block text-[11px] font-semibold text-accent hover:underline">
                View pricing →
              </NavLink>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
