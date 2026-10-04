import React from "react";
import {
  Bot,
  Play,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { DEMO_TASK_DESCRIPTION } from "../../lib/actionPlanner";
import { ConfirmationModal } from "./ConfirmationModal";
import { ReimbursementPortal } from "../perception/ReimbursementPortal";

export const AgentExecutionSection: React.FC = () => {
  const {
    actionPlan,
    executeAction,
    setConfirmationModalOpen,
    formState,
    setActiveSection,
  } = useDemo();

  const handleActionClick = (actionId: string, riskLevel: string) => {
    if (riskLevel === "dangerous") {
      setConfirmationModalOpen(true);
    } else {
      executeAction(actionId);
    }
  };

  const completedCount = actionPlan.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      <ConfirmationModal />

      {/* Task Instruction Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Autonomous Agent Reasoning & Action Plan
              </h3>
              <p className="text-[11px] text-slate-400">
                Reasoning performed on sanitized context; actions executed locally on live DOM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300">
              Progress: <strong className="text-teal-400">{completedCount}/{actionPlan.length}</strong> Completed
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-950/70 border border-navy-800 font-mono text-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block font-sans uppercase tracking-wider font-bold">
              User Directive / Task:
            </span>
            <span className="text-blue-300 font-medium">&quot;{DEMO_TASK_DESCRIPTION}&quot;</span>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Model: LLaMA-3.2 (Ollama / Mock)
          </span>
        </div>
      </div>

      {/* Split Grid: Left = Action Plan Timeline, Right = Live Portal Synchronization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Structured Action Plan */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Planned Action Pipeline ({actionPlan.length} Steps)
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Click &quot;Execute&quot; on any step
              </span>
            </div>

            <div className="space-y-3">
              {actionPlan.map((action, idx) => {
                const isCompleted = action.status === "completed";
                const isDangerous = action.riskLevel === "dangerous";
                const isSensitive = action.riskLevel === "sensitive";

                return (
                  <div
                    key={action.actionId}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCompleted
                        ? "bg-emerald-950/15 border-emerald-500/40"
                        : "bg-navy-850/60 border-navy-700/60 hover:border-navy-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            isCompleted
                              ? "bg-emerald-500 text-navy-950"
                              : "bg-navy-800 text-slate-300 border border-navy-700"
                          }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {action.description}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Target: <strong className="text-blue-400">{action.targetTag}</strong> ({action.targetFieldName})
                          </span>
                        </div>
                      </div>

                      {/* Risk Badge */}
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          isDangerous
                            ? "bg-red-500/20 text-red-300 border-red-500/40"
                            : isSensitive
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {action.riskLevel}
                      </span>
                    </div>

                    {/* Permitted Value Preview & Execution Trigger */}
                    <div className="flex items-center justify-between pt-2 border-t border-navy-700/40 text-[11px] font-mono">
                      <div className="text-slate-400 truncate max-w-[260px]">
                        {action.permittedValue ? (
                          <span>Value: &quot;<strong className="text-slate-200">{action.permittedValue}</strong>&quot;</span>
                        ) : (
                          <span className="text-slate-500">Trigger click dispatch</span>
                        )}
                      </div>

                      <div>
                        {isCompleted ? (
                          <span className="text-emerald-400 font-sans font-medium text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Executed at {action.executedAt}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleActionClick(action.actionId, action.riskLevel)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                              isDangerous
                                ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                                : "bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40"
                            }`}
                          >
                            {isDangerous ? "Authorize & Submit" : "Execute Step"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Form Updating in Real Time */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-navy-700/80 bg-navy-900/90 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-navy-700/60">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                Live Form View (Updates as steps execute)
              </span>
              <button
                onClick={() => setActiveSection("perception")}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
              >
                <span>Full Portal View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <ReimbursementPortal />
          </div>
        </div>
      </div>
    </div>
  );
};
