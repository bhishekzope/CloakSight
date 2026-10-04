import React, { useState } from "react";
import { Copy, Check, FileJson, AlertTriangle, ShieldCheck } from "lucide-react";
import { SanitizedPayload } from "../../types/cloaksight";

interface PayloadViewerProps {
  payload: SanitizedPayload;
  isLeakSimulated: boolean;
}

export const PayloadViewer: React.FC<PayloadViewerProps> = ({
  payload,
  isLeakSimulated,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedJson = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const estimatedTokens = Math.round(formattedJson.length / 4);

  return (
    <div className="glass-panel rounded-2xl border border-navy-700/80 bg-navy-900/90 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-navy-850/90 border-b border-navy-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Outbound Sanitized JSON Payload (AI Context)
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400">
            Estimated Tokens: <strong className="text-teal-400">{estimatedTokens}</strong> (~87% compression)
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tainted Warning Banner */}
      {isLeakSimulated && (
        <div className="px-4 py-2.5 bg-red-950/60 border-b border-red-500/40 text-red-200 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
          <span>
            <strong>TAINTED PAYLOAD DETECTED:</strong> Simulated raw email secret &quot;rahul.sharma@corp.acme.in&quot; injected for leak testing.
          </span>
        </div>
      )}

      {/* Code Container */}
      <div className="p-4 bg-navy-950/80 overflow-x-auto max-h-[460px] font-mono text-xs leading-relaxed">
        <pre className="text-slate-300">
          <code>
            {formattedJson.split("\n").map((line, i) => {
              const isTaintedLine = isLeakSimulated && line.includes("rahul.sharma@corp.acme.in");
              return (
                <div
                  key={i}
                  className={`px-2 py-0.5 rounded ${
                    isTaintedLine ? "bg-red-500/20 text-red-300 border border-red-500/40 font-bold" : ""
                  }`}
                >
                  <span className="text-slate-600 mr-4 select-none text-[10px]">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span>{line}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};
