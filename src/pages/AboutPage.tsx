import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useI18n } from "@/lib/i18n";

const AboutPage = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="About"
        description="CivilOS AI is an AI civil engineering workspace for Bangladesh — construction estimates, BOQ, BNBC 2022 analysis. Developed by Md Zobaer Hasan."
        path="/about"
      />
      <Navbar />
      <main className="flex-1 py-16">
        <div className="container max-w-2xl space-y-6">
          <h1 className="font-heading text-3xl md:text-4xl font-bold">{t("about.title")}</h1>
          <p className="text-muted-foreground leading-relaxed">{t("about.p1")}</p>
          <p className="text-muted-foreground leading-relaxed">{t("about.p2")}</p>
          <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
            <h2 className="font-heading font-semibold text-lg">{t("about.developedBy")}</h2>
            <p className="font-medium text-foreground">{t("about.devName")}</p>
            <p className="text-sm text-muted-foreground">{t("about.devRole")}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
