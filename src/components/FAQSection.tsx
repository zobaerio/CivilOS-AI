import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, HelpCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

type Category = "all" | "general" | "files" | "pricing" | "security";

const faqItems: { qKey: string; aKey: string; category: Exclude<Category, "all"> }[] = [
  { qKey: "faq.1.q", aKey: "faq.1.a", category: "general" },
  { qKey: "faq.2.q", aKey: "faq.2.a", category: "files" },
  { qKey: "faq.3.q", aKey: "faq.3.a", category: "general" },
  { qKey: "faq.4.q", aKey: "faq.4.a", category: "security" },
  { qKey: "faq.5.q", aKey: "faq.5.a", category: "pricing" },
  { qKey: "faq.6.q", aKey: "faq.6.a", category: "files" },
];

const categories: { id: Category; labelEn: string; labelBn: string }[] = [
  { id: "all", labelEn: "All", labelBn: "সব" },
  { id: "general", labelEn: "General", labelBn: "সাধারণ" },
  { id: "files", labelEn: "Files", labelBn: "ফাইল" },
  { id: "pricing", labelEn: "Pricing", labelBn: "মূল্য" },
  { id: "security", labelEn: "Security", labelBn: "নিরাপত্তা" },
];

const FAQSection = () => {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [active, setActive] = useState<Category>("all");
  const [highlight, setHighlight] = useState(0);
  const [openValue, setOpenValue] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce search input (200ms)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  // Pre-compute searchable index once per language change
  const index = useMemo(
    () =>
      faqItems.map((f) => ({
        item: f,
        haystack: `${t(f.qKey)} ${t(f.aKey)}`.toLowerCase(),
      })),
    [t, lang]
  );

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return index
      .filter(({ item, haystack }) => {
        if (active !== "all" && item.category !== active) return false;
        if (!q) return true;
        return haystack.includes(q);
      })
      .map(({ item }) => item);
  }, [debouncedQuery, active, index]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlight(0);
  }, [debouncedQuery, active]);

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setHighlight(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const value = `faq-${highlight}`;
      setOpenValue((v) => (v === value ? "" : value));
    } else if (e.key === "Escape") {
      setOpenValue("");
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-faq-index="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlight]);

  return (
    <section className="py-16 md:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="container max-w-3xl relative">
        <div className="text-center mb-8 md:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20 mb-3">
            <Sparkles className="h-3 w-3" />
            FAQ
          </span>
          <h2 className="font-heading text-2xl md:text-4xl font-bold tracking-tight">
            {t("faq.title")}
          </h2>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={lang === "bn" ? "প্রশ্ন খুঁজুন... (↑ ↓ Enter)" : "Search questions... (↑ ↓ Enter)"}
            className="pl-9 h-11 rounded-xl bg-card/70 backdrop-blur border-border/70 focus-visible:ring-accent"
            aria-label={lang === "bn" ? "প্রশ্ন খুঁজুন" : "Search questions"}
            aria-controls="faq-list"
            aria-activedescendant={filtered.length ? `faq-item-${highlight}` : undefined}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                active === c.id
                  ? "bg-accent text-accent-foreground border-accent shadow-glow-accent"
                  : "bg-card/70 text-muted-foreground border-border/60 hover:text-foreground hover:border-accent/40"
              }`}
            >
              {lang === "bn" ? c.labelBn : c.labelEn}
            </button>
          ))}
        </div>

        {/* Accordion list */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 text-muted-foreground text-sm"
            >
              <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {lang === "bn" ? "কোনো ফলাফল পাওয়া যায়নি" : "No results found"}
            </motion.div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {filtered.map((f, i) => (
                <motion.div
                  key={`${f.qKey}-${active}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <AccordionItem
                    value={`faq-${i}`}
                    className="group bg-card/80 backdrop-blur rounded-xl shadow-card border border-border/60 px-4 md:px-5 hover:border-accent/40 hover:shadow-card-hover transition-all data-[state=open]:border-accent/60 data-[state=open]:shadow-glow-accent"
                  >
                    <AccordionTrigger className="text-sm md:text-base font-semibold hover:no-underline text-left gap-3">
                      <span className="flex items-center gap-3 flex-1">
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent/10 text-accent grid place-items-center text-xs font-bold group-data-[state=open]:bg-accent group-data-[state=open]:text-accent-foreground transition-colors">
                          {i + 1}
                        </span>
                        <span className="flex-1">{t(f.qKey)}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pl-10">
                      {t(f.aKey)}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Badge variant="outline" className="font-normal">
            {filtered.length} / {faqItems.length}
          </Badge>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
