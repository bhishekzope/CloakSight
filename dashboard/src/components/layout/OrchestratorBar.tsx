import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Sparkles,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { ORCHESTRATOR_STAGES_INFO } from "../../data/demoData";
import { OrchestratorStage } from "../../types/cloaksight";

export const OrchestratorBar: React.FC = () => {
  const {
    orchestrator,
    startOrchestration,
    pauseOrchestration,
    stepNextOrchestration,
    resetDemo,
    setStepSpeed,
    isLeakSimulated,
  } = useDemo();

  const totalStages = 11;
  const progressPercent = Math.round((orchestrator.currentStage / totalStages) * 100);
  const currentStageInfo = ORCHESTRATOR_STAGES_INFO[orchestrator.currentStage];

  return (
    <div className="bg-navy-900 border-t border-navy-700/80 px-6 py-2.5 flex items-center justify-between z-10">
      {/* Stage Information & Mini Progress */}
      <div className="flex items-center gap-4 min-w-[320px]">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            {orchestrator.isRunning && !orchestrator.isPaused && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                orchestrator.isBlocked
                  ? "bg-red-500"
                  : orchestrator.isCompleted
                  ? "bg-emerald-500"
                  : orchestrator.isRunning
                  ? "bg-blue-500"
                  : "bg-slate-400"
              }`}
            ></span>
          </span>
          <span className="text-xs font-mono font-bold text-slate-200">
            Stage {orchestrator.currentStage}/{totalStages}:
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tracking-tight">
              {currentStageInfo.title}
            </span>
            {orchestrator.isBlocked && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <AlertOctagon className="w-2.5 h-2.5" />
                BLOCKED BY LEAKGUARD
              </span>
            )}
            {orchestrator.isCompleted && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                COMPLETED
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[420px]">
            {currentStageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
          <span>PIPELINE PROGRESS</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full bg-navy-950 rounded-full overflow-hidden border border-navy-700/60">
          <div
            className={`h-full transition-all duration-300 ${
              orchestrator.isBlocked
                ? "bg-red-500"
                : orchestrator.isCompleted
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-blue-500 to-teal-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        {/* Speed toggle */}
        <div className="flex items-center bg-navy-950 border border-navy-700/80 rounded-lg p-0.5 text-[10px] font-mono mr-2">
          <button
            onClick={() => setStepSpeed(2000)}
            className={`px-2 py-1 rounded transition-colors ${
              orchestrator.stepSpeedMs === 2000 ? "bg-navy-800 text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            0.5x
          </button>
          <button
            onClick={() => setStepSpeed(1400)}
            className={`px-2 py-1 rounded transition-colors ${
              orchestrator.stepSpeedMs === 1400 ? "bg-navy-800 text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1x
          </button>
          <button
            onClick={() => setStepSpeed(700)}
            className={`px-2 py-1 rounded transition-colors ${
              orchestrator.stepSpeedMs === 700 ? "bg-navy-800 text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2x
          </button>
        </div>

        {/* Play / Pause button */}
        {orchestrator.isRunning && !orchestrator.isPaused ? (
          <button
            onClick={pauseOrchestration}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-600 rounded-lg text-xs font-medium transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={startOrchestration}
            disabled={orchestrator.isBlocked || orchestrator.isCompleted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              orchestrator.isBlocked || orchestrator.isCompleted
                ? "bg-navy-800/40 text-slate-400 border border-navy-700/40 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/30"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{orchestrator.isPaused ? "Resume" : "Play"}</span>
          </button>
        )}

        {/* Step Next */}
        <button
          onClick={stepNextOrchestration}
          disabled={orchestrator.currentStage >= totalStages || orchestrator.isBlocked}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 disabled:opacity-40 text-slate-200 border border-navy-700 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed"
          title="Advance to next stage"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Step</span>
        </button>

        {/* Reset */}
        <button
          onClick={resetDemo}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg border border-transparent hover:border-navy-700 transition-colors"
          title="Reset orchestration to stage 1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
