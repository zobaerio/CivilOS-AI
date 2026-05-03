import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, Trash2, Star, Check, X, Crown, Users, FolderKanban, Building, MessageSquare } from "lucide-react";

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [newSponsor, setNewSponsor] = useState({ name: "", logo_url: "", website: "", description: "", contact_email: "" });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/admin");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  const loadAll = async () => {
    const [s, r, p, pr] = await Promise.all([
      supabase.from("sponsors").select("*").order("created_at", { ascending: false }),
      supabase.from("ratings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name, user_id, file_name, is_public, share_token, created_at").order("created_at", { ascending: false }),
    ]);
    setSponsors(s.data || []);
    setRatings(r.data || []);
    setProfiles(p.data || []);
    setProjects(pr.data || []);
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

  const setSponsorStatus = async (id: string, status: string) => {
    await supabase.from("sponsors").update({ status }).eq("id", id);
    loadAll();
    toast.success(`Sponsor ${status}`);
  };
  const toggleFeatured = async (id: string, featured: boolean) => {
    await supabase.from("sponsors").update({ featured }).eq("id", id);
    loadAll();
  };
  const delSponsor = async (id: string) => { await supabase.from("sponsors").delete().eq("id", id); loadAll(); };
  const delRating = async (id: string) => { await supabase.from("ratings").delete().eq("id", id); loadAll(); };
  const addSponsor = async () => {
    if (!newSponsor.name) return toast.error("Name required");
    const { error } = await supabase.from("sponsors").insert({ ...newSponsor, status: "active" });
    if (error) return toast.error(error.message);
    setNewSponsor({ name: "", logo_url: "", website: "", description: "", contact_email: "" });
    loadAll();
    toast.success("Sponsor added");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container space-y-6">
          <div className="flex items-center gap-3">
            <Crown className="h-7 w-7 text-accent" />
            <div>
              <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage sponsors, ratings, users and projects.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card rounded-xl p-4 shadow-card"><Users className="h-4 w-4 text-accent" /><p className="text-2xl font-bold mt-2">{profiles.length}</p><p className="text-xs text-muted-foreground">Users</p></div>
            <div className="bg-card rounded-xl p-4 shadow-card"><FolderKanban className="h-4 w-4 text-accent" /><p className="text-2xl font-bold mt-2">{projects.length}</p><p className="text-xs text-muted-foreground">Projects</p></div>
            <div className="bg-card rounded-xl p-4 shadow-card"><Star className="h-4 w-4 text-accent" /><p className="text-2xl font-bold mt-2">{ratings.length}</p><p className="text-xs text-muted-foreground">Ratings</p></div>
            <div className="bg-card rounded-xl p-4 shadow-card"><Building className="h-4 w-4 text-accent" /><p className="text-2xl font-bold mt-2">{sponsors.length}</p><p className="text-xs text-muted-foreground">Sponsors</p></div>
          </div>

          <Tabs defaultValue="sponsors">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="sponsors"><Building className="h-4 w-4 mr-1" />Sponsors</TabsTrigger>
              <TabsTrigger value="ratings"><Star className="h-4 w-4 mr-1" />Ratings</TabsTrigger>
              <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger>
              <TabsTrigger value="projects"><FolderKanban className="h-4 w-4 mr-1" />Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="sponsors" className="space-y-4">
              <div className="bg-card rounded-xl p-5 shadow-card space-y-3">
                <h3 className="font-semibold">Add sponsor manually</h3>
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
                  <div key={s.id} className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      {s.logo_url && <img src={s.logo_url} className="h-10 w-10 object-contain" alt="" />}
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{s.name} {s.featured && <Badge className="ml-1 bg-accent">Featured</Badge>}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.contact_email} • {s.website}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant={s.status === "active" ? "default" : s.status === "pending" ? "secondary" : "destructive"}>{s.status}</Badge>
                      {s.status !== "active" && <Button size="sm" variant="outline" onClick={() => setSponsorStatus(s.id, "active")}><Check className="h-3 w-3" /></Button>}
                      {s.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => setSponsorStatus(s.id, "rejected")}><X className="h-3 w-3" /></Button>}
                      <Button size="sm" variant="outline" onClick={() => toggleFeatured(s.id, !s.featured)}><Star className={`h-3 w-3 ${s.featured ? "fill-accent" : ""}`} /></Button>
                      <Button size="sm" variant="outline" onClick={() => delSponsor(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ratings" className="space-y-2">
              {ratings.map((r) => (
                <div key={r.id} className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{r.display_name || "User"}</p>
                      <span className="text-yellow-500">{"★".repeat(r.stars)}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground line-clamp-2">{r.comment}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => delRating(r.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              {ratings.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No ratings.</p>}
            </TabsContent>

            <TabsContent value="users" className="space-y-2">
              {profiles.map((p) => (
                <div key={p.id} className="bg-card rounded-xl p-4 shadow-card flex items-center gap-3">
                  {p.avatar_url ? <img src={p.avatar_url} className="h-10 w-10 rounded-full" alt="" /> : <div className="h-10 w-10 rounded-full bg-muted" />}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.display_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.id}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="projects" className="space-y-2">
              {projects.map((p) => (
                <div key={p.id} className="bg-card rounded-xl p-4 shadow-card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.file_name || "—"} • {p.is_public ? "Public" : "Private"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
