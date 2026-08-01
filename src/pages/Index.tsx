import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import TestimonialsSection from "@/components/TestimonialsSection";
import RatingsSection from "@/components/RatingsSection";
import SponsorSlider from "@/components/SponsorSlider";
import FAQSection from "@/components/FAQSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I get a construction cost estimate in Bangladesh?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upload your house plan (image or DXF) to CivilOS AI, set floors, area and quality, and get a full BOQ and construction cost estimate in BDT using district-wise market rates.",
      },
    },
    {
      "@type": "Question",
      name: "Does CivilOS AI follow BNBC 2022?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Dead, live, wind, snow, earth pressure, water and earthquake loads are calculated with BNBC 2022 clause references, including factored load combinations and a code-compliance check.",
      },
    },
    {
      "@type": "Question",
      name: "Is the estimate free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Basic estimates, BOQ generation and BNBC load analysis are free. Paid plans start at ৳499/month for advanced modules.",
      },
    },
  ],
};

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <SEO
      title="Construction Cost Estimate & BNBC 2022 Analysis"
      description="Upload a house plan and get an instant construction cost estimate in BDT — BOQ, BNBC 2022 load analysis, rebar design, rate analysis and 3D model. Built for Bangladesh."
      path="/"
      jsonLd={faqJsonLd}
    />
    <Navbar />
    <main className="flex-1">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <RatingsSection />
      <SponsorSlider />
      <FAQSection />
    </main>
    <Footer />
  </div>
);

export default Index;
