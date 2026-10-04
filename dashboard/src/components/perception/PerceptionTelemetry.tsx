import React from "react";
import {
  ShieldAlert,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info,
  CheckCircle2,
  FileCode2,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";

export const PerceptionTelemetry: React.FC = () => {
  const {
    detectedEntities,
    highlightFields,
    setHighlightFields,
  } = useDemo();

  return (
    <div className="space-y-4">
      {/* Telemetry Stat Bar */}
      <div className="glass-panel rounded-xl p-4 border border-navy-700/80 bg-navy-900/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              On-Device Perception Telemetry
            </span>
          </div>

          {/* Toggle for Highlights */}
          <button
            onClick={() => setHighlightFields(!highlightFields)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            {highlightFields ? (
              <ToggleRight className="w-5 h-5 text-blue-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-500" />
            )}
            <span className="text-[11px] font-medium">Field Overlays</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-navy-700/50">
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">DOM INGESTION</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">11 Elements (8 Input)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">PII DETECTED</span>
            <span className="text-xs font-bold text-amber-400 font-mono">
              {detectedEntities.length} Sensitive Fields
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono">EST. LATENCY</span>
            <span className="text-xs font-bold text-teal-300 font-mono">&lt; 14ms (Local)</span>
          </div>
        </div>
      </div>

      {/* Detection Methods Legend */}
      <div className="glass-card rounded-xl p-3 border border-navy-700/60 flex flex-wrap items-center gap-2 text-[10px] font-mono">
        <span className="text-slate-400 font-sans font-medium">Methods:</span>
        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
          Pattern (Regex)
        </span>
        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
          DOM Context
        </span>
        <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
          OCR Simulation
        </span>
        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
          Visual Region
        </span>
      </div>

      {/* Detected Entities Table */}
      <div className="glass-panel rounded-xl border border-navy-700/80 overflow-hidden shadow-lg">
        <div className="p-3 bg-navy-850/80 border-b border-navy-700/60 flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            Detected Sensitive Entities ({detectedEntities.length})
          </span>
          <span className="text-[10px] font-mono text-slate-400">Confidence: Demo Estimates</span>
        </div>

        {detectedEntities.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            <p className="mb-2">No sensitive entities detected yet.</p>
            <p className="text-[11px] text-slate-500">
              Click &quot;Autofill Employee Profile&quot; in the form to test on-device detection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-navy-700/60 bg-navy-950/40 text-slate-400 font-mono text-[10px]">
                  <th className="py-2 px-3">Entity ID</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Detection Method</th>
                  <th className="py-2 px-3">Assigned Tag</th>
                  <th className="py-2 px-3">Redaction Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/40 font-mono">
                {detectedEntities.map((entity) => (
                  <tr key={entity.entityId} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300">{entity.entityId}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {entity.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {(entity.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          entity.detectionMethod === "Pattern"
                            ? "bg-blue-500/10 text-blue-300"
                            : "bg-purple-500/10 text-purple-300"
                        }`}
                      >
                        {entity.detectionMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-blue-400 font-bold">{entity.assignedTagId}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-400 flex items-center gap-1 font-sans text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Vaulted in RAM
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
