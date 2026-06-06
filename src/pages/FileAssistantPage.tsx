import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import AIThinking from "@/components/AIThinking";
import { FileUp, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";

const FileAssistantPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState<string>("");

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  const onPick = async (f: File) => {
    setFile(f);
    setTextContent("");
    if (f.type.startsWith("text/") || /\.(txt|md|csv|json|xml|html|js|ts|css)$/i.test(f.name)) {
      try { setTextContent(await f.text()); } catch { /* ignore */ }
    }
  };

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <>
      <SEO title="File Assistant — CivilOS AI" description="Upload drawings, plans, or documents and get instant BNBC-aware AI engineering analysis." url="/file-assistant" />
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <DashboardSidebar />
          <main className="flex-1">
            <header className="flex items-center gap-3 border-b px-4 py-3">
              <SidebarTrigger />
              <FileText className="h-5 w-5 text-accent" />
              <div>
                <h1 className="font-heading font-bold leading-tight">File Assistant</h1>
                <p className="text-xs text-muted-foreground leading-tight">Upload drawings, photos, plans or docs — AI will analyse.</p>
              </div>
            </header>

            <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
              <Card>
                <CardContent className="p-5">
                  {!file ? (
                    <label className="block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition">
                      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
                      <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-semibold">Click to upload a file</p>
                      <p className="text-xs text-muted-foreground mt-1">Images, PDFs, drawings, plans, text — up to 20MB</p>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB • {file.type || "unknown"}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => { setFile(null); setTextContent(""); }}><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {file && (
                <AIThinking
                  file={file}
                  fileName={file.name}
                  textContent={textContent}
                  onAnalysis={() => toast.success("Analysis ready")}
                />
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
};

export default FileAssistantPage;
