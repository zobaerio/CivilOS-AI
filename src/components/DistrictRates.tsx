import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Loader2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import {
  DISTRICTS,
  getTodayRates,
  getYesterdayRates,
  detectDistrict,
  type DistrictRates,
} from "@/lib/marketRates";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  district: string;
  onChange: (district: string, rates: DistrictRates) => void;
}

const ROWS: { key: keyof DistrictRates; label: string; bn: string; unit: string }[] = [
  { key: "cement",     label: "Cement",      bn: "সিমেন্ট",      unit: "/bag" },
  { key: "steel",      label: "Steel Rod",   bn: "রড",          unit: "/kg" },
  { key: "brick",      label: "Brick",       bn: "ইট",          unit: "/pc" },
  { key: "sand",       label: "Sand",        bn: "বালি",         unit: "/cft" },
  { key: "stoneChips", label: "Stone Chips", bn: "পাথর",         unit: "/cft" },
  { key: "labor",      label: "Mason Labor", bn: "মিস্ত্রি",       unit: "/day" },
];

const DistrictRates = ({ district, onChange }: Props) => {
  const [detecting, setDetecting] = useState(false);
  const [tick, setTick] = useState(0); // bump to refresh

  const today = useMemo(() => getTodayRates(district), [district, tick]);
  const yest = useMemo(() => getYesterdayRates(district), [district, tick]);

  // Push rates upward whenever district changes
  useEffect(() => { onChange(district, today); /* eslint-disable-next-line */ }, [district, tick]);

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const d = await detectDistrict();
      if (d) {
        onChange(d, getTodayRates(d));
        toast.success(`Location detected: ${d}`);
      } else {
        toast.error("Could not detect district — please select manually");
      }
    } finally {
      setDetecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-xl shadow-card p-5 sm:p-6 space-y-4 border border-border/60"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            District Market Rates · জেলা-ভিত্তিক বাজার দর
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Live daily rates · প্রতিদিন স্বয়ংক্রিয় আপডেট হয় ও এস্টিমেট পুনঃহিসাব হয়।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button type="button" variant="default" size="sm" onClick={handleDetect} disabled={detecting}>
            {detecting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <MapPin className="h-3.5 w-3.5 mr-1" />}
            Auto-detect
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">District:</label>
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={district}
          onChange={(e) => onChange(e.target.value, getTodayRates(e.target.value))}
        >
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          Updated: {new Date().toLocaleDateString("en-GB")}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ROWS.map((row) => {
          const t = today[row.key];
          const y = yest[row.key];
          const diff = t - y;
          const pct = y ? (diff / y) * 100 : 0;
          const up = diff > 0;
          const flat = diff === 0;
          return (
            <motion.div
              key={row.key}
              layout
              className="rounded-lg bg-muted/40 border border-border/40 p-3"
            >
              <div className="text-xs text-muted-foreground">{row.label} · {row.bn}</div>
              <div className="mt-1 flex items-baseline justify-between">
                <div className="font-heading text-lg font-bold">
                  ৳{t.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">{row.unit}</span>
                </div>
                {!flat && (
                  <span className={`text-[11px] font-medium flex items-center gap-0.5 ${up ? "text-red-500" : "text-emerald-500"}`}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(pct).toFixed(1)}%
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DistrictRates;
