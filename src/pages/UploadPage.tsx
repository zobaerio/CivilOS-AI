import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setDxfSummary(null);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else if (/\.dxf$/i.test(f.name)) {
      setPreview(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const summary = parseDXF(String(e.target?.result || ""));
          setDxfSummary(summary);
          toast.success(`DXF parsed: ${summary.totalEntities} entities, ${Object.keys(summary.layers).length} layers`);
        } catch {
          toast.error("Could not parse DXF file");
        }
      };
      reader.readAsText(f);
    } else if (/\.dwg$/i.test(f.name)) {
      setPreview(null);
      toast.info("DWG accepted. Binary DWG parsing coming soon — please export as DXF for full detection.");
    } else {
      setPreview(null);
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
        projectType, quality, foundationType, roofType,
        fileName: file?.name || "Demo Project",
      },
    });
  };

  const selectClass = "w-full h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const inputClass = selectClass;

  return (
    <div className="min-h-screen flex flex-col">
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
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null); }}>{t("upload.remove")}</Button>
              </div>
            ) : (
              <label className="cursor-pointer space-y-3 block">
                <FileImage className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="font-medium text-foreground">{t("upload.dragDrop")}</p>
                <p className="text-sm text-muted-foreground">{t("upload.browse")}</p>
                <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-card p-6 space-y-6">
            <h2 className="font-heading text-xl font-semibold">{t("upload.projectDetails")}</h2>
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
