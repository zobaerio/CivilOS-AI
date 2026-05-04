import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Send, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "8801832313998";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  contact_email: z.string().trim().email().max(255),
  website: z.string().trim().url().max(255).optional().or(z.literal("")),
  logo_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

const SponsorPage = () => {
  const [form, setForm] = useState({ name: "", contact_email: "", website: "", logo_url: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSubmitting(true);
    const payload: any = {
      ...parsed.data,
      website: parsed.data.website || null,
      logo_url: parsed.data.logo_url || null,
      description: parsed.data.description || null,
      status: "pending",
    };
    const { error } = await supabase.from("sponsors").insert(payload);
    setSubmitting(false);
    if (error) return toast.error(error.message);

    // Auto-forward to WhatsApp
    const wa = encodeURIComponent(
      `🤝 New Sponsor Request\n\n🏢 ${parsed.data.name}\n✉️ ${parsed.data.contact_email}${parsed.data.website ? `\n🔗 ${parsed.data.website}` : ""}${parsed.data.description ? `\n\n📝 ${parsed.data.description}` : ""}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${wa}`, "_blank", "noopener,noreferrer");

    toast.success("Request submitted & forwarded to WhatsApp");
    setForm({ name: "", contact_email: "", website: "", logo_url: "", description: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Become a Sponsor" description="Sponsor AI Civil Engineering Bangladesh and reach thousands of engineers, students, and homeowners." />
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl font-bold">Become a Sponsor</h1>
            <p className="text-muted-foreground text-sm">Support free civil engineering tools for Bangladeshi engineers and students.</p>
          </div>

          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold rounded-xl p-3 text-sm transition-colors">
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp first
          </a>

          <form onSubmit={submit} className="bg-card rounded-xl shadow-card p-6 space-y-4 border border-border">
            <div className="space-y-2"><Label>Company Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Contact Email *</Label><Input type="email" required value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Website</Label><Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" /></div>
            <div className="space-y-2"><Label>Logo URL</Label><Input type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://...png" /></div>
            <div className="space-y-2"><Label>Description</Label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : <><Send className="h-4 w-4 mr-2" />Submit & Forward to WhatsApp</>}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">Saved to admin panel and forwarded to WhatsApp automatically.</p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SponsorPage;
