import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import UploadPage from "./pages/UploadPage.tsx";
import EstimatePage from "./pages/EstimatePage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ProjectsPage from "./pages/ProjectsPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import SponsorPage from "./pages/SponsorPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import SharedEstimatePage from "./pages/SharedEstimatePage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import AIAssistantPage from "./pages/AIAssistantPage.tsx";
import FileAssistantPage from "./pages/FileAssistantPage.tsx";
import BOQGeneratorPage from "./pages/BOQGeneratorPage.tsx";
import TenderAnalysisPage from "./pages/TenderAnalysisPage.tsx";
import SiteDiaryPage from "./pages/SiteDiaryPage.tsx";
import ScrollToTop from "./components/ScrollToTop";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>

              <Route path="/" element={<Index />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/estimate/demo" element={<EstimatePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/file-assistant" element={<FileAssistantPage />} />
              <Route path="/boq" element={<BOQGeneratorPage />} />
              <Route path="/tender" element={<TenderAnalysisPage />} />
              <Route path="/site-diary" element={<SiteDiaryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/sponsor" element={<SponsorPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/share/:token" element={<SharedEstimatePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
