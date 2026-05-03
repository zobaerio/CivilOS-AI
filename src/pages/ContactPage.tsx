import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const ContactPage = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const inputClass = "w-full h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t("contact.sent"), description: t("contact.sentDesc") });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="container max-w-lg space-y-6">
          <h1 className="font-heading text-3xl font-bold text-center">{t("contact.title")}</h1>
          <p className="text-center text-muted-foreground">{t("contact.subtitle")}</p>
          <a href="https://wa.me/8801832313998" target="_blank" rel="noopener noreferrer"
            className="block bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold rounded-xl p-4 text-center transition-colors">
            💬 WhatsApp: +880 1832-313998
          </a>
          <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-card p-6 space-y-4">
            <input className={inputClass} placeholder={t("contact.name")} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inputClass} type="email" placeholder={t("contact.email")} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={inputClass} placeholder={t("contact.subject")} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className={`${inputClass} h-28 py-2`} placeholder={t("contact.message")} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <Button type="submit" className="w-full">{t("contact.send")}</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
