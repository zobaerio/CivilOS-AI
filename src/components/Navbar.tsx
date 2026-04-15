import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useI18n();

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
          <Building2 className="h-6 w-6 text-accent" />
          Smart House Estimate AI
        </Link>

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
          <Button variant="outline" size="sm" onClick={toggleLang} className="gap-1.5">
            <Globe className="h-4 w-4" />
            {lang === "en" ? "বাংলা" : "English"}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">{t("nav.login")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/upload">{t("nav.getEstimate")}</Link>
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleLang}>
            <Globe className="h-4 w-4" />
          </Button>
          <button onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-card p-4 space-y-2">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to="/login">{t("nav.login")}</Link>
            </Button>
            <Button size="sm" className="flex-1" asChild>
              <Link to="/upload">{t("nav.getEstimate")}</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
