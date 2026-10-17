import React from 'react';
import { ShieldAlert, RefreshCw, Cpu, Activity, Map, GitBranch, Smartphone } from 'lucide-react';

interface TopNavProps {
  activeTab: 'map' | 'scenario' | 'agents' | 'planner' | 'responder';
  setActiveTab: (tab: 'map' | 'scenario' | 'agents' | 'planner' | 'responder') => void;
  worldVersion: number;
  onRunAgentCycle: () => void;
  isAgentRunning: boolean;
  onResetScenario: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  worldVersion,
  onRunAgentCycle,
  isAgentRunning,
  onResetScenario,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-5 flex items-center justify-between gap-6 shrink-0 z-40 sticky top-0">
      {/* Zone 1: Wordmark & Digital Twin Version */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            CrisisTwin
          </span>
          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
            v{worldVersion}
          </span>
        </div>
      </div>

      {/* Zone 2: Linear-Style Segmented Navigation Bar */}
      <nav className="hidden md:flex items-center p-1 bg-slate-100/80 border border-slate-200/80 rounded-lg text-xs font-medium gap-0.5">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-3 py-1.2 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'map'
              ? 'bg-white text-slate-900 shadow-xs font-medium'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Map className="w-3.5 h-3.5 text-slate-500" />
          <span>Disaster Map</span>
        </button>

        <button
          onClick={() => setActiveTab('scenario')}
          className={`px-3 py-1.2 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'scenario'
              ? 'bg-white text-slate-900 shadow-xs font-medium'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-slate-500" />
          <span>Scenario Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-3 py-1.2 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'agents'
              ? 'bg-white text-slate-900 shadow-xs font-medium'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-slate-500" />
          <span>Multi-Agent Intelligence</span>
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`px-3 py-1.2 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'planner'
              ? 'bg-white text-slate-900 shadow-xs font-medium'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span>Mission Planner</span>
        </button>

        <button
          onClick={() => setActiveTab('responder')}
          className={`px-3 py-1.2 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'responder'
              ? 'bg-white text-slate-900 shadow-xs font-medium'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-500" />
          <span>Field PWA</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Reset */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onResetScenario}
          title="Reset to initial seeded scenario"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRunAgentCycle}
          disabled={isAgentRunning}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          {isAgentRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Orchestrating...</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5" />
              <span>Run Agent Workflow</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
