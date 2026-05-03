import { Building2, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-heading text-lg font-bold">
              <Building2 className="h-5 w-5 text-accent" />
              Smart House Estimate AI
            </div>
            <p className="text-sm text-primary-foreground/70">{t("footer.desc")}</p>
            <p className="text-xs text-primary-foreground/50">
              {t("footer.developedBy").replace(/Md Zobaer Hasan|মোঃ জোবায়ের হাসান/, "")}
              <a
                href="https://zobaer-portfolio.lovable.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:text-accent/80 hover:underline font-medium transition-colors"
              >
                👨‍💻 MD Zobaer Hasan
              </a>
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">{t("footer.platform")}</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <Link to="/upload" className="block hover:text-accent transition-colors">{t("nav.upload")}</Link>
              <Link to="/estimate/demo" className="block hover:text-accent transition-colors">{t("nav.demo")}</Link>
              <Link to="/about" className="block hover:text-accent transition-colors">{t("nav.about")}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">{t("footer.resources")}</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <Link to="/faq" className="block hover:text-accent transition-colors">{t("footer.faq")}</Link>
              <Link to="/contact" className="block hover:text-accent transition-colors">{t("nav.contact")}</Link>
              <Link to="/privacy" className="block hover:text-accent transition-colors">{t("footer.privacy")}</Link>
              <Link to="/terms" className="block hover:text-accent transition-colors">{t("footer.terms")}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">{t("footer.contactTitle")}</h4>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <p>support@smarthouseai.com</p>
              <a href="https://wa.me/8801832313998" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-accent">
                <Phone className="h-3.5 w-3.5" /> +880 1832-313998 (WhatsApp)
              </a>
              <p>Dhaka, Bangladesh</p>
              <Link to="/sponsor" className="block hover:text-accent">Become a Sponsor</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/50">
          <Link to="/admin" title="Admin" className="hover:text-accent transition-colors cursor-pointer">©</Link>{" "}
          2026 Smart House Estimate AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
