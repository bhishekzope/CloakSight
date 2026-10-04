import React from "react";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  KeyRound,
  Bot,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDemo } from "../../context/DemoContext";

export const AuditMetricsSection: React.FC = () => {
  const {
    timelineEvents,
    detectedEntities,
    semanticTags,
    leakGuardResult,
    actionPlan,
  } = useDemo();

  const completedActions = actionPlan.filter((a) => a.status === "completed").length;

  // Recharts Data 1: Token Comparison (Raw Full DOM vs Sanitized Context)
  const tokenData = [
    { name: "Raw DOM + Image", tokens: 2450, fill: "#ef4444" },
    { name: "Sanitized Context", tokens: 320, fill: "#10b981" },
  ];

  // Recharts Data 2: PII Category Breakdown
  const categoryCounts = detectedEntities.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryCounts).map(([key, val], index) => {
    const colors = ["#3b82f6", "#14b8a6", "#f59e0b", "#8b5cf6", "#ec4899", "#10b981"];
    return {
      name: key,
      value: val,
      color: colors[index % colors.length],
    };
  });

  return (
    <div className="space-y-6">
      {/* Session Metrics Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="glass-card rounded-xl p-3.5 border border-navy-700/60">
          <span className="text-[10px] text-slate-400 font-mono block">ENTITIES DETECTED</span>
          <span className="text-xl font-bold text-white font-mono">{detectedEntities.length}</span>
          <span className="text-[10px] text-blue-400 block mt-1">On-Device Scanned</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-navy-700/60">
          <span className="text-[10px] text-slate-400 font-mono block">ENTITIES REDACTED</span>
          <span className="text-xl font-bold text-teal-300 font-mono">{semanticTags.length}</span>
          <span className="text-[10px] text-teal-400 block mt-1">100% In-RAM Vaulted</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-navy-700/60">
          <span className="text-[10px] text-slate-400 font-mono block">LEAKGUARD STATUS</span>
          <span
            className={`text-base font-bold font-mono ${
              leakGuardResult.passed ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {leakGuardResult.status}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">4 Checks Enforced</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-navy-700/60">
          <span className="text-[10px] text-slate-400 font-mono block">PLANNED ACTIONS</span>
          <span className="text-xl font-bold text-white font-mono">{actionPlan.length}</span>
          <span className="text-[10px] text-purple-400 block mt-1">Tag-Based Operations</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-navy-700/60">
          <span className="text-[10px] text-slate-400 font-mono block">ACTIONS EXECUTED</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">{completedActions}</span>
          <span className="text-[10px] text-emerald-400/80 block mt-1">DOM Synthetic Dispatch</span>
        </div>
      </div>

      {/* Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Context Compression & Token Savings */}
        <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Token & Context Compression (~87% Savings)
            </h4>
            <span className="text-[10px] font-mono text-emerald-400">Low Latency</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Comparing raw DOM/image token consumption vs. CloakSight&apos;s compressed structural JSON.
          </p>

          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tokenData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#64748b" fontSize={10} font-family="monospace" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1120",
                    borderColor: "#1e2d4a",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  formatter={(val: number) => [`${val} tokens`, "Est. Consumption"]}
                />
                <Bar dataKey="tokens" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: PII Category Distribution */}
        <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-400" />
              Detected PII Distribution by Category
            </h4>
            <span className="text-[10px] font-mono text-slate-400 font-medium">6 Categories</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Distribution of personal, identity, and banking fields identified on the active form.
          </p>

          <div className="h-48 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <span className="text-xs text-slate-400">Populate form to view category breakdown</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b1120",
                      borderColor: "#1e2d4a",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    formatter={(val: number, name: string) => [`${val} field(s)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Chronological Event Timeline Ledger */}
      <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Chronological Audit Ledger ({timelineEvents.length} Events Logged)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Session Memory Only • Auto-Cleared</span>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
          {timelineEvents.map((evt) => {
            const isError = evt.type === "error";
            const isSuccess = evt.type === "success";
            const isWarning = evt.type === "warning";

            return (
              <div
                key={evt.id}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isError
                    ? "bg-red-950/20 border-red-500/40"
                    : isSuccess
                    ? "bg-emerald-950/15 border-emerald-500/30"
                    : isWarning
                    ? "bg-amber-950/20 border-amber-500/30"
                    : "bg-navy-850/50 border-navy-700/50"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        isError
                          ? "bg-red-500/20 text-red-300"
                          : isSuccess
                          ? "bg-emerald-500/20 text-emerald-300"
                          : isWarning
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-blue-500/15 text-blue-300"
                      }`}
                    >
                      {evt.stageName}
                    </span>
                    <span className="text-slate-400">{evt.timestamp}</span>
                  </div>
                </div>

                <div className="font-bold text-white text-xs mb-0.5">{evt.title}</div>
                <div className="text-[11px] text-slate-400 leading-relaxed font-sans">{evt.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
