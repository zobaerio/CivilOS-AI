import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

// Simulated real-time active users counter. Base = 20k+ registered, live = 800-1600.
const LiveUsers = ({ compact = false }: { compact?: boolean }) => {
  const [active, setActive] = useState(1248);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const delta = Math.floor(Math.random() * 60) - 28;
        const next = prev + delta;
        if (next < 820) return 820 + Math.floor(Math.random() * 40);
        if (next > 1680) return 1680 - Math.floor(Math.random() * 40);
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        {active.toLocaleString()} live
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-sm text-primary-foreground shadow-lg"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
      <Users className="h-4 w-4 text-accent" />
      <span>
        <strong className="font-semibold">{active.toLocaleString()}</strong> active now
      </span>
      <span className="text-primary-foreground/60">·</span>
      <span className="text-primary-foreground/80">20,000+ users</span>
    </motion.div>
  );
};

export default LiveUsers;
