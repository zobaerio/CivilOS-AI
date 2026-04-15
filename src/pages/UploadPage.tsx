import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileImage, ArrowRight } from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const UploadPage = () => {
  const navigate = useNavigate();
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
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
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
            <h1 className="font-heading text-3xl md:text-4xl font-bold">Upload Your Design</h1>
            <p className="text-muted-foreground">Upload a floor plan and provide project details for your estimate.</p>
          </div>

          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragging ? "border-accent bg-accent/5" : "border-border bg-card"
            }`}
          >
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-card" />
                <p className="text-sm text-muted-foreground">{file?.name}</p>
                <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null); }}>
                  Remove
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer space-y-3 block">
                <FileImage className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="font-medium text-foreground">Drag & drop your design here</p>
                <p className="text-sm text-muted-foreground">or click to browse — JPG, PNG, PDF supported</p>
                <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Project details */}
          <div className="bg-card rounded-xl shadow-card p-6 space-y-6">
            <h2 className="font-heading text-xl font-semibold">Project Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Plot Length</label>
                <input className={inputClass} type="number" value={plotLength} onChange={(e) => setPlotLength(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Plot Width</label>
                <input className={inputClass} type="number" value={plotWidth} onChange={(e) => setPlotWidth(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Unit System</label>
                <select className={selectClass} value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="feet">Feet</option>
                  <option value="meters">Meters</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Number of Floors</label>
                <input className={inputClass} type="number" value={floors} onChange={(e) => setFloors(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Floor Height ({unit})</label>
                <input className={inputClass} type="number" value={floorHeight} onChange={(e) => setFloorHeight(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Wall Thickness (inch)</label>
                <input className={inputClass} type="number" value={wallThickness} onChange={(e) => setWallThickness(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Project Type</label>
                <select className={selectClass} value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                  <option value="single">Single-Storied House</option>
                  <option value="duplex">Duplex House</option>
                  <option value="multi">Multi-Storied Building</option>
                  <option value="commercial">Commercial Building</option>
                  <option value="shop_home">Shop + Home Combo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Construction Quality</label>
                <select className={selectClass} value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="economy">Economy</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Foundation Type</label>
                <select className={selectClass} value={foundationType} onChange={(e) => setFoundationType(e.target.value)}>
                  <option value="strip">Strip Foundation</option>
                  <option value="isolated">Isolated Footing</option>
                  <option value="raft">Raft Foundation</option>
                  <option value="pile">Pile Foundation</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Roof / Slab Type</label>
                <select className={selectClass} value={roofType} onChange={(e) => setRoofType(e.target.value)}>
                  <option value="rcc_slab">RCC Slab</option>
                  <option value="tin_shade">Tin Shade</option>
                  <option value="flat_roof">Flat Roof</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <Button size="lg" onClick={handleAnalyze}>
                Analyze Design <ArrowRight className="h-4 w-4 ml-1" />
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
