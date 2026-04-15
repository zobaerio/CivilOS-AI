import { Button } from "@/components/ui/button";
import { Upload, Play, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => (
  <section className="bg-hero relative overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/50 rounded-full blur-3xl" />
    </div>
    <div className="container relative py-20 lg:py-32">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-accent/20 text-accent mb-4">
            AI-Powered Construction Estimation
          </span>
          <h1 className="text-gradient-hero text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
            Upload Your House Design &amp; Get Full Construction Estimate Instantly
          </h1>
        </motion.div>
        <motion.p
          className="text-primary-foreground/70 text-lg md:text-xl max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Smart AI-powered building estimation system for house owners, civil engineers, architects, and contractors.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button variant="hero" size="lg" asChild>
            <Link to="/upload">
              <Upload className="h-5 w-5 mr-1" /> Upload Design <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button variant="heroOutline" size="lg" asChild>
            <Link to="/estimate/demo">
              <Play className="h-5 w-5 mr-1" /> Try Demo
            </Link>
          </Button>
        </motion.div>
        <motion.div
          className="flex items-center justify-center gap-6 pt-6 text-sm text-primary-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <span>✓ Free to try</span>
          <span>✓ Instant results</span>
          <span>✓ PDF reports</span>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
