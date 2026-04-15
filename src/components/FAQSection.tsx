import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "How accurate is the estimate?", a: "The system provides approximate estimates based on standard civil engineering formulas. For exact BOQ, consult a licensed engineer." },
  { q: "What file formats are supported?", a: "JPG, PNG, PDF, and scanned blueprints. AutoCAD-exported images and PDFs also work." },
  { q: "Can I estimate multi-storied buildings?", a: "Yes! You can specify the number of floors and the system will calculate accordingly." },
  { q: "Is my uploaded data secure?", a: "Yes, all uploads are encrypted and processed securely. We never share your data." },
  { q: "Can I adjust material prices?", a: "Absolutely. The estimate dashboard includes sliders for material rates, labor costs, and other factors." },
  { q: "Do I need to provide dimensions?", a: "If the uploaded drawing has visible dimensions, they'll be used. Otherwise, you'll be asked to enter plot size and key measurements." },
];

const FAQSection = () => (
  <section className="py-20 bg-background">
    <div className="container max-w-2xl">
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-10">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg shadow-card px-5 border-none">
            <AccordionTrigger className="font-medium hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQSection;
