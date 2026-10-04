import React from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  X,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";

export const ConfirmationModal: React.FC = () => {
  const {
    confirmationModalOpen,
    setConfirmationModalOpen,
    confirmFinalSubmission,
    formState,
  } = useDemo();

  if (!confirmationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel rounded-2xl max-w-lg w-full p-6 border border-amber-500/40 bg-navy-900 shadow-2xl shadow-amber-950/40 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-navy-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Human-in-the-Loop Safety Gate
              </h3>
              <p className="text-[11px] text-slate-400">
                Action requires explicit authorization before dispatch
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfirmationModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Details */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="font-bold text-amber-300">Action: SUBMIT_CLAIM (TAG_011)</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                RISK: DANGEROUS
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              The AI agent has requested to trigger the <strong>Submit Reimbursement</strong> button. This irreversible action will transmit the expense claim to the ACME corporate payroll gateway.
            </p>
          </div>

          {/* Claim Summary Preview */}
          <div className="glass-card rounded-xl p-3.5 border border-navy-700/60 space-y-1.5 text-xs font-mono">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
              Transaction Details to be Submitted:
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Employee:</span>
              <span className="font-bold text-white">{formState.employeeName || "Rahul Sharma"}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Category:</span>
              <span className="font-bold text-teal-300">{formState.expenseCategory || "Hotel"}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Travel Date:</span>
              <span className="font-bold text-white">{formState.travelDate || "2026-09-12"}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Total Amount:</span>
              <span className="font-bold text-emerald-400">
                INR {formState.amount ? Number(formState.amount).toLocaleString("en-IN") : "4,500"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-navy-700/60">
          <button
            onClick={() => setConfirmationModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            Cancel / Abort
          </button>
          <button
            onClick={confirmFinalSubmission}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-navy-950 shadow-lg shadow-amber-500/25 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-navy-950" />
            <span>Authorize & Execute Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
