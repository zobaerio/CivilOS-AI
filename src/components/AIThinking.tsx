import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Analysis {
  summary?: string;
  detected?: {
    buildingType?: string;
    estimatedArea_sqft?: number | null;
    estimatedFloors?: number | null;
    rooms?: string[];
  };
  engineeringNotes?: string[];
  warnings?: string[];
  recommendations?: string[];
  estimateHints?: { suggestedQuality?: string; specialConsiderations?: string[] };
}

interface Props {
  file?: File | null;
  textContent?: string;
  fileName?: string;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const AIThinking = ({ file, textContent, fileName }: Props) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [thinkSteps, setThinkSteps] = useState<string[]>([]);

  const run = async () => {
    setLoading(true);
    setAnalysis(null);
    setThinkSteps([
      "📥 Reading uploaded content…",
      "🔍 Detecting structure & elements…",
      "📐 Cross-checking BNBC 2020 requirements…",
      "💡 Generating engineering recommendations…",
    ]);

    try {
      let dataUrl: string | undefined;
      let mimeType = file?.type;
      if (file && (file.type.startsWith("image/") || file.size < 5 * 1024 * 1024)) {
        if (file.type.startsWith("image/")) dataUrl = await fileToDataUrl(file);
      }

      const { data, error } = await supabase.functions.invoke("ai-analyze", {
        body: {
          fileName: fileName || file?.name,
          mimeType,
          dataUrl,
          textContent,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      toast.success("AI analysis complete");
    } catch (e: any) {
      toast.error(e.message || "AI analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <div>
            <h3 className="font-heading font-bold">AI Thinking</h3>
            <p className="text-xs text-muted-foreground">Gemini 2.5 Pro reviews your upload for accuracy.</p>
          </div>
        </div>
        <Button size="sm" onClick={run} disabled={loading || (!file && !textContent)}>
          {loading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Thinking…</> : "Run AI Analysis"}
        </Button>
      </div>

      {loading && (
        <ul className="space-y-1.5 text-sm">
          {thinkSteps.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-muted-foreground animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
              {s}
            </li>
          ))}
        </ul>
      )}

      {analysis && (
        <div className="space-y-4 text-sm">
          {analysis.summary && (
            <div className="bg-card rounded-lg p-3">
              <p className="font-semibold text-xs text-muted-foreground mb-1">SUMMARY</p>
              <p>{analysis.summary}</p>
            </div>
          )}

          {analysis.detected && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {analysis.detected.buildingType && <div className="bg-card rounded-lg p-2"><p className="text-[10px] text-muted-foreground">TYPE</p><p className="font-semibold">{analysis.detected.buildingType}</p></div>}
              {analysis.detected.estimatedArea_sqft && <div className="bg-card rounded-lg p-2"><p className="text-[10px] text-muted-foreground">AREA</p><p className="font-semibold">{analysis.detected.estimatedArea_sqft} sqft</p></div>}
              {analysis.detected.estimatedFloors && <div className="bg-card rounded-lg p-2"><p className="text-[10px] text-muted-foreground">FLOORS</p><p className="font-semibold">{analysis.detected.estimatedFloors}</p></div>}
              {analysis.detected.rooms && analysis.detected.rooms.length > 0 && <div className="bg-card rounded-lg p-2 col-span-2 sm:col-span-1"><p className="text-[10px] text-muted-foreground">ROOMS</p><p className="font-semibold text-xs">{analysis.detected.rooms.length}</p></div>}
            </div>
          )}

          {analysis.warnings && analysis.warnings.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="font-semibold text-xs flex items-center gap-1 mb-2 text-destructive"><AlertTriangle className="h-3 w-3" />WARNINGS</p>
              <ul className="space-y-1 list-disc list-inside text-xs">{analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}

          {analysis.engineeringNotes && analysis.engineeringNotes.length > 0 && (
            <div>
              <p className="font-semibold text-xs flex items-center gap-1 mb-2"><CheckCircle2 className="h-3 w-3 text-primary" />ENGINEERING NOTES</p>
              <ul className="space-y-1 list-disc list-inside text-xs text-muted-foreground">{analysis.engineeringNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
              <p className="font-semibold text-xs flex items-center gap-1 mb-2 text-accent"><Lightbulb className="h-3 w-3" />RECOMMENDATIONS</p>
              <ul className="space-y-1 list-disc list-inside text-xs">{analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIThinking;
