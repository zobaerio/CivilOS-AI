import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, LogOut, FolderOpen, User } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import LiveUsers from "@/components/LiveUsers";
import aiLogo from "@/assets/ai-logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/upload", label: t("nav.upload") },
    { href: "/estimate/demo", label: t("nav.demo") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const toggleLang = () => setLang(lang === "en" ? "bn" : "en");

  return (
    <nav className="sticky top-0 z-50 glass border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold text-primary">
          <img src={aiLogo} alt="Plan Pro Estimate AI logo" width={48} height={48} className="h-12 w-12 drop-shadow-md" />
          <span className="hidden sm:inline">Plan Pro Estimate</span>
        </Link>
        <div className="hidden lg:flex"><LiveUsers compact /></div>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === l.href
                  ? "text-accent font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={toggleLang} className="gap-1.5">
            <Globe className="h-4 w-4" />
            {lang === "en" ? "বাংলা" : "English"}
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projects"><FolderOpen className="h-4 w-4 mr-1" /> Projects</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile"><User className="h-4 w-4 mr-1" /> Profile</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" /> Sign out
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">{t("nav.login")}</Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link to="/upload">{t("nav.getEstimate")}</Link>
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleLang}>
            <Globe className="h-4 w-4" />
          </Button>
          <button onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-background flex flex-col p-6 gap-2 overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <>
              <Link to="/projects" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted">
                My Projects
              </Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-muted">
                Profile
              </Link>
            </>
          )}
          <div className="mt-auto pt-4 flex flex-col gap-2">
            {user ? (
              <Button variant="outline" size="lg" className="w-full" onClick={() => { handleSignOut(); setOpen(false); }}>
                Sign out
              </Button>
            ) : (
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link to="/auth" onClick={() => setOpen(false)}>{t("nav.login")}</Link>
              </Button>
            )}
            <Button size="lg" className="w-full" asChild>
              <Link to="/upload" onClick={() => setOpen(false)}>{t("nav.getEstimate")}</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
