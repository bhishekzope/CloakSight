import React from "react";
import {
  Building2,
  Receipt,
  Sparkles,
  Hotel,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { MOCK_RECEIPT_DETAILS } from "../../data/demoData";

export const ReimbursementPortal: React.FC = () => {
  const {
    formState,
    updateFormField,
    autofillProfile,
    populateTrip,
    highlightFields,
    confirmFinalSubmission,
    setConfirmationModalOpen,
  } = useDemo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmationModalOpen(true);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-navy-700/80 bg-navy-900/90 shadow-xl space-y-6">
      {/* Portal Header */}
      <div className="flex items-center justify-between pb-4 border-b border-navy-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">ACME Corp Internal Portal</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Secure Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Travel & Expense Reimbursement Claim Form</p>
          </div>
        </div>

        {/* Quick Demo Toolbar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={autofillProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
            title="Populate sample employee identity fields"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Autofill Employee Profile</span>
          </button>
          <button
            type="button"
            onClick={populateTrip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 transition-colors"
            title="Populate hotel claim details from verified receipt"
          >
            <Hotel className="w-3.5 h-3.5 text-teal-400" />
            <span>Populate Hotel Claim</span>
          </button>
        </div>
      </div>

      {/* Form Submission Confirmation Banner */}
      {formState.isSubmitted && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-100">
              Claim Submitted Successfully! (Ref: {formState.claimRefId})
            </h4>
            <p className="text-xs text-emerald-300/90 leading-relaxed">
              Form executed via local synthetic dispatch. Zero bytes of sensitive identity data (Name, Email, Phone, Bank Account, IFSC) were exposed to external cloud AI models.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Employee Information (PII) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>1. Employee Information</span>
              <span className="text-[10px] font-mono font-normal text-amber-400/90 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                PII Protected
              </span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className={`relative rounded-lg p-1 transition-all ${
              highlightFields && formState.employeeName ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""
            }`}>
              {highlightFields && formState.employeeName && (
                <span className="absolute -top-2.5 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white shadow-sm z-10">
                  [PERSON_NAME] • TAG_001
                </span>
              )}
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formState.employeeName}
                onChange={(e) => updateFormField("employeeName", e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono glass-input text-white focus:outline-none transition-all"
              />
            </div>

            {/* Employee ID */}
            <div className={`relative rounded-lg p-1 transition-all ${
              highlightFields && formState.employeeId ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""
            }`}>
              {highlightFields && formState.employeeId && (
                <span className="absolute -top-2.5 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white shadow-sm z-10">
                  [EMPLOYEE_ID] • TAG_002
                </span>
              )}
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Employee ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formState.employeeId}
                onChange={(e) => updateFormField("employeeId", e.target.value)}
                placeholder="e.g. EMP-2024-0042"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono glass-input text-white focus:outline-none transition-all"
              />
            </div>

            {/* Email Address */}
            <div className={`relative rounded-lg p-1 transition-all ${
              highlightFields && formState.email ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""
            }`}>
              {highlightFields && formState.email && (
                <span className="absolute -top-2.5 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white shadow-sm z-10">
                  [EMAIL] • TAG_003
                </span>
              )}
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) => updateFormField("email", e.target.value)}
                placeholder="rahul.sharma@corp.acme.in"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono glass-input text-white focus:outline-none transition-all"
              />
            </div>

            {/* Phone Number */}
            <div className={`relative rounded-lg p-1 transition-all ${
              highlightFields && formState.phone ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""
            }`}>
              {highlightFields && formState.phone && (
                <span className="absolute -top-2.5 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white shadow-sm z-10">
                  [PHONE] • TAG_004
                </span>
              )}
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formState.phone}
                onChange={(e) => updateFormField("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono glass-input text-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Banking Details (PII) */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>2. Reimbursement Account</span>
            <span className="text-[10px] font-mono font-normal text-amber-400/90 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Financial PII
            </span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Account */}
            <div className={`relative rounded-lg p-1 transition-all ${
              highlightFields && formState.bankAccount ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""
            }`}>
              {highlightFields && formState.bankAccount && (
                <span className="absolute -top-2.5 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white shadow-sm z-10">
                  [BANK_ACCOUNT] • TAG_005
                </span>
              )}
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Bank Account Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formState.bankAccount}
                onChange={(e) => updateFormField("bankAccount", e.target.value)}
                placeholder="00112345678901"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono glass-input text-white focus:outline-none transition-all"
              />
            </div>

            {/* IFSC Code */}
            <div className={`relative rounded-lg p-1 transition-all ${
              highlightFields && formState.ifscCode ? "ring-2 ring-blue-500/50 bg-blue-500/5" : ""
            }`}>
              {highlightFields && formState.ifscCode && (
                <span className="absolute -top-2.5 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500 text-white shadow-sm z-10">
                  [IFSC_CODE] • TAG_006
                </span>
              )}
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                IFSC Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formState.ifscCode}
                onChange={(e) => updateFormField("ifscCode", e.target.value)}
                placeholder="HDFC0001234"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono glass-input text-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Travel Information (Agent Targets) */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>3. Travel Information</span>
            <span className="text-[10px] font-mono font-normal text-teal-400/90 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              Agent Action Targets
            </span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Expense Category <span className="text-red-400">*</span>
              </label>
              <select
                id="expense-category"
                value={formState.expenseCategory}
                onChange={(e) => updateFormField("expenseCategory", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs glass-input text-white focus:outline-none transition-all"
              >
                <option value="">Select category...</option>
                <option value="Hotel">Hotel</option>
                <option value="Flight">Flight</option>
                <option value="Train">Train</option>
                <option value="Cab">Cab / Taxi</option>
                <option value="Meals">Meals</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Travel Date */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Travel Date <span className="text-red-400">*</span>
              </label>
              <input
                id="travel-date"
                type="date"
                value={formState.travelDate}
                onChange={(e) => updateFormField("travelDate", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs glass-input text-white focus:outline-none transition-all font-mono"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Amount (INR) <span className="text-red-400">*</span>
              </label>
              <input
                id="amount"
                type="number"
                value={formState.amount}
                onChange={(e) => updateFormField("amount", e.target.value)}
                placeholder="4500"
                className="w-full px-3 py-2 rounded-lg text-xs font-mono glass-input text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Expense Description
            </label>
            <textarea
              id="description"
              rows={2}
              value={formState.description}
              onChange={(e) => updateFormField("description", e.target.value)}
              placeholder="Brief description of the expense..."
              className="w-full px-3 py-2 rounded-lg text-xs glass-input text-white focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Section 4: Receipt Preview Card (Visual Perception / OCR) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-400" />
              Attached Receipt Document (OCR Scanned)
            </label>
            <span className="text-[10px] font-mono text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              Verified by Local OCR
            </span>
          </div>

          <div className="glass-card rounded-xl p-3.5 border border-navy-700/80 bg-navy-950/60 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{MOCK_RECEIPT_DETAILS.hotelName}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  (Ref: {MOCK_RECEIPT_DETAILS.receiptId})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {MOCK_RECEIPT_DETAILS.location} • Date: {MOCK_RECEIPT_DETAILS.date} • {MOCK_RECEIPT_DETAILS.nights}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-teal-300 block">
                {MOCK_RECEIPT_DETAILS.totalAmount}
              </span>
              <span className="text-[9px] font-mono text-slate-500">GST: {MOCK_RECEIPT_DETAILS.gstNumber}</span>
            </div>
          </div>
        </div>

        {/* Action Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            id="btn-submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            Submit Reimbursement Claim
          </button>
        </div>
      </form>
    </div>
  );
};
