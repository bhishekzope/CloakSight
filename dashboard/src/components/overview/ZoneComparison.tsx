import React from "react";
import { Shield, Cloud, Lock, EyeOff, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const ZoneComparison: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Local Trusted Zone */}
      <div className="glass-panel rounded-xl p-5 border-l-4 border-l-teal-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Shield className="w-32 h-32 text-teal-400" />
        </div>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Local Trusted Zone
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                ON-DEVICE RAM
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Strictly isolated inside client browser memory</p>
          </div>
        </div>

        <ul className="space-y-2 mt-4 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Raw DOM & Viewport:</strong> Full access to live form inputs, bounding rects, and ARIA attributes.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Real PII Vault:</strong> Employee names, PAN, Aadhaar, account numbers held in volatile RAM with TTL.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Local Value Re-hydration:</strong> When AI commands an action on a tag, real data is injected locally into DOM events.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Zero Disk Persistence:</strong> Secrets never touch localStorage, sessionStorage, cookies, or external databases.
            </span>
          </li>
        </ul>
      </div>

      {/* Cloud / External AI Zone */}
      <div className="glass-panel rounded-xl p-5 border-l-4 border-l-blue-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Cloud className="w-32 h-32 text-blue-400" />
        </div>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              External AI / Cloud Zone
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                SANITIZED ONLY
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">External LLM / Multimodal Agent endpoint</p>
          </div>
        </div>

        <ul className="space-y-2 mt-4 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Opaque Semantic Tags:</strong> AI only sees non-reversible tokens (<code className="text-blue-300 font-mono text-[11px]">TAG_001</code>, <code className="text-blue-300 font-mono text-[11px]">[PERSON_NAME]</code>).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Context Compression:</strong> Non-interactive containers pruned, reducing token consumption by ~85%.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Zero Raw PII Received:</strong> No real identity, phone, email, or financial digits cross this boundary.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>No Direct DOM Control:</strong> Cloud model cannot directly manipulate user DOM; returns structured actions only.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
