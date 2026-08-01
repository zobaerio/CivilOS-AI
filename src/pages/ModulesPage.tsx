import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import SEO from "@/components/SEO";
import {
  LayoutDashboard, FolderOpen, Bell, Bot, FileSearch, PenTool, Ruler,
  Calculator, ClipboardList, Hammer, Camera, ClipboardCheck, FileText,
  Package, ShoppingCart, Truck, Wrench, Receipt, Wallet, TrendingUp,
  BarChart3, Lightbulb, FileBarChart, User, Building2, Shield, Sparkles,
  Upload, Search, ArrowRight,
} from "lucide-react";

type Mod = { title: string; bn: string; url: string; icon: any; live?: boolean };
type Group = { label: string; bn: string; items: Mod[] };

const GROUPS: Group[] = [
  { label: "Overview", bn: "সারসংক্ষেপ", items: [
    { title: "Dashboard", bn: "ড্যাশবোর্ড", url: "/dashboard", icon: LayoutDashboard, live: true },
    { title: "My Projects", bn: "আমার প্রজেক্ট", url: "/projects", icon: FolderOpen, live: true },
    { title: "Notifications", bn: "নোটিফিকেশন", url: "/notifications", icon: Bell, live: true },
    { title: "New Estimate", bn: "নতুন এস্টিমেট", url: "/upload", icon: Upload, live: true },
  ]},
  { label: "AI Workspace", bn: "এআই ওয়ার্কস্পেস", items: [
    { title: "AI Engineering Assistant", bn: "এআই ইঞ্জিনিয়ারিং সহকারী", url: "/ai-engineer", icon: Bot, live: true },
    { title: "AI Engineer Chat", bn: "এআই চ্যাট", url: "/ai-assistant", icon: Bot, live: true },
    { title: "File AI Analyzer", bn: "ফাইল বিশ্লেষক", url: "/file-assistant", icon: FileSearch, live: true },
    { title: "AI Office Writer", bn: "অফিস রাইটার", url: "/ai-writer", icon: PenTool },
    { title: "AI Drawing Reader", bn: "ড্রয়িং রিডার", url: "/ai-drawing", icon: Ruler },
  ]},
  { label: "Quantity Surveying", bn: "কোয়ান্টিটি সার্ভে", items: [
    { title: "BOQ Hub", bn: "বিওকিউ হাব", url: "/boq-hub", icon: Calculator, live: true },
    { title: "BOQ Generator (Lite)", bn: "বিওকিউ জেনারেটর", url: "/boq", icon: Calculator, live: true },
    { title: "Rate Analysis", bn: "রেট অ্যানালাইসিস", url: "/rate-analysis", icon: ClipboardList, live: true },
    { title: "BBS Generator", bn: "বার বেন্ডিং শিডিউল", url: "/bbs", icon: Ruler },
    { title: "Material Calculator", bn: "ম্যাটেরিয়াল ক্যালকুলেটর", url: "/material-calc", icon: Calculator },
  ]},
  { label: "Site Management", bn: "সাইট ম্যানেজমেন্ট", items: [
    { title: "Site Diary", bn: "সাইট ডায়েরি", url: "/site-diary", icon: Hammer, live: true },
    { title: "Progress Reports", bn: "প্রোগ্রেস রিপোর্ট", url: "/progress-reports", icon: ClipboardCheck },
    { title: "Site Inspections", bn: "সাইট ইন্সপেকশন", url: "/inspections", icon: ClipboardCheck },
    { title: "Photo Upload", bn: "সাইট ফটো", url: "/site-photos", icon: Camera },
  ]},
  { label: "Tender", bn: "টেন্ডার", items: [
    { title: "Tender Analyzer", bn: "টেন্ডার বিশ্লেষণ", url: "/tender", icon: ClipboardList, live: true },
    { title: "Document Checker", bn: "ডকুমেন্ট চেকার", url: "/tender-docs", icon: FileText },
    { title: "Bid Preparation", bn: "বিড প্রস্তুতি", url: "/bid-prep", icon: FileText },
  ]},
  { label: "Construction ERP", bn: "কনস্ট্রাকশন ইআরপি", items: [
    { title: "Inventory", bn: "ইনভেন্টরি", url: "/inventory", icon: Package },
    { title: "Requisitions", bn: "রিকুইজিশন", url: "/requisitions", icon: ClipboardList },
    { title: "Purchase Orders", bn: "পারচেজ অর্ডার", url: "/purchase-orders", icon: ShoppingCart },
    { title: "Vendors", bn: "ভেন্ডর", url: "/vendors", icon: Truck },
    { title: "Equipment", bn: "ইকুইপমেন্ট", url: "/equipment", icon: Wrench },
  ]},
  { label: "Finance", bn: "অর্থব্যবস্থাপনা", items: [
    { title: "Invoices", bn: "ইনভয়েস", url: "/invoices", icon: Receipt },
    { title: "Contractor Bills", bn: "কন্ট্রাক্টর বিল", url: "/contractor-bills", icon: Receipt },
    { title: "Payments", bn: "পেমেন্ট", url: "/payments", icon: Wallet },
    { title: "Cash Flow", bn: "ক্যাশ ফ্লো", url: "/cash-flow", icon: TrendingUp },
  ]},
  { label: "Analytics", bn: "অ্যানালিটিক্স", items: [
    { title: "Project Analytics", bn: "প্রজেক্ট অ্যানালিটিক্স", url: "/analytics", icon: BarChart3 },
    { title: "AI Insights", bn: "এআই ইনসাইট", url: "/ai-insights", icon: Lightbulb },
    { title: "Reports Center", bn: "রিপোর্ট সেন্টার", url: "/reports", icon: FileBarChart },
  ]},
  { label: "Settings & Growth", bn: "সেটিংস", items: [
    { title: "Profile", bn: "প্রোফাইল", url: "/profile", icon: User, live: true },
    { title: "Company Settings", bn: "কোম্পানি সেটিংস", url: "/company-settings", icon: Building2 },
    { title: "Notification Settings", bn: "নোটিফিকেশন সেটিংস", url: "/settings/notifications", icon: Bell, live: true },
    { title: "Affiliate Program", bn: "অ্যাফিলিয়েট প্রোগ্রাম", url: "/affiliate", icon: Sparkles, live: true },
    { title: "Admin Dashboard", bn: "অ্যাডমিন", url: "/admin", icon: Shield, live: true },
  ]},
];

export default function ModulesPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => i.title.toLowerCase().includes(s) || i.bn.includes(s) || i.url.includes(s)
      ),
    })).filter((g) => g.items.length > 0);
  }, [q]);

  const total = GROUPS.reduce((n, g) => n + g.items.length, 0);
  const liveCount = GROUPS.reduce((n, g) => n + g.items.filter((i) => i.live).length, 0);

  return (
    <SidebarProvider>
      <SEO
        title="All Modules — CivilOS AI Workspace"
        description="সব CivilOS AI মডিউল এক জায়গায় — BOQ, রেট অ্যানালাইসিস, সাইট ম্যানেজমেন্ট, টেন্ডার, ইআরপি, ফাইন্যান্স ও অ্যানালিটিক্স।"
      />
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center gap-2 px-3 sticky top-0 bg-background/80 backdrop-blur z-10">
            <SidebarTrigger />
            <span className="font-heading font-semibold text-sm truncate">All Modules</span>
            <div className="ml-auto flex items-center gap-1">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-6">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5 md:p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative space-y-3">
                <Badge variant="outline" className="border-accent/40 text-accent">
                  <Sparkles className="h-3 w-3 mr-1" /> CivilOS AI Workspace
                </Badge>
                <h1 className="font-heading text-xl md:text-3xl font-bold leading-tight">
                  সব মডিউল এক জায়গায়
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
                  {total} টি মডিউল · {liveCount} টি এখনই ব্যবহারযোগ্য — এস্টিমেশন থেকে ইআরপি পর্যন্ত পুরো সিভিল ইঞ্জিনিয়ারিং ওয়ার্কফ্লো।
                </p>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="মডিউল খুঁজুন… (BOQ, rate, tender)"
                    className="pl-9 bg-background/70"
                  />
                </div>
              </div>
            </section>

            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">কোনো মডিউল পাওয়া যায়নি।</p>
            )}

            {filtered.map((g) => (
              <section key={g.label} className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <h2 className="font-heading text-sm md:text-base font-bold">{g.label}</h2>
                  <span className="text-[11px] text-muted-foreground">{g.bn}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{g.items.length}</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {g.items.map((m) => (
                    <Link
                      key={m.url}
                      to={m.url}
                      className="group relative rounded-xl border bg-card p-3 md:p-4 hover:border-accent/50 hover:shadow-lg transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/5 group-hover:to-primary/5 transition-colors" />
                      <div className="relative space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <m.icon className="h-4 w-4 text-accent" />
                          </div>
                          {m.live ? (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-green-500/40 text-green-600">Live</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">Soon</Badge>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs md:text-sm leading-tight truncate">{m.title}</p>
                          <p className="text-[10px] md:text-[11px] text-muted-foreground truncate">{m.bn}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                          খুলুন <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
