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
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-muted/40 via-background to-muted/30">
      <div className="container relative">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4 uppercase tracking-wider">
            Process
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">{t("how.title")}</h2>
          <p className="mt-4 text-muted-foreground text-lg">{t("how.subtitle")}</p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
          {stepKeys.map((s, i) => (
            <motion.div
              key={s.titleKey}
              className="relative text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="relative mx-auto w-fit">
                <div className="h-16 w-16 rounded-2xl bg-accent-gradient flex items-center justify-center shadow-xl shadow-accent/30">
                  <s.icon className="h-7 w-7 text-accent-foreground" />
                </div>
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center ring-4 ring-background">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-xl">{t(s.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[18rem] mx-auto">{t(s.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
