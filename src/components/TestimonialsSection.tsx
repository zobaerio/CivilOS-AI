import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Arif Rahman", role: "Civil Engineer", text: "This tool saves me hours of manual BOQ calculation. The estimates are surprisingly close to my detailed analysis." },
  { name: "Fatima Akter", role: "Homeowner", text: "I could finally understand the construction costs before talking to contractors. Very user-friendly!" },
  { name: "Kamal Hossain", role: "Contractor", text: "I use this for quick client proposals. The PDF reports look professional and detailed." },
];

const TestimonialsSection = () => (
  <section className="py-20 bg-muted/50">
    <div className="container">
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-10">
        Trusted by Professionals
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            className="bg-card rounded-xl p-6 shadow-card space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div className="flex gap-1">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
            <div>
              <p className="font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
