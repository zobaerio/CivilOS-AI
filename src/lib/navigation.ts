import {
  LayoutDashboard, FolderOpen, Bell, Users, CreditCard, Settings, Wrench,
  Sparkles, Calculator, FileText, HardHat, ShoppingCart, Wallet, BarChart3,
  Bot, FileSearch, PenTool, Ruler, ClipboardList, Camera, ClipboardCheck,
  Package, Truck, Receipt, TrendingUp, Lightbulb, FileBarChart, User,
  Building2, Shield, Upload, Hammer,
} from "lucide-react";

export type NavLeaf = {
  title: string;
  url: string;
  icon: any;
  /** feature key from plan limits; when set and the plan disables it, show a lock */
  feature?: string;
  adminOnly?: boolean;
};

export type NavCategory = {
  label: string;
  icon: any;
  items: NavLeaf[];
};

/** Top-level items shown before the grouped tools section */
export const topNav: NavLeaf[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderOpen },
];

/** Everything construction-related lives inside this single grouped section */
export const constructionTools: NavCategory[] = [
  {
    label: "AI Tools",
    icon: Sparkles,
    items: [
      { title: "AI Engineering Assistant", url: "/ai-engineer", icon: Bot },
      { title: "AI Engineer Chat", url: "/ai-assistant", icon: Bot },
      { title: "File AI Analyzer", url: "/file-assistant", icon: FileSearch },
      { title: "AI Writer", url: "/ai-writer", icon: PenTool, feature: "ai_writer" },
      { title: "AI Drawing", url: "/ai-drawing", icon: Ruler, feature: "ai_drawing" },
      { title: "AI Insights", url: "/ai-insights", icon: Lightbulb, feature: "ai_insights" },
    ],
  },
  {
    label: "Estimation & Quantity",
    icon: Calculator,
    items: [
      { title: "Building Estimate", url: "/upload", icon: Upload },
      { title: "BOQ Hub", url: "/boq-hub", icon: Calculator },
      { title: "BOQ Generator (Lite)", url: "/boq", icon: Calculator },
      { title: "Rate Analysis", url: "/rate-analysis", icon: ClipboardList },
      { title: "BBS Generator", url: "/bbs", icon: Ruler },
      { title: "Material Calculator", url: "/material-calc", icon: Calculator },
    ],
  },
  {
    label: "Tender & Bidding",
    icon: FileText,
    items: [
      { title: "Tender Analyzer", url: "/tender", icon: ClipboardList, feature: "tender" },
      { title: "Tender Documents", url: "/tender-docs", icon: FileText, feature: "tender" },
      { title: "Bid Preparation", url: "/bid-prep", icon: FileText, feature: "tender" },
    ],
  },
  {
    label: "Site Management",
    icon: HardHat,
    items: [
      { title: "Site Diary", url: "/site-diary", icon: Hammer },
      { title: "Progress Reports", url: "/progress-reports", icon: ClipboardCheck },
      { title: "Inspections", url: "/inspections", icon: ClipboardCheck },
      { title: "Site Photos", url: "/site-photos", icon: Camera },
      { title: "Equipment", url: "/equipment", icon: Wrench },
    ],
  },
  {
    label: "Procurement",
    icon: ShoppingCart,
    items: [
      { title: "Inventory", url: "/inventory", icon: Package, feature: "procurement" },
      { title: "Requisitions", url: "/requisitions", icon: ClipboardList, feature: "procurement" },
      { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart, feature: "procurement" },
      { title: "Vendors", url: "/vendors", icon: Truck, feature: "procurement" },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    items: [
      { title: "Invoices", url: "/invoices", icon: Receipt, feature: "finance" },
      { title: "Contractor Bills", url: "/contractor-bills", icon: Receipt, feature: "finance" },
      { title: "Payments", url: "/payments", icon: Wallet, feature: "finance" },
      { title: "Cash Flow", url: "/cash-flow", icon: TrendingUp, feature: "finance" },
    ],
  },
];

export const analyticsNav: NavCategory = {
  label: "Analytics & Reports",
  icon: BarChart3,
  items: [
    { title: "Project Analytics", url: "/analytics", icon: BarChart3, feature: "analytics" },
    { title: "Reports Center", url: "/reports", icon: FileBarChart, feature: "analytics" },
  ],
};

export const settingsNav: NavCategory = {
  label: "Settings",
  icon: Settings,
  items: [
    { title: "Profile", url: "/profile", icon: User },
    { title: "Company Settings", url: "/company-settings", icon: Building2 },
    { title: "Notification Settings", url: "/settings/notifications", icon: Bell },
    { title: "Affiliate Program", url: "/affiliate", icon: Sparkles },
    { title: "All Modules", url: "/modules", icon: Wrench },
    { title: "Admin Dashboard", url: "/admin", icon: Shield, adminOnly: true },
    { title: "Admin · Payments", url: "/admin/billing", icon: CreditCard, adminOnly: true },
  ],
};

export const bottomNav: NavLeaf[] = [
  { title: "Team", url: "/projects", icon: Users },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Plans & Billing", url: "/billing", icon: CreditCard },
];

export const allToolCategories: NavCategory[] = [...constructionTools, analyticsNav];

export function findActiveCategory(pathname: string): string | null {
  for (const cat of allToolCategories) {
    if (cat.items.some((i) => i.url === pathname)) return cat.label;
  }
  if (settingsNav.items.some((i) => i.url === pathname)) return settingsNav.label;
  return null;
}
