import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const testimonialKeys = [
  { nameKey: "testimonial.1.name", roleKey: "testimonial.1.role", textKey: "testimonial.1.text" },
  { nameKey: "testimonial.2.name", roleKey: "testimonial.2.role", textKey: "testimonial.2.text" },
  { nameKey: "testimonial.3.name", roleKey: "testimonial.3.role", textKey: "testimonial.3.text" },
];

const TestimonialsSection = () => {
  const { t } = useI18n();
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-10">{t("testimonials.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonialKeys.map((tk, i) => (
            <motion.div key={tk.nameKey} className="bg-card rounded-xl p-6 shadow-card space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}>
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-accent text-accent" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">"{t(tk.textKey)}"</p>
              <div>
                <p className="font-semibold text-foreground">{t(tk.nameKey)}</p>
                <p className="text-xs text-muted-foreground">{t(tk.roleKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
