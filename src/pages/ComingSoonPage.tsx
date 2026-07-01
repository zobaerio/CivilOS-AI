import { useParams, Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { Sparkles, ArrowLeft, Rocket } from "lucide-react";
import SEO from "@/components/SEO";

const LABELS: Record<string, { title: string; desc: string }> = {
  "/notifications": { title: "Notification Center", desc: "All your alerts, system messages, and project updates." },
  "/ai-writer": { title: "AI Office Writer", desc: "Generate letters, memos, and technical documents with AI." },
  "/ai-drawing": { title: "AI Drawing Reader", desc: "Upload CAD drawings and extract dimensions, quantities, and specs." },
  "/rate-analysis": { title: "Rate Analysis", desc: "PWD/LGED-compliant rate analysis for every BOQ item." },
  "/bbs": { title: "Bar Bending Schedule (BBS)", desc: "Auto-generate bar bending schedules from RCC drawings." },
  "/material-calc": { title: "Material Calculator", desc: "Cement, sand, aggregate, steel — quick per-item calculators." },
  "/progress-reports": { title: "Progress Reports", desc: "Weekly and monthly site progress reports for clients." },
  "/inspections": { title: "Site Inspections", desc: "Digital inspection checklists with photo evidence and sign-off." },
  "/site-photos": { title: "Photo Upload", desc: "Geo-tagged site photos organized by date and activity." },
  "/tender-docs": { title: "Tender Document Checker", desc: "AI verification of tender document completeness and compliance." },
  "/bid-prep": { title: "Bid Preparation", desc: "Assemble competitive bids with AI-suggested pricing strategy." },
  "/inventory": { title: "Inventory", desc: "Track cement, rod, brick and site materials in real time." },
  "/requisitions": { title: "Requisitions", desc: "Site-to-office material request workflow." },
  "/purchase-orders": { title: "Purchase Orders", desc: "Issue and track POs to vendors with approval flow." },
  "/vendors": { title: "Vendor Management", desc: "Vendor directory, ratings, and payment history." },
  "/equipment": { title: "Equipment Register", desc: "Track machinery, maintenance, and rental logs." },
  "/invoices": { title: "Invoices", desc: "Client invoicing with VAT/AIT and BDT formatting." },
  "/contractor-bills": { title: "Contractor Bills", desc: "Running & final bills with measurement sheets." },
  "/payments": { title: "Payments", desc: "Payment tracking, receipts, and reconciliation." },
  "/cash-flow": { title: "Cash Flow", desc: "Real-time cash flow projections per project." },
  "/analytics": { title: "Project Analytics", desc: "KPIs, cost variance, and schedule performance." },
  "/ai-insights": { title: "AI Insights", desc: "AI-generated recommendations based on your project data." },
  "/reports": { title: "Reports Center", desc: "Export any report as PDF, Excel, or CSV." },
  "/company-settings": { title: "Company Settings", desc: "Logo, letterhead, VAT number, and default rates." },
};

export default function ComingSoonPage() {
  const location = useLocation();
  const info = LABELS[location.pathname] || { title: "Module", desc: "This module is coming soon." };

  return (
    <>
      <SEO title={info.title} description={info.desc} />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 h-14 flex items-center gap-2 border-b bg-background/95 backdrop-blur px-3 md:px-6">
              <SidebarTrigger />
              <h1 className="flex-1 font-heading text-base md:text-lg font-semibold truncate">{info.title}</h1>
              <NotificationBell />
              <ThemeToggle />
            </header>
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
              <div className="max-w-md w-full text-center space-y-4 rounded-2xl border bg-card p-8 shadow-sm">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <Rocket className="h-7 w-7 text-accent" />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-medium">
                  <Sparkles className="h-3 w-3" /> Coming Soon
                </div>
                <h2 className="font-heading text-xl md:text-2xl font-bold">{info.title}</h2>
                <p className="text-sm text-muted-foreground">{info.desc}</p>
                <div className="pt-2 flex gap-2 justify-center">
                  <Button variant="outline" asChild><Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Link></Button>
                  <Button asChild><Link to="/ai-assistant">Try AI Chat</Link></Button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
