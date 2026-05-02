import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { FileText, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectRow {
  id: string;
  name: string;
  file_name: string | null;
  inputs: any;
  created_at: string;
  updated_at: string;
}

const ProjectsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, file_name, inputs, created_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) toast.error(error.message);
      else setItems((data as ProjectRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success("Project deleted");
  };

  const open = (p: ProjectRow) => {
    navigate("/estimate/demo", { state: { ...p.inputs, _projectId: p.id, _projectName: p.name } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">My Projects</h1>
              <p className="text-sm text-muted-foreground">All your saved estimates and BNBC reports.</p>
            </div>
            <Button asChild><Link to="/upload"><Plus className="h-4 w-4 mr-1" /> New project</Link></Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : items.length === 0 ? (
            <div className="bg-card rounded-xl shadow-card p-12 text-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="font-medium">No projects yet</p>
              <p className="text-sm text-muted-foreground">Upload a design to create your first estimate.</p>
              <Button asChild><Link to="/upload">Upload Design</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <div key={p.id} className="bg-card rounded-xl shadow-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-heading font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.file_name || "—"}</p>
                    </div>
                    <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive shrink-0" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Plot: {p.inputs?.plotLength}×{p.inputs?.plotWidth} {p.inputs?.unit}</p>
                    <p>Floors: {p.inputs?.floors} • Quality: {p.inputs?.quality}</p>
                    <p>Updated: {new Date(p.updated_at).toLocaleString()}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => open(p)}>Open estimate</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectsPage;
