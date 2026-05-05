import { motion } from "framer-motion";
import {
  Ruler, Boxes, Hammer, Paintbrush, Zap, Droplets,
  LayoutGrid, FileText, Brain, DollarSign, Layers, Building
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const featureKeys = [
  { icon: Ruler, titleKey: "features.areaCalc", descKey: "features.areaCalcDesc" },
  { icon: Boxes, titleKey: "features.material", descKey: "features.materialDesc" },
  { icon: Hammer, titleKey: "features.labor", descKey: "features.laborDesc" },
  { icon: Paintbrush, titleKey: "features.finishing", descKey: "features.finishingDesc" },
  { icon: Zap, titleKey: "features.electrical", descKey: "features.electricalDesc" },
  { icon: Droplets, titleKey: "features.plumbing", descKey: "features.plumbingDesc" },
  { icon: LayoutGrid, titleKey: "features.roomwise", descKey: "features.roomwiseDesc" },
  { icon: FileText, titleKey: "features.pdfReport", descKey: "features.pdfReportDesc" },
  { icon: Brain, titleKey: "features.aiSuggestions", descKey: "features.aiSuggestionsDesc" },
  { icon: DollarSign, titleKey: "features.costBreakdown", descKey: "features.costBreakdownDesc" },
  { icon: Layers, titleKey: "features.multiFloor", descKey: "features.multiFloorDesc" },
  { icon: Building, titleKey: "features.projectTypes", descKey: "features.projectTypesDesc" },
];

const FeaturesSection = () => {
  const { t } = useI18n();
  return (
    <section className="relative py-24 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="container relative">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-4 uppercase tracking-wider">
            Features
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            {t("features.title")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">{t("features.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureKeys.map((f, i) => (
            <motion.div
              key={f.titleKey}
              className="group relative p-6 rounded-2xl bg-card border border-border/60 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-accent/0 group-hover:bg-accent/10 blur-2xl transition-all duration-500" />
              <div className="relative h-12 w-12 rounded-xl bg-accent-gradient flex items-center justify-center mb-4 shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform duration-500">
                <f.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="relative font-heading font-semibold text-lg text-foreground">{t(f.titleKey)}</h3>
              <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
