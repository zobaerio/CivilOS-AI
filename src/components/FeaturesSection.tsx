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
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">{t("features.title")}</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t("features.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureKeys.map((f, i) => (
            <motion.div key={f.titleKey} className="group p-5 rounded-xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 border border-transparent hover:border-accent/20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">{t(f.titleKey)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(f.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
