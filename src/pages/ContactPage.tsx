import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { MessageCircle, Send, Loader2 } from "lucide-react";

const WHATSAPP_NUMBER = "8801832313998";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message too short").max(2000),
});

const ContactPage = () => {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Forward the message to WhatsApp automatically
    const waText = encodeURIComponent(
      `🆕 New Contact Message\n\n👤 ${parsed.data.name}\n✉️ ${parsed.data.email}${parsed.data.phone ? `\n📱 ${parsed.data.phone}` : ""}${parsed.data.subject ? `\n📌 ${parsed.data.subject}` : ""}\n\n💬 ${parsed.data.message}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`, "_blank", "noopener,noreferrer");

    toast.success("Message sent! Forwarding to WhatsApp…");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Contact Us" description="Reach out to AI Civil Engineering Bangladesh — instant WhatsApp support and direct messaging." />
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container max-w-lg space-y-6">
          <div className="text-center space-y-1">
            <h1 className="font-heading text-3xl font-bold">{t("contact.title") || "Contact Us"}</h1>
            <p className="text-muted-foreground text-sm">We reply on WhatsApp & email — usually within an hour.</p>
          </div>

          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold rounded-xl p-4 transition-colors">
            <MessageCircle className="h-5 w-5" />
            WhatsApp: +880 1832-313998
          </a>

          <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-card p-6 space-y-4 border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email *</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+8801..." /></div>
              <div className="space-y-1.5"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Message *</Label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-32" required maxLength={2000}
                value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : <><Send className="h-4 w-4 mr-2" />Send & Forward to WhatsApp</>}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Your message is saved to the admin panel and instantly forwarded to our WhatsApp.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
