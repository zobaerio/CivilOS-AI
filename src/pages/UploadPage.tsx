import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import AIThinking from "@/components/AIThinking";
import { Button } from "@/components/ui/button";
import { FileImage, ArrowRight, FileCode } from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { parseDXF, type DxfSummary } from "@/lib/dxfParser";
import { toast } from "sonner";

const UploadPage = () => {
  const [dxfSummary, setDxfSummary] = useState<DxfSummary | null>(null);
  const navigate = useNavigate();
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dxfText, setDxfText] = useState<string>("");
  const [dragging, setDragging] = useState(false);

  const [plotLength, setPlotLength] = useState("40");
  const [plotWidth, setPlotWidth] = useState("30");
  const [unit, setUnit] = useState("feet");
  const [floors, setFloors] = useState("1");
  const [floorHeight, setFloorHeight] = useState("10");
  const [wallThickness, setWallThickness] = useState("5");
  const [projectType, setProjectType] = useState("single");
  const [quality, setQuality] = useState("standard");
  const [foundationType, setFoundationType] = useState("strip");
  const [roofType, setRoofType] = useState("rcc_slab");
  const [sector, setSector] = useState("private");

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setDxfSummary(null);
    setDxfText("");
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else if (/\.dxf$/i.test(f.name)) {
      setPreview(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const txt = String(e.target?.result || "");
        setDxfText(txt);
        try {
          const summary = parseDXF(txt);
          setDxfSummary(summary);
          toast.success(`DXF parsed: ${summary.totalEntities} entities, ${Object.keys(summary.layers).length} layers`);
        } catch {
          toast.error("Could not parse DXF file");
        }
      };
      reader.readAsText(f);
    } else if (/\.dwg$/i.test(f.name)) {
      setPreview(null);
      toast.info("DWG accepted. AI will still analyze metadata — for full geometry please export as DXF.");
    } else if (f.type === "application/pdf" || /\.(pdf|txt|doc|docx)$/i.test(f.name)) {
      setPreview(null);
      toast.success(`${f.name} ready for AI analysis`);
    } else {
      setPreview(null);
      toast.success(`${f.name} ready — AI will inspect this file`);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = () => {
    navigate("/estimate/demo", {
      state: {
        plotLength: parseFloat(plotLength),
        plotWidth: parseFloat(plotWidth),
        unit, floors: parseInt(floors),
        floorHeight: parseFloat(floorHeight),
        wallThickness: parseFloat(wallThickness),
        projectType, quality, foundationType, roofType, sector,
        fileName: file?.name || "Demo Project",
      },
    });
  };

  const selectClass = "w-full h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const inputClass = selectClass;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Upload Building Design" description="Upload your floor plan, photo, PDF, or DXF — our AI instantly analyzes it for BNBC-compliant construction estimation." />
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl md:text-4xl font-bold">{t("upload.title")}</h1>
            <p className="text-muted-foreground">{t("upload.subtitle")}</p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragging ? "border-accent bg-accent/5" : "border-border bg-card"}`}
          >
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-card" />
                <p className="text-sm text-muted-foreground">{file?.name}</p>
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null); setDxfSummary(null); }}>{t("upload.remove")}</Button>
              </div>
            ) : file && !preview ? (
              <div className="space-y-3">
                <FileCode className="h-12 w-12 text-accent mx-auto" />
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setDxfSummary(null); }}>{t("upload.remove")}</Button>
              </div>
            ) : (
              <label className="cursor-pointer space-y-3 block">
                <FileImage className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="font-medium text-foreground">{t("upload.dragDrop")}</p>
                <p className="text-sm text-muted-foreground">Any file: JPG, PNG, PDF, DXF, DWG, DOCX, TXT — AI will inspect it</p>
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {dxfSummary && (
            <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
              <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
                <FileCode className="h-5 w-5 text-accent" /> DXF Detection Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-muted/40 rounded-lg p-3"><p className="text-xs text-muted-foreground">Lines</p><p className="font-bold">{dxfSummary.totalEntities}</p></div>
                <div className="bg-muted/40 rounded-lg p-3"><p className="text-xs text-muted-foreground">Layers</p><p className="font-bold">{Object.keys(dxfSummary.layers).length}</p></div>
                <div className="bg-muted/40 rounded-lg p-3"><p className="text-xs text-muted-foreground">Wall Length</p><p className="font-bold">{dxfSummary.estimatedWallLength.toFixed(0)}</p></div>
                <div className="bg-muted/40 rounded-lg p-3"><p className="text-xs text-muted-foreground">Detected Columns</p><p className="font-bold">{dxfSummary.detectedColumns}</p></div>
              </div>
              <p className="text-xs text-muted-foreground">Layers found: {Object.keys(dxfSummary.layers).slice(0, 8).join(", ")}</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">⚠ Approximate detection — please verify dimensions below.</p>
            </div>
          )}

          {file && (
            <AIThinking
              file={file}
              fileName={file.name}
              textContent={dxfText || undefined}
              onAnalysis={(a) => {
                const d = a?.detected || {};
                if (d.estimatedFloors) setFloors(String(d.estimatedFloors));
                if (d.estimatedArea_sqft) {
                  // derive a square-ish plot from area (sqft) so the form is plausible
                  const side = Math.round(Math.sqrt(d.estimatedArea_sqft));
                  setPlotLength(String(side));
                  setPlotWidth(String(side));
                  setUnit("feet");
                }
                const q = a?.estimateHints?.suggestedQuality;
                if (q === "premium" || q === "luxury") setQuality("premium");
                else if (q === "standard") setQuality("standard");
                const bt = (d.buildingType || "").toLowerCase();
                if (bt.includes("duplex")) setProjectType("duplex");
                else if (bt.includes("commerc")) setProjectType("commercial");
                else if (bt.includes("apartment") || bt.includes("multi")) setProjectType("multi");
                else if (bt.includes("shop")) setProjectType("shop_home");
                else if (bt) setProjectType("single");
                toast.success("Project Details auto-filled — review or edit manually");
              }}
            />
          )}

          <div className="bg-card rounded-xl shadow-card p-6 space-y-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-heading text-xl font-semibold">{t("upload.projectDetails")}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  AI Thinking will auto-fill these from your upload — you can also edit any field manually.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.plotLength")}</label>
                <input className={inputClass} type="number" value={plotLength} onChange={(e) => setPlotLength(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.plotWidth")}</label>
                <input className={inputClass} type="number" value={plotWidth} onChange={(e) => setPlotWidth(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.unitSystem")}</label>
                <select className={selectClass} value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="feet">{t("upload.feet")}</option>
                  <option value="meters">{t("upload.meters")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.numFloors")}</label>
                <input className={inputClass} type="number" value={floors} onChange={(e) => setFloors(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.floorHeight")} ({unit === "feet" ? t("upload.feet") : t("upload.meters")})</label>
                <input className={inputClass} type="number" value={floorHeight} onChange={(e) => setFloorHeight(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.wallThickness")}</label>
                <input className={inputClass} type="number" value={wallThickness} onChange={(e) => setWallThickness(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.projectType")}</label>
                <select className={selectClass} value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                  <option value="single">{t("upload.single")}</option>
                  <option value="duplex">{t("upload.duplex")}</option>
                  <option value="multi">{t("upload.multi")}</option>
                  <option value="commercial">{t("upload.commercial")}</option>
                  <option value="shop_home">{t("upload.shopHome")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.quality")}</label>
                <select className={selectClass} value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="economy">{t("upload.economy")}</option>
                  <option value="standard">{t("upload.standard")}</option>
                  <option value="premium">{t("upload.premium")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.foundation")}</label>
                <select className={selectClass} value={foundationType} onChange={(e) => setFoundationType(e.target.value)}>
                  <option value="strip">{t("upload.strip")}</option>
                  <option value="isolated">{t("upload.isolated")}</option>
                  <option value="raft">{t("upload.raft")}</option>
                  <option value="pile">{t("upload.pile")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("upload.roofType")}</label>
                <select className={selectClass} value={roofType} onChange={(e) => setRoofType(e.target.value)}>
                  <option value="rcc_slab">{t("upload.rccSlab")}</option>
                  <option value="tin_shade">{t("upload.tinShade")}</option>
                  <option value="flat_roof">{t("upload.flatRoof")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Project Sector / প্রকল্পের ধরন</label>
                <select className={selectClass} value={sector} onChange={(e) => setSector(e.target.value)}>
                  <option value="private">Private (বেসরকারি)</option>
                  <option value="government">Government (সরকারি)</option>
                  <option value="semi_government">Semi-Government (আধা-সরকারি)</option>
                  <option value="ngo">NGO / Non-profit</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex justify-center">
              <Button size="lg" onClick={handleAnalyze}>
                {t("upload.analyze")} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadPage;
