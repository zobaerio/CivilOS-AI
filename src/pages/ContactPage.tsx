import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const inputClass = "w-full h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message Sent!", description: "We'll get back to you soon." });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="container max-w-lg space-y-6">
          <h1 className="font-heading text-3xl font-bold text-center">Contact Us</h1>
          <p className="text-center text-muted-foreground">Have questions or feedback? We'd love to hear from you.</p>
          <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-card p-6 space-y-4">
            <input className={inputClass} placeholder="Your Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inputClass} type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={inputClass} placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className={`${inputClass} h-28 py-2`} placeholder="Your message..." required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
