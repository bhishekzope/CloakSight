import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bug,
  RotateCcw,
  Lock,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";

export const LeakGuardInspector: React.FC = () => {
  const {
    leakGuardResult,
    isLeakSimulated,
    simulatePiiLeak,
    restoreSafePayload,
  } = useDemo();

  return (
    <div className="space-y-4">
      {/* LeakGuard Banner */}
      <div
        className={`glass-panel rounded-2xl p-5 border shadow-xl transition-all ${
          leakGuardResult.passed
            ? "border-emerald-500/40 bg-emerald-950/20"
            : "border-red-500/50 bg-red-950/30"
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                leakGuardResult.passed
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse"
              }`}
            >
              {leakGuardResult.passed ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Outbound LeakGuard Airgap Inspection
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    leakGuardResult.passed
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/25 text-red-300 border border-red-500/50"
                  }`}
                >
                  {leakGuardResult.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pre-flight security barrier before cloud transmission
              </p>
            </div>
          </div>

          {/* Simulate Leak Trigger */}
          <div>
            {isLeakSimulated ? (
              <button
                onClick={restoreSafePayload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Safe Payload</span>
              </button>
            ) : (
              <button
                onClick={simulatePiiLeak}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
              >
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate PII Leak</span>
              </button>
            )}
          </div>
        </div>

        {/* Human-Readable Explanation */}
        <div className="pt-3">
          <p className="text-xs text-slate-200 leading-relaxed font-mono">
            {leakGuardResult.summary}
          </p>

          {/* If reasons exist (failure) */}
          {leakGuardResult.reasons.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-500/30 space-y-1.5 text-xs text-red-300 font-mono">
              <span className="font-bold flex items-center gap-1 text-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Security Violation Details:
              </span>
              {leakGuardResult.reasons.map((r, i) => (
                <div key={i} className="text-[11px] text-red-300/90 pl-4 border-l border-red-500/40">
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layer-by-Layer Verification Checks */}
      <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Multi-Layer Security Checks ({leakGuardResult.checksRun.length})
        </h4>

        <div className="space-y-2">
          {leakGuardResult.checksRun.map((check, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all ${
                check.passed
                  ? "bg-navy-850/60 border-navy-700/50"
                  : "bg-red-950/30 border-red-500/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-xs font-bold text-white">{check.name}</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    check.passed
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {check.passed ? "PASSED" : "FAILED"}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-1">{check.description}</p>
              <div className="text-[10px] font-mono text-slate-300 pt-1 border-t border-navy-700/40">
                {check.details}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
