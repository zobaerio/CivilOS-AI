import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import ScrollToTop from "./components/ScrollToTop";
import AppLoading from "./components/AppLoading";
import InstallCivilOS from "./components/InstallCivilOS";
import { PwaProvider } from "@/lib/pwa";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const UploadPage = lazy(() => import("./pages/UploadPage.tsx"));
const EstimatePage = lazy(() => import("./pages/EstimatePage.tsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage.tsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.tsx"));
const SponsorPage = lazy(() => import("./pages/SponsorPage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const SharedEstimatePage = lazy(() => import("./pages/SharedEstimatePage.tsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage.tsx"));
const FileAssistantPage = lazy(() => import("./pages/FileAssistantPage.tsx"));
const BOQGeneratorPage = lazy(() => import("./pages/BOQGeneratorPage.tsx"));
const TenderAnalysisPage = lazy(() => import("./pages/TenderAnalysisPage.tsx"));
const SiteDiaryPage = lazy(() => import("./pages/SiteDiaryPage.tsx"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage.tsx"));
const AIEngineerPage = lazy(() => import("./pages/AIEngineerPage.tsx"));
const BOQHubPage = lazy(() => import("./pages/BOQHubPage.tsx"));
const RateAnalysisPage = lazy(() => import("./pages/RateAnalysisPage.tsx"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage.tsx"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.tsx"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage.tsx"));
const AffiliatePage = lazy(() => import("./pages/AffiliatePage.tsx"));
const AdminAffiliatePage = lazy(() => import("./pages/AdminAffiliatePage.tsx"));
const InviteAcceptPage = lazy(() => import("./pages/InviteAcceptPage.tsx"));
const ModulesPage = lazy(() => import("./pages/ModulesPage.tsx"));
const BillingPage = lazy(() => import("./pages/BillingPage.tsx"));
const AdminBillingPage = lazy(() => import("./pages/AdminBillingPage.tsx"));



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <ThemeProvider>
        <PwaProvider>
        <AuthProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <InstallCivilOS />
            <Suspense fallback={<AppLoading compact />}>
              <Routes>

              <Route path="/" element={<Index />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/estimate/demo" element={<EstimatePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/modules" element={<ModulesPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/ai-engineer" element={<AIEngineerPage />} />
              <Route path="/boq-hub" element={<BOQHubPage />} />
              <Route path="/rate-analysis" element={<RateAnalysisPage />} />
              <Route path="/file-assistant" element={<FileAssistantPage />} />
              <Route path="/boq" element={<BOQGeneratorPage />} />
              <Route path="/tender" element={<TenderAnalysisPage />} />
              <Route path="/site-diary" element={<SiteDiaryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/sponsor" element={<SponsorPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
              <Route path="/affiliate" element={<AffiliatePage />} />
              <Route path="/admin/affiliate" element={<AdminAffiliatePage />} />
              <Route path="/invite" element={<InviteAcceptPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/admin/billing" element={<AdminBillingPage />} />
              <Route path="/share/:token" element={<SharedEstimatePage />} />
              {/* Coming Soon stubs */}
              {[
                "ai-writer","ai-drawing","bbs","material-calc",
                "progress-reports","inspections","site-photos","tender-docs","bid-prep",
                "inventory","requisitions","purchase-orders","vendors","equipment",
                "invoices","contractor-bills","payments","cash-flow",
                "analytics","ai-insights","reports","company-settings",
              ].map((p) => (
                <Route key={p} path={`/${p}`} element={<ComingSoonPage />} />
              ))}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
        </PwaProvider>
      </ThemeProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
