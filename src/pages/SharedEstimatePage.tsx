import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const SharedEstimatePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, inputs, file_name, is_public, share_token")
        .eq("share_token", token)
        .eq("is_public", true)
        .maybeSingle();
      if (error || !data) {
        setLoading(false);
        return;
      }
      navigate("/estimate/demo", {
        replace: true,
        state: { ...(data.inputs as any), _projectName: data.name, _shared: true, fileName: data.file_name },
      });
    })();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <p>Shared link not found or no longer public.</p>}
      </main>
      <Footer />
    </div>
  );
};

export default SharedEstimatePage;
