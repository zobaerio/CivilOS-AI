import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/estimate/demo" element={<EstimatePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/sponsor" element={<SponsorPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/share/:token" element={<SharedEstimatePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
