import React from "react";
import {
  LayoutDashboard,
  Eye,
  ScanEye,
  ShieldCheck,
  Bot,
  BarChart3,
  Shield,
  KeyRound,
  Lock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { NavigationSection } from "../../types/cloaksight";

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    detectedEntities,
    leakGuardResult,
    isLeakSimulated,
  } = useDemo();

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview & Pipeline", icon: LayoutDashboard },
    {
      id: "perception",
      label: "Live Perception",
      icon: Eye,
      badge: detectedEntities.length > 0 ? `${detectedEntities.length} PII` : undefined,
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    { id: "redaction", label: "Visual Redaction", icon: ScanEye },
    {
      id: "firewall",
      label: "Privacy Firewall",
      icon: ShieldCheck,
      badge: isLeakSimulated ? "BLOCKED" : "CLEARED",
      badgeColor: isLeakSimulated
        ? "bg-red-500/20 text-red-400 border-red-500/30"
        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    { id: "agent", label: "Agent Execution", icon: Bot },
    { id: "audit", label: "Audit & Metrics", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-700/80 flex flex-col justify-between flex-shrink-0 select-none z-20">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-navy-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
              <Shield className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">CloakSight</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Privacy Firewall for Agents</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Architecture Sections
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-900/40"
                    : "text-slate-300 hover:text-white hover:bg-navy-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-blue-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Telemetry Footprint */}
      <div className="p-4 border-t border-navy-700/60 bg-navy-950/40 space-y-3">
        {/* Security Boundary Badge */}
        <div className="bg-navy-850/80 rounded-lg p-3 border border-navy-700/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-teal-400" />
              Trust Boundary
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Local Trusted Zone armed. Raw secrets stored in volatile memory with auto-TTL.
          </p>

          <div className="mt-2.5 pt-2 border-t border-navy-700/40 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-amber-400/80" />
              Vault Items:
            </span>
            <span className="font-mono font-semibold text-slate-200">
              {detectedEntities.length} active
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              LeakGuard:
            </span>
            <span
              className={`font-mono font-semibold ${
                leakGuardResult.passed ? "text-emerald-400" : "text-red-400 flex items-center gap-1"
              }`}
            >
              {!leakGuardResult.passed && <AlertTriangle className="w-2.5 h-2.5" />}
              {leakGuardResult.status}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 text-center font-mono">
          Production Engine • v1.2
        </div>
      </div>
    </aside>
  );
};
