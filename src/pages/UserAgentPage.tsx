import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { Bot } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import AgentConsole from "@/components/agent/AgentConsole";

export default function UserAgentPage() {
  const { user, loading } = useAuth() as any;
  const { lang } = useI18n();
  const T = (en: string, bn: string) => (lang === "bn" ? bn : en);
  if (!loading && !user) return <Navigate to="/auth" replace />;
  return (
    <SidebarProvider>
      <SEO title="AI Agent — CivilOS AI" description="Your personal CivilOS AI agent: turn features on or off, check your plan, projects and settings in Bangla or English." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger />
              <h1 className="font-heading font-semibold flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> {T("AI Agent", "এআই এজেন্ট")}</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="p-4 md:p-6 space-y-3 min-w-0 max-w-4xl w-full mx-auto">
            <p className="text-sm text-muted-foreground">{T("Works only on your own account. Every action is checked and recorded.", "শুধু আপনার নিজের অ্যাকাউন্টে কাজ করে। প্রতিটি কাজ যাচাই ও রেকর্ড করা হয়।")}</p>
            <AgentConsole agentType="user" examples={["আমার available features দেখাও", "BIM Studio চালু আছে?", "Notifications বন্ধ করো", "আমার projectগুলো দেখাও", "আমার plan কী?"]} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
