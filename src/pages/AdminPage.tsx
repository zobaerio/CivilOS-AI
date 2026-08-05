import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Loader2, Trash2, Star, Check, X, Crown, Users, FolderKanban, Building, MessageSquare,
  Mail, Phone, Send, ExternalLink, Reply, Search,
} from "lucide-react";

const WHATSAPP_NUMBER = "8801832313998";

const StatCard = ({ icon: Icon, label, value, accent }: any) => (
  <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </div>
);

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [newSponsor, setNewSponsor] = useState({ name: "", logo_url: "", website: "", description: "", contact_email: "" });
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/admin");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(data === true);
    })();
  }, [user]);

  const loadAll = async () => {
    const [s, r, p, pr, m] = await Promise.all([
      supabase.from("sponsors").select("*").order("created_at", { ascending: false }),
      supabase.from("ratings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name, user_id, file_name, is_public, share_token, created_at").order("created_at", { ascending: false }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
    ]);
    setSponsors(s.data || []);
    setRatings(r.data || []);
    setProfiles(p.data || []);
    setProjects(pr.data || []);
    setMessages(m.data || []);
  };

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);

  if (authLoading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <h1 className="font-heading text-2xl font-bold">Access denied</h1>
            <p className="text-sm text-muted-foreground">Admin only area.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const setSponsorStatus = async (id: string, status: string) => { await supabase.from("sponsors").update({ status }).eq("id", id); loadAll(); toast.success(`Sponsor ${status}`); };
  const toggleFeatured = async (id: string, featured: boolean) => { await supabase.from("sponsors").update({ featured }).eq("id", id); loadAll(); };
  const delSponsor = async (id: string) => { await supabase.from("sponsors").delete().eq("id", id); loadAll(); };
  const delRating = async (id: string) => { await supabase.from("ratings").delete().eq("id", id); loadAll(); };
  const delMessage = async (id: string) => { await supabase.from("contact_messages").delete().eq("id", id); loadAll(); toast.success("Message deleted"); };
  const markRead = async (id: string) => { await supabase.from("contact_messages").update({ status: "read" }).eq("id", id); loadAll(); };

  const addSponsor = async () => {
    if (!newSponsor.name) return toast.error("Name required");
    const { error } = await supabase.from("sponsors").insert({ ...newSponsor, status: "active" });
    if (error) return toast.error(error.message);
    setNewSponsor({ name: "", logo_url: "", website: "", description: "", contact_email: "" });
    loadAll();
    toast.success("Sponsor added");
  };

  const openReply = (msg: any) => { setReplyTo(msg); setReplyText(""); setReplyOpen(true); };
  const sendReply = async () => {
    if (!replyTo || !replyText.trim()) return;
    await supabase.from("contact_messages").update({
      admin_reply: replyText,
      replied_at: new Date().toISOString(),
      status: "replied",
    }).eq("id", replyTo.id);

    // Open WhatsApp reply
    const wa = encodeURIComponent(`Hi ${replyTo.name},\n\n${replyText}\n\n— AI Civil Engineering BD`);
    if (replyTo.phone) {
      const num = replyTo.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${num}?text=${wa}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${wa}`, "_blank", "noopener,noreferrer");
    }

    setReplyOpen(false);
    setReplyTo(null);
    setReplyText("");
    loadAll();
    toast.success("Reply saved & WhatsApp opened");
  };

  const newMsgCount = messages.filter((m) => m.status === "new").length;
  const pendingSponsors = sponsors.filter((s) => s.status === "pending").length;

  const filteredMessages = messages.filter((m) =>
    !search || `${m.name} ${m.email} ${m.subject || ""} ${m.message}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SEO title="Admin Panel" description="Manage sponsors, ratings, users, projects and contact messages." />
      <Navbar />
      <main className="flex-1 py-6 md:py-8">
        <div className="container space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-md">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-2xl md:text-3xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Sponsors • Ratings • Users • Projects • Messages</p>
            </div>
            {(newMsgCount > 0 || pendingSponsors > 0) && (
              <div className="flex gap-2">
                {newMsgCount > 0 && <Badge className="bg-red-500">{newMsgCount} new msg</Badge>}
                {pendingSponsors > 0 && <Badge className="bg-amber-500">{pendingSponsors} pending</Badge>}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon={Users} label="Users" value={profiles.length} accent="bg-blue-500" />
            <StatCard icon={FolderKanban} label="Projects" value={projects.length} accent="bg-violet-500" />
            <StatCard icon={Star} label="Ratings" value={ratings.length} accent="bg-amber-500" />
            <StatCard icon={Building} label="Sponsors" value={sponsors.length} accent="bg-green-500" />
            <StatCard icon={MessageSquare} label="Messages" value={messages.length} accent="bg-pink-500" />
          </div>

          <Tabs defaultValue="messages">
            <TabsList className="flex-wrap h-auto bg-card shadow-sm">
              <TabsTrigger value="messages" className="gap-1"><MessageSquare className="h-4 w-4" />Messages{newMsgCount > 0 && <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-red-500">{newMsgCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="sponsors" className="gap-1"><Building className="h-4 w-4" />Sponsors{pendingSponsors > 0 && <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-amber-500">{pendingSponsors}</Badge>}</TabsTrigger>
              <TabsTrigger value="ratings" className="gap-1"><Star className="h-4 w-4" />Ratings</TabsTrigger>
              <TabsTrigger value="users" className="gap-1"><Users className="h-4 w-4" />Users</TabsTrigger>
              <TabsTrigger value="projects" className="gap-1"><FolderKanban className="h-4 w-4" />Projects</TabsTrigger>
            </TabsList>

            {/* MESSAGES */}
            <TabsContent value="messages" className="space-y-3 mt-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search messages…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {filteredMessages.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No messages yet.</p>}
              {filteredMessages.map((m) => (
                <div key={m.id} className={`bg-card rounded-xl p-4 shadow-sm border ${m.status === "new" ? "border-red-200 ring-1 ring-red-200" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{m.name}</p>
                        <Badge variant={m.status === "new" ? "destructive" : m.status === "replied" ? "default" : "secondary"} className="text-[10px]">{m.status}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <a href={`mailto:${m.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail className="h-3 w-3" />{m.email}</a>
                        {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="h-3 w-3" />{m.phone}</a>}
                      </div>
                      {m.subject && <p className="text-sm font-medium">📌 {m.subject}</p>}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{m.message}</p>
                      {m.admin_reply && (
                        <div className="mt-2 bg-primary/5 border-l-2 border-primary/40 px-3 py-2 rounded">
                          <p className="text-[10px] font-semibold text-primary uppercase">Your reply • {new Date(m.replied_at).toLocaleString()}</p>
                          <p className="text-sm whitespace-pre-wrap">{m.admin_reply}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button size="sm" onClick={() => openReply(m)}><Reply className="h-3 w-3 mr-1" />Reply</Button>
                      <a href={`https://wa.me/${(m.phone || WHATSAPP_NUMBER).replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${m.name}, regarding "${m.subject || "your message"}"…`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 h-8 px-3 rounded-md bg-[#25D366] text-white text-xs font-medium hover:bg-[#1ebe57]">
                        <MessageSquare className="h-3 w-3" />WhatsApp
                      </a>
                      {m.status === "new" && <Button size="sm" variant="outline" onClick={() => markRead(m.id)}><Check className="h-3 w-3" /></Button>}
                      <Button size="sm" variant="outline" onClick={() => delMessage(m.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* SPONSORS */}
            <TabsContent value="sponsors" className="space-y-4 mt-4">
              <div className="bg-card rounded-xl p-5 shadow-sm border space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Building className="h-4 w-4" />Add sponsor manually</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="Name *" value={newSponsor.name} onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })} />
                  <Input placeholder="Email" value={newSponsor.contact_email} onChange={(e) => setNewSponsor({ ...newSponsor, contact_email: e.target.value })} />
                  <Input placeholder="Website" value={newSponsor.website} onChange={(e) => setNewSponsor({ ...newSponsor, website: e.target.value })} />
                  <Input placeholder="Logo URL" value={newSponsor.logo_url} onChange={(e) => setNewSponsor({ ...newSponsor, logo_url: e.target.value })} />
                </div>
                <Input placeholder="Description" value={newSponsor.description} onChange={(e) => setNewSponsor({ ...newSponsor, description: e.target.value })} />
                <Button size="sm" onClick={addSponsor}>Add Sponsor</Button>
              </div>

              <div className="space-y-2">
                {sponsors.map((s) => (
                  <div key={s.id} className="bg-card rounded-xl p-4 shadow-sm border flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {s.logo_url ? <img src={s.logo_url} className="h-10 w-10 object-contain rounded" alt="" /> : <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-bold text-xs">{s.name[0]}</div>}
                      <div className="min-w-0">
                        <p className="font-semibold truncate flex items-center gap-1.5">{s.name} {s.featured && <Badge className="bg-accent text-[10px]">Featured</Badge>}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.contact_email} {s.website && `• ${s.website}`}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <Badge variant={s.status === "active" ? "default" : s.status === "pending" ? "secondary" : "destructive"}>{s.status}</Badge>
                      {s.status !== "active" && <Button size="sm" variant="outline" title="Approve" onClick={() => setSponsorStatus(s.id, "active")}><Check className="h-3 w-3" /></Button>}
                      {s.status !== "rejected" && <Button size="sm" variant="outline" title="Reject" onClick={() => setSponsorStatus(s.id, "rejected")}><X className="h-3 w-3" /></Button>}
                      <Button size="sm" variant="outline" title="Toggle featured" onClick={() => toggleFeatured(s.id, !s.featured)}><Star className={`h-3 w-3 ${s.featured ? "fill-accent text-accent" : ""}`} /></Button>
                      {s.contact_email && <a href={`mailto:${s.contact_email}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input"><Mail className="h-3 w-3" /></a>}
                      <Button size="sm" variant="outline" onClick={() => delSponsor(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ratings" className="space-y-2 mt-4">
              {ratings.map((r) => (
                <div key={r.id} className="bg-card rounded-xl p-4 shadow-sm border flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{r.display_name || "User"}</p>
                      <span className="text-amber-500">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground line-clamp-2">{r.comment}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => delRating(r.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              {ratings.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No ratings.</p>}
            </TabsContent>

            <TabsContent value="users" className="space-y-2 mt-4">
              {profiles.map((p) => (
                <div key={p.id} className="bg-card rounded-xl p-4 shadow-sm border flex items-center gap-3">
                  {p.avatar_url ? <img src={p.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" /> : <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">{(p.display_name || "U")[0]}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{p.display_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.id}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="projects" className="space-y-2 mt-4">
              {projects.map((p) => (
                <div key={p.id} className="bg-card rounded-xl p-4 shadow-sm border flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.file_name || "—"} • {p.is_public ? "🌍 Public" : "🔒 Private"}</p>
                  </div>
                  {p.is_public && p.share_token && (
                    <a href={`/share/${p.share_token}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input"><ExternalLink className="h-3 w-3" /></a>
                  )}
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Reply dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to {replyTo?.name}</DialogTitle>
          </DialogHeader>
          {replyTo && (
            <div className="space-y-3">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="font-semibold text-xs text-muted-foreground">ORIGINAL MESSAGE</p>
                {replyTo.subject && <p className="font-medium mt-1">{replyTo.subject}</p>}
                <p className="text-foreground/80 whitespace-pre-wrap mt-1">{replyTo.message}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Your reply</Label>
                <Textarea rows={6} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply…" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReplyOpen(false)}>Cancel</Button>
                <Button onClick={sendReply} disabled={!replyText.trim()}><Send className="h-3 w-3 mr-1" />Save & Open WhatsApp</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminPage;
