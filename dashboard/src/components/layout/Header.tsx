import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Play,
  Bug,
  CheckCircle2,
  Lock,
  Layers,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";

export const Header: React.FC = () => {
  const {
    activeSection,
    leakGuardResult,
    isLeakSimulated,
    simulatePiiLeak,
    restoreSafePayload,
    resetDemo,
    startOrchestration,
    orchestrator,
  } = useDemo();

  const sectionTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: "Architecture & Pipeline Overview",
      subtitle: "Six-stage zero-data-leakage pipeline comparing Local Trusted Zone vs AI Zone",
    },
    perception: {
      title: "Live On-Device Perception",
      subtitle: "DOM ingestion & PII detection telemetry on enterprise reimbursement portal",
    },
    redaction: {
      title: "Visual PII Redaction Preview",
      subtitle: "Multi-stage canvas redaction with opaque semantic bounding boxes",
    },
    firewall: {
      title: "Outbound Privacy Firewall & LeakGuard",
      subtitle: "Pre-flight airgap inspection testing secret matching and regex pattern rules",
    },
    agent: {
      title: "Agent Execution & Re-hydration",
      subtitle: "Structured AI action plan with safety gating and local DOM synthetic dispatch",
    },
    audit: {
      title: "Audit Telemetry & Metrics",
      subtitle: "Chronological event ledger and real-time session privacy analytics",
    },
  };

  const current = sectionTitles[activeSection] || {
    title: "CloakSight Dashboard",
    subtitle: "Privacy Firewall for Browser Agents",
  };

  return (
    <header className="h-16 bg-navy-900/90 backdrop-blur-md border-b border-navy-700/80 px-6 flex items-center justify-between z-10">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-blue-400 font-medium">CloakSight</span>
          <span className="text-slate-400 text-xs">/</span>
          <h1 className="text-sm font-bold text-white tracking-tight">{current.title}</h1>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block">{current.subtitle}</p>
      </div>

      {/* Action Controls & Status Badges */}
      <div className="flex items-center gap-2.5">
        {/* LeakGuard Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            leakGuardResult.passed
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/15 text-red-400 border-red-500/40 animate-pulse"
          }`}
        >
          {leakGuardResult.passed ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-400" />
          )}
          <span className="font-mono font-semibold">
            LeakGuard: {leakGuardResult.passed ? "CLEARED (0 PII)" : "BLOCKED"}
          </span>
        </div>

        {/* Simulate PII Leak / Restore Button */}
        {isLeakSimulated ? (
          <button
            onClick={restoreSafePayload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium transition-colors shadow-sm"
            title="Restore un-tainted safe payload"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restore Safe Payload</span>
          </button>
        ) : (
          <button
            onClick={simulatePiiLeak}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors shadow-sm"
            title="Inject simulated PII leak to test LeakGuard fail-closed defense"
          >
            <Bug className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate PII Leak</span>
          </button>
        )}

        {/* Run Demo Orchestrator CTA */}
        <button
          onClick={startOrchestration}
          disabled={orchestrator.isRunning || orchestrator.isBlocked}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
            orchestrator.isRunning
              ? "bg-blue-600/40 text-blue-300 border border-blue-500/30 cursor-not-allowed"
              : orchestrator.isBlocked
              ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-95"
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{orchestrator.isRunning ? "Running Demo..." : "Run CloakSight Demo"}</span>
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={resetDemo}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg border border-transparent hover:border-navy-700 transition-colors"
          title="Reset demo state & clear RAM vault"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
