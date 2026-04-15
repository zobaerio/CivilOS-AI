import { motion } from "framer-motion";
import {
  Ruler, Boxes, Hammer, Paintbrush, Zap, Droplets,
  LayoutGrid, FileText, Brain, DollarSign, Layers, Building
} from "lucide-react";

const features = [
  { icon: Ruler, title: "Area Calculation", desc: "Total built-up, room-wise, slab, and wall areas" },
  { icon: Boxes, title: "Material Estimate", desc: "Cement, sand, bricks, steel, stone & more" },
  { icon: Hammer, title: "Labor Cost", desc: "Mason, carpenter, electrician, plumber costs" },
  { icon: Paintbrush, title: "Finishing Estimate", desc: "Paint, tiles, flooring, polish, false ceiling" },
  { icon: Zap, title: "Electrical Estimate", desc: "Wiring points, switches, DB box, fixtures" },
  { icon: Droplets, title: "Plumbing Estimate", desc: "Pipe length, fittings, water tank sizing" },
  { icon: LayoutGrid, title: "Room-wise Details", desc: "Per-room area, finish, doors, windows" },
  { icon: FileText, title: "PDF Report", desc: "Downloadable detailed estimate report" },
  { icon: Brain, title: "AI Suggestions", desc: "Cost-saving & optimization recommendations" },
  { icon: DollarSign, title: "Cost Breakdown", desc: "Item-wise quantity, rate & total amount" },
  { icon: Layers, title: "Multi-Floor", desc: "Single, duplex & multi-storied buildings" },
  { icon: Building, title: "Project Types", desc: "Residential, commercial, shop-home combo" },
];

const FeaturesSection = () => (
  <section className="py-20 bg-background">
    <div className="container">
      <div className="text-center mb-12">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
          Complete Construction Estimation
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Get every detail you need — from foundation to finishing — in one intelligent platform.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="group p-5 rounded-xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 border border-transparent hover:border-accent/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
              <f.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-heading font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
