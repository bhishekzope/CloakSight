import React from "react";
import {
  ShieldCheck,
  KeyRound,
  FileJson,
  Lock,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { PayloadViewer } from "./PayloadViewer";
import { LeakGuardInspector } from "./LeakGuardInspector";

export const PrivacyFirewallSection: React.FC = () => {
  const {
    sanitizedPayload,
    isLeakSimulated,
    semanticTags,
    activePolicy,
    setActivePolicy,
    addTimelineEvent,
  } = useDemo();

  const handlePolicyChange = (policy: "strict" | "balanced") => {
    setActivePolicy(policy);
    addTimelineEvent(
      "Privacy Policy",
      `Policy Updated: ${policy.toUpperCase()}`,
      `Switched to ${policy === "strict" ? "Strict (zero PII allowance)" : "Balanced (consented enterprise tags)"}.`,
      "info"
    );
  };

  return (
    <div className="space-y-6">
      {/* Policy Selection Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Active Privacy Policy Configuration
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Defines outbound redaction thresholds and PII category enforcement
          </p>
        </div>

        <div className="flex items-center gap-2 bg-navy-950 p-1 rounded-xl border border-navy-700/80 text-xs">
          <button
            onClick={() => handlePolicyChange("strict")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activePolicy === "strict"
                ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Strict Policy (DPDP 2023 Compliant)
          </button>
          <button
            onClick={() => handlePolicyChange("balanced")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activePolicy === "balanced"
                ? "bg-navy-800 text-blue-400 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Balanced Policy
          </button>
        </div>
      </div>

      {/* Grid: Left = Payload Viewer, Right = LeakGuard Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sanitized Context JSON Viewer */}
        <div className="lg:col-span-7">
          <PayloadViewer payload={sanitizedPayload} isLeakSimulated={isLeakSimulated} />
        </div>

        {/* Right Column: Outbound LeakGuard Inspection */}
        <div className="lg:col-span-5">
          <LeakGuardInspector />
        </div>
      </div>

      {/* Tag Vault Summary Table */}
      <div className="glass-panel rounded-2xl border border-navy-700/80 bg-navy-900/90 shadow-xl overflow-hidden">
        <div className="p-4 bg-navy-850/90 border-b border-navy-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              In-Memory Semantic Tag Vault ({semanticTags.length} Active Mappings)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-teal-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-teal-400" />
            Isolated in RAM • Zero Disk Persistence
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-navy-700/60 bg-navy-950/40 text-slate-400 font-mono text-[10px]">
                <th className="py-2.5 px-4">Tag ID</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Semantic Label</th>
                <th className="py-2.5 px-4">Source Form Field</th>
                <th className="py-2.5 px-4">Vault Storage</th>
                <th className="py-2.5 px-4">Cloud Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/40 font-mono text-[11px]">
              {semanticTags.map((tag) => (
                <tr key={tag.tagId} className="hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-blue-400">{tag.tagId}</td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-navy-800 border border-navy-700">
                      {tag.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-teal-300 font-bold">{tag.semanticLabel}</td>
                  <td className="py-3 px-4 text-slate-400">{tag.sourceField}</td>
                  <td className="py-3 px-4 text-emerald-400 flex items-center gap-1.5 font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Volatile RAM
                  </td>
                  <td className="py-3 px-4 text-slate-500">Opaque Token Only</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
