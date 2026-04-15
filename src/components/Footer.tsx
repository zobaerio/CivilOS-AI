import { Building2 } from "lucide-react";
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
            <p className="text-xs text-primary-foreground/50">{t("footer.developedBy")}</p>
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
              <p>Dhaka, Bangladesh</p>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/50">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
