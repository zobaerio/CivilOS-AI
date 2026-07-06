import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, Upload, Trash2, UserPlus, Lock, FileText, ArrowLeft, Users, Activity } from "lucide-react";
import { toast } from "sonner";

type Role = "admin" | "engineer" | "viewer";
const roleColor: Record<Role, string> = {
  admin: "bg-red-500/15 text-red-600 border-red-500/30",
  engineer: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  viewer: "bg-gray-500/15 text-gray-600 border-gray-500/30",
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");

  const load = async () => {
    if (!id || !user) return;
    const { data: proj, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error) { toast.error("Project not found"); navigate("/projects"); return; }
    setProject(proj);
    // resolve role
    if (proj.user_id === user.id) setRole("admin");
    else {
      const { data: mem } = await (supabase as any).from("project_members")
        .select("role").eq("project_id", id).eq("user_id", user.id).maybeSingle();
      setRole((mem?.role as Role) || null);
    }
    const [d, m, iv, act] = await Promise.all([
      (supabase as any).from("project_documents").select("*").eq("project_id", id).order("created_at",{ascending:false}),
      (supabase as any).from("project_members").select("*, profiles:user_id(display_name, avatar_url)").eq("project_id", id),
      (supabase as any).from("invitations").select("*").eq("project_id", id).eq("status","pending"),
      (supabase as any).from("project_activity").select("*, profiles:user_id(display_name)").eq("project_id", id).order("created_at",{ascending:false}).limit(50),
    ]);
    setDocs(d.data || []); setMembers(m.data || []); setInvites(iv.data || []); setActivity(act.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id, user]);

  const canEdit = role === "admin" || role === "engineer";
  const isAdmin = role === "admin";

  const logActivity = async (action: string, details: any = {}) => {
    if (!user || !id) return;
    await (supabase as any).from("project_activity").insert({ project_id: id, user_id: user.id, action, details });
  };

  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !id || !user) return;
    setUploading(true);
    try {
      const path = `${id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("project-documents").upload(path, file);
      if (error) throw error;
      const { data: signed } = await supabase.storage.from("project-documents").createSignedUrl(path, 60 * 60 * 24 * 365);
      await (supabase as any).from("project_documents").insert({
        project_id: id, file_name: file.name, file_url: path, file_type: file.type, file_size: file.size, uploaded_by: user.id,
      });
      await logActivity("document_uploaded", { file_name: file.name });
      toast.success("ফাইল আপলোড সফল");
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const downloadDoc = async (d: any) => {
    const { data } = await supabase.storage.from("project-documents").createSignedUrl(d.file_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const deleteDoc = async (d: any) => {
    await supabase.storage.from("project-documents").remove([d.file_url]);
    await (supabase as any).from("project_documents").delete().eq("id", d.id);
    toast.success("Deleted"); load();
  };

  const sendInvite = async () => {
    if (!inviteEmail || !id || !user) return;
    const { data, error } = await (supabase as any).from("invitations").insert({
      project_id: id, invited_email: inviteEmail.trim().toLowerCase(), role: inviteRole, invited_by: user.id,
    }).select().single();
    if (error) return toast.error(error.message);
    // Try to notify existing user
    const { data: p } = await supabase.from("profiles").select("id").limit(1);
    // best-effort notification (email lookup requires admin; skip)
    toast.success(`Invitation sent to ${inviteEmail}`);
    await logActivity("member_invited", { email: inviteEmail, role: inviteRole });
    setInviteEmail(""); load();
  };

  const cancelInvite = async (invId: string) => {
    await (supabase as any).from("invitations").delete().eq("id", invId);
    load();
  };

  const removeMember = async (memId: string) => {
    await (supabase as any).from("project_members").delete().eq("id", memId);
    toast.success("Member removed"); load();
  };

  const updateStatus = async (status: string) => {
    await supabase.from("projects").update({ status } as any).eq("id", id!);
    setProject({ ...project, status });
    await logActivity("status_changed", { status });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;
  if (!role) return <div className="min-h-screen flex items-center justify-center flex-col gap-3"><Lock className="h-8 w-8"/><p>You don't have access to this project.</p><Button onClick={()=>navigate("/projects")}>Back</Button></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container max-w-6xl space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={()=>navigate("/projects")}><ArrowLeft className="h-4 w-4 mr-1"/>Projects</Button>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.client_name} · {project.location} · {project.project_type}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={roleColor[role]} variant="outline">{role.toUpperCase()}</Badge>
              {isAdmin ? (
                <Select value={project.status} onValueChange={updateStatus}>
                  <SelectTrigger className="w-36"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : <Badge variant="outline">{project.status}</Badge>}
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="boq">BOQ</TabsTrigger>
              <TabsTrigger value="bbs">BBS</TabsTrigger>
              <TabsTrigger value="estimates">Estimates</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardHeader><CardTitle className="text-sm">Budget</CardTitle></CardHeader><CardContent className="text-2xl font-bold">৳{project.budget?.toLocaleString() || "—"}</CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm">Documents</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{docs.length}</CardContent></Card>
                <Card><CardHeader><CardTitle className="text-sm">Team Members</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{members.length + 1}</CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Project Info</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><b>Start:</b> {project.start_date || "—"}</p>
                  <p><b>End:</b> {project.end_date || "—"}</p>
                  <p><b>Status:</b> {project.status}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {["boq","bbs","estimates"].map(t => (
              <TabsContent key={t} value={t}>
                <Card><CardContent className="py-10 text-center space-y-3">
                  <p className="text-muted-foreground">Open {t.toUpperCase()} tools scoped to this project.</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button asChild variant="outline"><Link to={`/boq-hub?project=${id}`}>BOQ Hub</Link></Button>
                    <Button asChild variant="outline"><Link to={`/boq?project=${id}`}>BOQ Generator</Link></Button>
                    <Button asChild variant="outline"><Link to={`/rate-analysis?project=${id}`}>Rate Analysis</Link></Button>
                    <Button asChild variant="outline"><Link to={`/estimate/demo`}>Estimator</Link></Button>
                  </div>
                </CardContent></Card>
              </TabsContent>
            ))}

            <TabsContent value="documents" className="space-y-4">
              {canEdit && (
                <div>
                  <input id="file" type="file" className="hidden" onChange={uploadDoc}
                    accept=".pdf,.dwg,.dxf,image/*,.doc,.docx,.xls,.xlsx"/>
                  <Button asChild disabled={uploading}>
                    <label htmlFor="file" className="cursor-pointer">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
                      Upload Document
                    </label>
                  </Button>
                </div>
              )}
              <div className="border rounded-lg divide-y">
                {docs.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No documents yet</p> :
                  docs.map(d => (
                    <div key={d.id} className="p-3 flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0"/>
                      <button onClick={()=>downloadDoc(d)} className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{d.file_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                      </button>
                      {(isAdmin || d.uploaded_by === user?.id) &&
                        <Button size="icon" variant="ghost" onClick={()=>deleteDoc(d)}><Trash2 className="h-4 w-4"/></Button>}
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              {isAdmin ? (
                <Card><CardContent className="pt-6 flex flex-col sm:flex-row gap-2">
                  <Input placeholder="member@email.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} />
                  <Select value={inviteRole} onValueChange={(v:Role)=>setInviteRole(v)}>
                    <SelectTrigger className="w-36"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="engineer">Engineer</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={sendInvite}><UserPlus className="h-4 w-4"/>Invite</Button>
                </CardContent></Card>
              ) : <p className="text-sm text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3"/> Only admin can invite</p>}

              <div>
                <h3 className="font-semibold mb-2">Members</h3>
                <div className="border rounded-lg divide-y">
                  <div className="p-3 flex items-center justify-between">
                    <div><p className="text-sm font-medium">Owner</p><p className="text-xs text-muted-foreground">Project creator</p></div>
                    <Badge className={roleColor.admin} variant="outline">ADMIN</Badge>
                  </div>
                  {members.map(m => (
                    <div key={m.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{m.profiles?.display_name || m.user_id.slice(0,8)}</p>
                        <p className="text-xs text-muted-foreground">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleColor[m.role as Role]} variant="outline">{m.role?.toUpperCase()}</Badge>
                        {isAdmin && <Button size="icon" variant="ghost" onClick={()=>removeMember(m.id)}><Trash2 className="h-4 w-4"/></Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {invites.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Pending Invitations</h3>
                  <div className="border rounded-lg divide-y">
                    {invites.map(iv => (
                      <div key={iv.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm">{iv.invited_email}</p>
                          <p className="text-xs text-muted-foreground">{iv.role} · {new Date(iv.created_at).toLocaleDateString()}</p>
                        </div>
                        {isAdmin && <Button size="sm" variant="ghost" onClick={()=>cancelInvite(iv.id)}>Cancel</Button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity">
              <div className="border rounded-lg divide-y">
                {activity.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No activity yet</p> :
                  activity.map(a => (
                    <div key={a.id} className="p-3 flex items-start gap-3">
                      <Activity className="h-4 w-4 text-muted-foreground mt-0.5"/>
                      <div className="flex-1">
                        <p className="text-sm"><b>{a.profiles?.display_name || "Someone"}</b> {a.action.replace(/_/g," ")}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
