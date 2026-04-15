import { motion } from "framer-motion";
import { Upload, Settings, BarChart3, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const stepKeys = [
  { icon: Upload, titleKey: "how.step1.title", descKey: "how.step1.desc" },
  { icon: Settings, titleKey: "how.step2.title", descKey: "how.step2.desc" },
  { icon: BarChart3, titleKey: "how.step3.title", descKey: "how.step3.desc" },
  { icon: Download, titleKey: "how.step4.title", descKey: "how.step4.desc" },
];

const HowItWorks = () => {
  const { t } = useI18n();
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">{t("how.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("how.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stepKeys.map((s, i) => (
            <motion.div key={s.titleKey} className="text-center space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}>
              <div className="relative mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-accent-gradient flex items-center justify-center mx-auto shadow-lg">
                  <s.icon className="h-7 w-7 text-accent-foreground" />
                </div>
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
              </div>
              <h3 className="font-heading font-semibold text-lg">{t(s.titleKey)}</h3>
              <p className="text-sm text-muted-foreground">{t(s.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
