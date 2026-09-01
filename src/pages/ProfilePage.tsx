import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { usePwaInstall } from "@/lib/pwa";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw, Upload } from "lucide-react";

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { checkForUpdate, applyUpdate } = usePwaInstall();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const runUpdateCheck = async () => {
    setCheckingUpdate(true);
    try {
      const hasUpdate = await checkForUpdate();
      if (hasUpdate) {
        toast.success("New version found — reloading…");
        await applyUpdate();
      } else {
        toast.info("You're already on the latest version.");
      }
    } catch {
      toast.error("Couldn't check for updates. Check your connection and try again.");
    } finally {
      setCheckingUpdate(false);
    }
  };


  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle();
      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, avatar_url: avatarUrl }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    setUploading(false);
    toast.success("Avatar uploaded");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container max-w-xl space-y-6">
          <h1 className="font-heading text-3xl font-bold">Profile Settings</h1>
          <div className="bg-card rounded-xl shadow-card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback>{displayName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  Change avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG/JPG, ~1MB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>

          <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">App version</h2>
              <p className="text-sm text-muted-foreground">
                Check whether a newer build of CivilOS AI has been deployed and reload instantly.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={runUpdateCheck} disabled={checkingUpdate}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checkingUpdate ? "animate-spin" : ""}`} />
              {checkingUpdate ? "Checking for updates…" : "Check for updates"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
