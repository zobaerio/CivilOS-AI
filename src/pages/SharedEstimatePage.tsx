import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const SharedEstimatePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ name?: string; fileName?: string; area?: number } | null>(null);

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
      const inputs = data.inputs as any;
      setMeta({ name: data.name, fileName: data.file_name || undefined, area: inputs?.area });
      navigate("/estimate/demo", {
        replace: true,
        state: { ...inputs, _projectName: data.name, _shared: true, fileName: data.file_name },
      });
    })();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={meta?.name ? `${meta.name} — Construction Estimate` : "Shared Construction Estimate"}
        description={
          meta
            ? `View the AI-generated BNBC 2020 construction estimate${meta.area ? ` for a ${meta.area} sqft house` : ""} — full BOQ, structural analysis, and 3D model.`
            : "View a shared AI-generated construction estimate with BOQ, BNBC structural analysis, and 3D model."
        }
        type="article"
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <p>Shared link not found or no longer public.</p>}
      </main>
      <Footer />
    </div>
  );
};

export default SharedEstimatePage;
