import { motion } from "framer-motion";
import { Upload, Settings, BarChart3, Download } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload Design", desc: "Upload your floor plan, blueprint, or house design image/PDF." },
  { icon: Settings, title: "Enter Details", desc: "Provide dimensions, floors, material quality, and other preferences." },
  { icon: BarChart3, title: "Get Estimate", desc: "AI analyzes your design and generates a complete cost breakdown." },
  { icon: Download, title: "Download Report", desc: "Download a detailed PDF report with all calculations." },
];

const HowItWorks = () => (
  <section className="py-20 bg-muted/50">
    <div className="container">
      <div className="text-center mb-12">
        <h2 className="font-heading text-3xl md:text-4xl font-bold">How It Works</h2>
        <p className="mt-3 text-muted-foreground">Four simple steps to your construction estimate</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div className="relative mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-accent-gradient flex items-center justify-center mx-auto shadow-lg">
                <s.icon className="h-7 w-7 text-accent-foreground" />
              </div>
              <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>
            <h3 className="font-heading font-semibold text-lg">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
