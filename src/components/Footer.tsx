import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-heading text-lg font-bold">
            <Building2 className="h-5 w-5 text-accent" />
            Smart House Estimate AI
          </div>
          <p className="text-sm text-primary-foreground/70">
            AI-powered construction estimation for engineers, contractors, and homeowners.
          </p>
          <p className="text-xs text-primary-foreground/50">Developed by Md Zobaer Hasan</p>
        </div>
        <div>
          <h4 className="font-heading font-semibold mb-3">Platform</h4>
          <div className="space-y-2 text-sm text-primary-foreground/70">
            <Link to="/upload" className="block hover:text-accent transition-colors">Upload Design</Link>
            <Link to="/estimate/demo" className="block hover:text-accent transition-colors">Demo Estimate</Link>
            <Link to="/about" className="block hover:text-accent transition-colors">About</Link>
          </div>
        </div>
        <div>
          <h4 className="font-heading font-semibold mb-3">Resources</h4>
          <div className="space-y-2 text-sm text-primary-foreground/70">
            <Link to="/faq" className="block hover:text-accent transition-colors">FAQ</Link>
            <Link to="/contact" className="block hover:text-accent transition-colors">Contact</Link>
            <Link to="/privacy" className="block hover:text-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="block hover:text-accent transition-colors">Terms of Service</Link>
          </div>
        </div>
        <div>
          <h4 className="font-heading font-semibold mb-3">Contact</h4>
          <div className="space-y-2 text-sm text-primary-foreground/70">
            <p>support@smarthouseai.com</p>
            <p>Dhaka, Bangladesh</p>
          </div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/50">
        © 2026 Smart House Estimate AI. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
