import { Button } from "@/components/ui/button";
import { Upload, Play, ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import LiveUsers from "@/components/LiveUsers";

const HeroSection = () => {
  const { t } = useI18n();
  return (
    <section className="bg-hero relative overflow-hidden min-h-[100svh] flex items-center">
      {/* Decorative grid + blobs */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0">
        <div className="absolute top-10 -left-20 w-[28rem] h-[28rem] bg-accent/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 -right-20 w-[32rem] h-[32rem] bg-primary-glow/40 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        <div className="absolute top-1/3 left-1/2 w-[20rem] h-[20rem] bg-accent-glow/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "8s" }} />
      </div>

      <div className="container relative py-16 sm:py-20 lg:py-36 w-full">
        <div className="max-w-4xl mx-auto text-center space-y-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-gradient-hero text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.05] tracking-tight"
          >
            {t("hero.title")}
          </motion.h1>

          <motion.p
            className="text-primary-foreground/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <Button variant="hero" size="lg" asChild className="shadow-glow-accent animate-pulse-glow">
              <Link to="/upload">
                <Upload className="h-5 w-5 mr-1" /> {t("hero.upload")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/estimate/demo">
                <Play className="h-5 w-5 mr-1" /> {t("hero.tryDemo")}
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex justify-center pt-2"
          >
            <LiveUsers />
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-8 text-sm text-primary-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" />{t("hero.free")}</span>
            <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-accent" />{t("hero.instant")}</span>
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" />{t("hero.pdf")}</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom soft fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
};

export default HeroSection;
