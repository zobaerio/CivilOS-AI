import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AboutPage = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 py-16">
      <div className="container max-w-2xl space-y-6">
        <h1 className="font-heading text-3xl md:text-4xl font-bold">About Smart House Estimate AI</h1>
        <p className="text-muted-foreground leading-relaxed">
          Smart House Estimate AI is an intelligent construction estimation platform built for civil engineers, contractors, architects, students, and homeowners. Upload your house design or floor plan and get a comprehensive cost breakdown instantly.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Our AI-powered system analyzes building drawings to generate material quantities, labor costs, finishing estimates, and more — helping you plan and budget your construction project with confidence.
        </p>
        <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
          <h2 className="font-heading font-semibold text-lg">Developed by</h2>
          <p className="font-medium text-foreground">Md Zobaer Hasan</p>
          <p className="text-sm text-muted-foreground">Software Engineer & Construction Technology Enthusiast</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default AboutPage;
