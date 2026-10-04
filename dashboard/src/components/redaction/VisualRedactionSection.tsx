import React, { useState, useRef } from "react";
import {
  ScanEye,
  Lock,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  FileText,
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  Play,
  Layers,
  Fingerprint,
  Cpu,
  BadgeCheck,
} from "lucide-react";
import { MOCK_RECEIPT_DETAILS } from "../../data/demoData";

type DocumentType = "receipt" | "badge";
type ViewMode = "side-by-side" | "slider" | "redacted" | "original";

interface RedactionRegion {
  id: string;
  label: string;
  tag: string;
  rawValue: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category: string;
  description: string;
}

export const VisualRedactionSection: React.FC = () => {
  const [docType, setDocType] = useState<DocumentType>("receipt");
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("guest-name");
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Redaction regions for Hotel Receipt
  const receiptRegions: RedactionRegion[] = [
    {
      id: "guest-name",
      label: "Guest Name",
      tag: "[PERSON_NAME]",
      rawValue: MOCK_RECEIPT_DETAILS.guestName,
      x: 120,
      y: 110,
      width: 140,
      height: 24,
      category: "Personal Identity",
      description: "Direct individual full name detected via receipt header pattern matching.",
    },
    {
      id: "tax-id",
      label: "GST Number",
      tag: "[TAX_ID]",
      rawValue: MOCK_RECEIPT_DETAILS.gstNumber,
      x: 120,
      y: 182,
      width: 155,
      height: 24,
      category: "Government Tax ID",
      description: "15-character statutory GST identification number with state code.",
    },
    {
      id: "card-num",
      label: "Payment Snippet",
      tag: "[CARD_SNIPPET]",
      rawValue: "VISA •••• 4821",
      x: 120,
      y: 218,
      width: 135,
      height: 24,
      category: "Financial Instrument",
      description: "Credit card brand and masked account digits subject to PCI-DSS.",
    },
    {
      id: "total-amount",
      label: "Total Expense",
      tag: "[TOTAL_AMOUNT]",
      rawValue: MOCK_RECEIPT_DETAILS.totalAmount,
      x: 180,
      y: 260,
      width: 125,
      height: 28,
      category: "Financial Total",
      description: "Final transaction value in INR masked to prevent commercial exposure.",
    },
  ];

  // Redaction regions for Employee ID Badge
  const badgeRegions: RedactionRegion[] = [
    {
      id: "photo-avatar",
      label: "Biometric Photo",
      tag: "[PHOTO_AVATAR]",
      rawValue: "Biometric Face Portrait",
      x: 24,
      y: 80,
      width: 80,
      height: 96,
      category: "Biometric Identifier",
      description: "Facial portrait bitmap containing recognizable physical biometric markers.",
    },
    {
      id: "emp-name",
      label: "Employee Name",
      tag: "[PERSON_NAME]",
      rawValue: "Rahul Sharma",
      x: 120,
      y: 84,
      width: 135,
      height: 24,
      category: "Personal Identity",
      description: "Full staff legal name printed in primary typography zone.",
    },
    {
      id: "emp-id",
      label: "Employee ID",
      tag: "[EMPLOYEE_ID]",
      rawValue: "EMP-94821-X",
      x: 120,
      y: 128,
      width: 125,
      height: 24,
      category: "Corporate Secret",
      description: "Internal single sign-on directory identifier with access level parity.",
    },
    {
      id: "barcode",
      label: "Access Barcode",
      tag: "[BARCODE_SECRET]",
      rawValue: "|| | | ||| || ||| |",
      x: 24,
      y: 200,
      width: 252,
      height: 38,
      category: "Machine-Readable Key",
      description: "Physical door-controller turnstile optical barcode encoded string.",
    },
  ];

  const activeRegions = docType === "receipt" ? receiptRegions : badgeRegions;
  const currentRegion = activeRegions.find((r) => r.id === selectedRegionId) || activeRegions[0];

  // Trigger scanning simulation
  const handleTriggerScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Studio Control Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ScanEye className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              On-Device Image Redaction Studio
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Canvas 2D Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical pixel destruction with semantic bounding replacements for Multimodal AI Agents
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Document Switcher */}
          <div className="flex items-center bg-navy-950 p-1 rounded-xl border border-navy-700/80 text-xs">
            <button
              onClick={() => {
                setDocType("receipt");
                setSelectedRegionId("guest-name");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                docType === "receipt"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Expense Receipt</span>
            </button>

            <button
              onClick={() => {
                setDocType("badge");
                setSelectedRegionId("photo-avatar");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                docType === "badge"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Employee ID Badge</span>
            </button>
          </div>

          {/* Trigger Scan Button */}
          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-all shadow-sm active:scale-95"
            title="Simulate real-time on-device OCR detection and canvas overwriting"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning Bitmap..." : "Run Redaction Scan"}</span>
          </button>
        </div>
      </div>

      {/* View Mode Selector Tabs */}
      <div className="flex items-center justify-between border-b border-navy-700/60 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Display Mode:</span>
          <button
            onClick={() => setViewMode("side-by-side")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === "side-by-side"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white bg-navy-900 border border-navy-700/60"
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            onClick={() => setViewMode("slider")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === "slider"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white bg-navy-900 border border-navy-700/60"
            }`}
          >
            Interactive Split Slider
          </button>
          <button
            onClick={() => setViewMode("redacted")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === "redacted"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-white bg-navy-900 border border-navy-700/60"
            }`}
          >
            Redacted AI View Only
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>Click any masked zone to inspect spatial coordinates</span>
        </div>
      </div>

      {/* Main Visual Display & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Canvas / Visual Rendering */}
        <div className="lg:col-span-8 space-y-4">
          {/* Side-by-Side Mode */}
          {viewMode === "side-by-side" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Side: Original Raw Document */}
              <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Original Image (Raw Viewport)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Unsanitized Source
                  </span>
                </div>

                <div className="flex justify-center p-3 bg-navy-950/80 rounded-xl border border-navy-800 relative overflow-hidden min-h-[380px] items-center">
                  {/* Laser scan animation overlay */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse z-30 pointer-events-none top-1/2 -translate-y-1/2" />
                  )}

                  {docType === "receipt" ? (
                    <ReceiptGraphic
                      mode="original"
                      selectedId={selectedRegionId}
                      onSelect={setSelectedRegionId}
                    />
                  ) : (
                    <BadgeGraphic
                      mode="original"
                      selectedId={selectedRegionId}
                      onSelect={setSelectedRegionId}
                    />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Contains raw identifying PII and confidential financial digits.
                </p>
              </div>

              {/* Right Side: Redacted Output Canvas */}
              <div className="glass-panel rounded-2xl p-5 border border-teal-500/40 bg-navy-900/90 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Redacted Image (Passed to AI)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                    Opaque Canvas Overwrite
                  </span>
                </div>

                <div className="flex justify-center p-3 bg-navy-950/80 rounded-xl border border-navy-800 relative overflow-hidden min-h-[380px] items-center">
                  {docType === "receipt" ? (
                    <ReceiptGraphic
                      mode="redacted"
                      selectedId={selectedRegionId}
                      onSelect={setSelectedRegionId}
                    />
                  ) : (
                    <BadgeGraphic
                      mode="redacted"
                      selectedId={selectedRegionId}
                      onSelect={setSelectedRegionId}
                    />
                  )}
                </div>
                <p className="text-[11px] text-teal-300/90 text-center font-medium">
                  Solid opaque pixel fill. Underlying raw data is irreversibly obliterated.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Split Slider Mode */}
          {viewMode === "slider" && (
            <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Interactive Before / After Redaction Slider
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Split Position: {sliderPos}%
                </span>
              </div>

              {/* Slider Controller */}
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="w-full h-2 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-navy-700"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>← 100% Original Raw View</span>
                  <span>Drag Slider</span>
                  <span>100% Redacted AI View →</span>
                </div>
              </div>

              {/* Interactive Split View Container */}
              <div className="flex justify-center p-6 bg-navy-950/80 rounded-xl border border-navy-800 relative overflow-hidden min-h-[420px] items-center">
                <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
                  {/* Under layer: Redacted */}
                  <div className="w-full">
                    {docType === "receipt" ? (
                      <ReceiptGraphic
                        mode="redacted"
                        selectedId={selectedRegionId}
                        onSelect={setSelectedRegionId}
                      />
                    ) : (
                      <BadgeGraphic
                        mode="redacted"
                        selectedId={selectedRegionId}
                        onSelect={setSelectedRegionId}
                      />
                    )}
                  </div>

                  {/* Over layer: Original clipped */}
                  <div
                    className="absolute inset-0 overflow-hidden border-r-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <div style={{ width: "384px" }}>
                      {docType === "receipt" ? (
                        <ReceiptGraphic
                          mode="original"
                          selectedId={selectedRegionId}
                          onSelect={setSelectedRegionId}
                        />
                      ) : (
                        <BadgeGraphic
                          mode="original"
                          selectedId={selectedRegionId}
                          onSelect={setSelectedRegionId}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Single Redacted View Mode */}
          {viewMode === "redacted" && (
            <div className="glass-panel rounded-2xl p-6 border border-teal-500/40 bg-navy-900/90 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Exported Multimodal Vision Payload (Ready for AI Model)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                  Zero Data Leakage Certified
                </span>
              </div>

              <div className="flex justify-center p-6 bg-navy-950/80 rounded-xl border border-navy-800 min-h-[420px] items-center">
                {docType === "receipt" ? (
                  <ReceiptGraphic
                    mode="redacted"
                    selectedId={selectedRegionId}
                    onSelect={setSelectedRegionId}
                  />
                ) : (
                  <BadgeGraphic
                    mode="redacted"
                    selectedId={selectedRegionId}
                    onSelect={setSelectedRegionId}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Spatial & Security Telemetry Inspector */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Redacted Region Details */}
          <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
              <div className="flex items-center gap-2">
                <ScanEye className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Region Inspector
                </h3>
              </div>
              <span className="text-[10px] font-mono text-teal-400">
                Active Target
              </span>
            </div>

            {/* Region Selector Pills */}
            <div className="flex flex-wrap gap-1.5">
              {activeRegions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegionId(region.id)}
                  className={`text-[10px] font-mono px-2 py-1 rounded transition-all ${
                    selectedRegionId === region.id
                      ? "bg-blue-600 text-white font-bold shadow-sm"
                      : "bg-navy-800 text-slate-300 hover:text-white border border-navy-700"
                  }`}
                >
                  {region.label}
                </button>
              ))}
            </div>

            {/* Inspector Metadata Card */}
            <div className="p-3.5 rounded-xl bg-navy-950/90 border border-navy-800 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Semantic Tag:</span>
                <span className="text-teal-300 font-bold px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/30">
                  {currentRegion.tag}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Entity Category:</span>
                <span className="text-white">{currentRegion.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Raw Captured:</span>
                <span className="text-amber-400/90 truncate max-w-[150px]">{currentRegion.rawValue}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Bounding Box:</span>
                <span className="text-slate-300">
                  [{currentRegion.x}, {currentRegion.y}, {currentRegion.width}, {currentRegion.height}]
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Canvas Mask:</span>
                <span className="text-blue-400">ctx.fillRect(solid 100%)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Residual Risk:</span>
                <span className="text-emerald-400 font-bold">0.00% (Bit-destroyed)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {currentRegion.description}
            </p>

            {/* Outgoing AI Structured Context */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Outgoing AI Context Grounding:
              </span>
              <div className="p-2.5 rounded-lg bg-navy-950 font-mono text-[11px] text-teal-300 border border-navy-800">
                <code>
                  &lt;redacted_region tag=&quot;{currentRegion.tag}&quot; bbox=&quot;[{currentRegion.x},{currentRegion.y},{currentRegion.width},{currentRegion.height}]&quot; /&gt;
                </code>
              </div>
            </div>
          </div>

          {/* Security Guarantee Cards */}
          <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              Information-Theoretic Security
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>No Invertible Filters:</strong> Blur or pixelation can be reversed by neural networks. Solid fills permanently rewrite RGB values to zero.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Spatial Grounding:</strong> Agent models can still pinpoint where fields are to click and interact via DOM dispatch.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Network Exposure:</strong> Canvas masking executes locally in browser WebAssembly before bitmap export.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Visual Graphic Subcomponents --- */

interface GraphicProps {
  mode: "original" | "redacted";
  selectedId: string;
  onSelect: (id: string) => void;
}

// 1. Hotel Expense Receipt Component
const ReceiptGraphic: React.FC<GraphicProps> = ({ mode, selectedId, onSelect }) => {
  const isRedacted = mode === "redacted";

  return (
    <div
      className={`w-full max-w-[340px] rounded-xl p-5 shadow-2xl transition-all duration-300 select-none font-sans ${
        isRedacted
          ? "bg-[#0b1324] text-slate-100 border-2 border-teal-500/40 shadow-teal-500/10"
          : "bg-white text-slate-900 border border-slate-200"
      }`}
    >
      {/* Receipt Header */}
      <div className="text-center pb-3 mb-3 border-b border-slate-300/40">
        <div className="text-2xl mb-1">🏨</div>
        <h4 className="font-extrabold text-sm tracking-tight text-inherit">
          {MOCK_RECEIPT_DETAILS.hotelName}
        </h4>
        <p className="text-[11px] opacity-75">{MOCK_RECEIPT_DETAILS.location}</p>
        <p className="text-[10px] font-mono mt-0.5 opacity-60">
          Ref: #{MOCK_RECEIPT_DETAILS.receiptId}
        </p>
      </div>

      {/* Rows */}
      <div className="space-y-2.5 text-xs">
        {/* Guest Name */}
        <div
          onClick={() => onSelect("guest-name")}
          className={`flex items-center justify-between p-1 rounded cursor-pointer transition-colors ${
            selectedId === "guest-name" ? "ring-2 ring-blue-400 bg-blue-500/10" : ""
          }`}
        >
          <span className="font-medium opacity-70">Guest Name:</span>
          {isRedacted ? (
            <div className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/60 shadow-sm">
              ████ [PERSON_NAME]
            </div>
          ) : (
            <span className="font-bold font-mono text-slate-900">
              {MOCK_RECEIPT_DETAILS.guestName}
            </span>
          )}
        </div>

        {/* Check-In Date */}
        <div className="flex items-center justify-between p-1">
          <span className="font-medium opacity-70">Check-In Date:</span>
          <span className="font-mono text-inherit">{MOCK_RECEIPT_DETAILS.date}</span>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between p-1">
          <span className="font-medium opacity-70">Stay Duration:</span>
          <span className="text-inherit">{MOCK_RECEIPT_DETAILS.nights}</span>
        </div>

        {/* GST Number */}
        <div
          onClick={() => onSelect("tax-id")}
          className={`flex items-center justify-between p-1 rounded cursor-pointer transition-colors ${
            selectedId === "tax-id" ? "ring-2 ring-blue-400 bg-blue-500/10" : ""
          }`}
        >
          <span className="font-medium opacity-70">GST Number:</span>
          {isRedacted ? (
            <div className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/60 shadow-sm">
              ████ [TAX_ID]
            </div>
          ) : (
            <span className="font-mono text-slate-900">{MOCK_RECEIPT_DETAILS.gstNumber}</span>
          )}
        </div>

        {/* Card Snippet */}
        <div
          onClick={() => onSelect("card-num")}
          className={`flex items-center justify-between p-1 rounded cursor-pointer transition-colors ${
            selectedId === "card-num" ? "ring-2 ring-blue-400 bg-blue-500/10" : ""
          }`}
        >
          <span className="font-medium opacity-70">Payment Ref:</span>
          {isRedacted ? (
            <div className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/60 shadow-sm">
              ████ [CARD_SNIPPET]
            </div>
          ) : (
            <span className="font-mono text-slate-900">VISA •••• 4821</span>
          )}
        </div>

        {/* Total Amount */}
        <div
          onClick={() => onSelect("total-amount")}
          className={`pt-2 border-t border-dashed border-slate-300/40 flex items-center justify-between p-1 rounded cursor-pointer transition-colors ${
            selectedId === "total-amount" ? "ring-2 ring-emerald-400 bg-emerald-500/10" : ""
          }`}
        >
          <span className="font-bold text-xs">TOTAL PAID:</span>
          {isRedacted ? (
            <div className="px-2.5 py-1 rounded bg-slate-950 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/60 shadow-sm">
              ████ [TOTAL_AMOUNT]
            </div>
          ) : (
            <span className="font-mono font-bold text-sm text-slate-900">
              {MOCK_RECEIPT_DETAILS.totalAmount}
            </span>
          )}
        </div>
      </div>

      {/* Redacted Stamp */}
      {isRedacted && (
        <div className="mt-4 pt-2.5 border-t border-teal-500/30 text-center">
          <span className="text-[10px] font-mono text-teal-300 uppercase tracking-wider flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-teal-400" />
            Zero Raw Pixels Exported
          </span>
        </div>
      )}
    </div>
  );
};

// 2. Employee Identity Badge Component
const BadgeGraphic: React.FC<GraphicProps> = ({ mode, selectedId, onSelect }) => {
  const isRedacted = mode === "redacted";

  return (
    <div
      className={`w-full max-w-[340px] rounded-2xl p-5 shadow-2xl transition-all duration-300 select-none font-sans relative ${
        isRedacted
          ? "bg-[#0a1122] text-slate-100 border-2 border-blue-500/40 shadow-blue-500/10"
          : "bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-700"
      }`}
    >
      {/* Top Lanyard Slot Clip */}
      <div className="w-12 h-2 rounded-full bg-slate-700/60 mx-auto mb-3 border border-slate-600"></div>

      {/* Company Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <BadgeCheck className="w-4 h-4 text-blue-400" />
          <span className="font-extrabold text-xs tracking-wider uppercase">ACME GLOBAL</span>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
          SECURITY LEVEL: 3
        </span>
      </div>

      {/* Photo & Identity Section */}
      <div className="flex items-start gap-3 mb-3">
        {/* Photo Avatar */}
        <div
          onClick={() => onSelect("photo-avatar")}
          className={`w-20 h-24 rounded-lg overflow-hidden border-2 cursor-pointer transition-all flex items-center justify-center ${
            selectedId === "photo-avatar" ? "ring-2 ring-blue-400" : ""
          } ${isRedacted ? "bg-slate-950 border-cyan-500/60" : "bg-slate-800 border-slate-600"}`}
        >
          {isRedacted ? (
            <div className="text-center p-1">
              <span className="text-[9px] font-mono text-cyan-400 font-bold block leading-tight">
                ██████
              </span>
              <span className="text-[8px] font-mono text-cyan-300 uppercase block mt-1">
                [PHOTO_AVATAR]
              </span>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-600/40 mx-auto mb-1 flex items-center justify-center text-lg">
                👤
              </div>
              <span className="text-[9px] font-mono text-slate-300">Biometric</span>
            </div>
          )}
        </div>

        {/* Identity Details */}
        <div className="flex-1 space-y-2">
          {/* Name */}
          <div
            onClick={() => onSelect("emp-name")}
            className={`p-1 rounded cursor-pointer transition-colors ${
              selectedId === "emp-name" ? "ring-2 ring-blue-400 bg-blue-500/10" : ""
            }`}
          >
            <span className="text-[10px] text-slate-400 block">Name:</span>
            {isRedacted ? (
              <div className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/60">
                ████ [PERSON_NAME]
              </div>
            ) : (
              <span className="font-bold text-xs text-white">Rahul Sharma</span>
            )}
          </div>

          {/* Employee ID */}
          <div
            onClick={() => onSelect("emp-id")}
            className={`p-1 rounded cursor-pointer transition-colors ${
              selectedId === "emp-id" ? "ring-2 ring-blue-400 bg-blue-500/10" : ""
            }`}
          >
            <span className="text-[10px] text-slate-400 block">Staff ID:</span>
            {isRedacted ? (
              <div className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/60">
                ████ [EMPLOYEE_ID]
              </div>
            ) : (
              <span className="font-mono text-xs text-blue-400 font-semibold">EMP-94821-X</span>
            )}
          </div>

          {/* Department */}
          <div className="p-1">
            <span className="text-[10px] text-slate-400 block">Department:</span>
            <span className="text-[11px] text-slate-200">Cloud Infrastructure</span>
          </div>
        </div>
      </div>

      {/* Barcode Section */}
      <div
        onClick={() => onSelect("barcode")}
        className={`pt-2 border-t border-slate-700/60 cursor-pointer p-1 rounded transition-colors ${
          selectedId === "barcode" ? "ring-2 ring-blue-400 bg-blue-500/10" : ""
        }`}
      >
        <span className="text-[9px] font-mono text-slate-400 block mb-1">Turnstile Barcode:</span>
        {isRedacted ? (
          <div className="w-full h-8 rounded bg-slate-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 font-mono text-[10px] font-bold">
            ████████████ [BARCODE_SECRET] ████████████
          </div>
        ) : (
          <div className="w-full h-8 bg-white rounded p-1 flex items-center justify-center font-mono text-black font-extrabold text-xs tracking-widest overflow-hidden">
            || | | ||| || ||| | || |||| | | |||
          </div>
        )}
      </div>

      {/* Redacted Guarantee */}
      {isRedacted && (
        <div className="mt-3 pt-2 border-t border-blue-500/30 text-center">
          <span className="text-[10px] font-mono text-blue-300 uppercase tracking-wider flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            Masked Canvas Buffer
          </span>
        </div>
      )}
    </div>
  );
};
