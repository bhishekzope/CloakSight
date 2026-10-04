import React from "react";
import {
  Shield,
  Eye,
  ShieldAlert,
  KeyRound,
  Layers,
  ShieldCheck,
  Bot,
  Play,
  Bug,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { PIPELINE_STAGES } from "../../data/demoData";
import { ZoneComparison } from "./ZoneComparison";

export const OverviewSection: React.FC = () => {
  const {
    detectedEntities,
    semanticTags,
    leakGuardResult,
    actionPlan,
    startOrchestration,
    simulatePiiLeak,
    restoreSafePayload,
    isLeakSimulated,
    setActiveSection,
    orchestrator,
  } = useDemo();

  const completedActions = actionPlan.filter((a) => a.status === "completed").length;

  const iconMap: Record<string, React.ElementType> = {
    Eye,
    ShieldAlert,
    KeyRound,
    Layers,
    ShieldCheck,
    Bot,
  };

  return (
    <div className="space-y-6">
      {/* Hero Mission Card */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-navy-700/80 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-medium">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Enterprise Privacy Firewall • Active Monitoring</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              On-Device Visual Perception & Privacy Firewall
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              CloakSight is an on-device privacy proxy that intercepts browser agent workflows. It performs local DOM perception, detects sensitive PII on-device, vaults secrets in volatile RAM, and passes sanitized structural tags to the cloud AI—ensuring <strong className="text-emerald-400">zero raw private data leaves your machine</strong>.
            </p>
          </div>

          {/* Quick Triggers */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startOrchestration}
              disabled={orchestrator.isRunning || orchestrator.isBlocked}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
                orchestrator.isRunning
                  ? "bg-blue-600/40 text-blue-300 border border-blue-500/30 cursor-not-allowed"
                  : orchestrator.isBlocked
                  ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95"
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{orchestrator.isRunning ? "Orchestrating..." : "Run CloakSight Demo"}</span>
            </button>

            {isLeakSimulated ? (
              <button
                onClick={restoreSafePayload}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Restore Safe Payload</span>
              </button>
            ) : (
              <button
                onClick={simulatePiiLeak}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                <Bug className="w-4 h-4 text-amber-400" />
                <span>Simulate PII Leak</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Detected Entities */}
        <div className="glass-card rounded-xl p-4 border border-navy-700/60">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Detected Entities</span>
            <ShieldAlert className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{detectedEntities.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">fields</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Identified across active DOM inputs</p>
        </div>

        {/* Card 2: Redacted in RAM Vault */}
        <div className="glass-card rounded-xl p-4 border border-navy-700/60">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Vaulted & Tagged</span>
            <KeyRound className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-300 font-mono">{semanticTags.length}</span>
            <span className="text-[10px] text-teal-400/80 font-mono">100% masked</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Replaced with TAG_001..TAG_006</p>
        </div>

        {/* Card 3: Outbound LeakGuard Status */}
        <div className="glass-card rounded-xl p-4 border border-navy-700/60">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Outbound LeakGuard</span>
            {leakGuardResult.passed ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold font-mono ${
                leakGuardResult.passed ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {leakGuardResult.status}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {leakGuardResult.passed ? "Zero raw PII detected" : "Transmission aborted"}
          </p>
        </div>

        {/* Card 4: Action Execution Progress */}
        <div className="glass-card rounded-xl p-4 border border-navy-700/60">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Agent Action Plan</span>
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {completedActions}/{actionPlan.length}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">actions</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Safety confirmation gated</p>
        </div>
      </div>

      {/* Six-Stage Visual Pipeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
            End-to-End Six-Stage Architecture
          </h3>
          <span className="text-[11px] text-slate-400">Click any stage to inspect details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {PIPELINE_STAGES.map((stage) => {
            const Icon = iconMap[stage.iconName] || Layers;
            return (
              <div
                key={stage.number}
                className="glass-card rounded-xl p-4 hover:border-blue-500/50 transition-all duration-200 group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-blue-400 group-hover:text-blue-300 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">Stage {stage.number}</span>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        {stage.title}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-800 text-slate-300 border border-navy-700">
                    {stage.shortName}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {stage.description}
                </p>

                <div className="pt-2 border-t border-navy-700/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Zone: {stage.zone}</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust Boundary Comparison (Section 4 requirement) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
          Trust Boundary Architecture
        </h3>
        <ZoneComparison />
      </div>
    </div>
  );
};
