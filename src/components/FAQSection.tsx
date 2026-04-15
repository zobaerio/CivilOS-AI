import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";

const faqKeys = [
  { qKey: "faq.1.q", aKey: "faq.1.a" },
  { qKey: "faq.2.q", aKey: "faq.2.a" },
  { qKey: "faq.3.q", aKey: "faq.3.a" },
  { qKey: "faq.4.q", aKey: "faq.4.a" },
  { qKey: "faq.5.q", aKey: "faq.5.a" },
  { qKey: "faq.6.q", aKey: "faq.6.a" },
];

const FAQSection = () => {
  const { t } = useI18n();
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-2xl">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-10">{t("faq.title")}</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqKeys.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg shadow-card px-5 border-none">
              <AccordionTrigger className="font-medium hover:no-underline">{t(f.qKey)}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t(f.aKey)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
