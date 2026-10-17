import React, { useState } from 'react';
import {
  WorldState,
  DecisionCertificate,
  RescuePlan
} from '../types/crisis';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
  RotateCcw,
  Lock
} from 'lucide-react';

interface MissionPlannerProps {
  worldState: WorldState;
  certificates: DecisionCertificate[];
  onGenerateCertificate: () => void;
  onApproveCertificate: (certificateId: string, status: 'approved' | 'rejected' | 'revision_requested', notes: string) => void;
  isGenerating: boolean;
}

export const MissionPlanner: React.FC<MissionPlannerProps> = ({
  worldState,
  certificates,
  onGenerateCertificate,
  onApproveCertificate,
  isGenerating,
}) => {
  const activeCertificate = certificates[0] || null;
  const [commanderNotes, setCommanderNotes] = useState('');

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] p-6 overflow-y-auto bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                Safety &amp; Governance: Decision Certificate Review
              </h1>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                Layer 7 Governance Gate
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict human-in-the-loop authorization. No autonomous dispatch occurs without explicit commander sign-off.
            </p>
          </div>

          <button
            onClick={onGenerateCertificate}
            disabled={isGenerating}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Assembling Certificate...' : 'Generate New Decision Certificate'}</span>
          </button>
        </div>

        {!activeCertificate ? (
          <div className="p-12 bg-white border border-slate-200 rounded-xl text-center space-y-3 shadow-xs">
            <ShieldCheck className="w-9 h-9 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No Active Certificate Prepared</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click &quot;Generate New Decision Certificate&quot; to compile the latest digital twin state, counterfactual scenario metrics, and hard safety invariant checks.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Certificate Card */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 shadow-xs">
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold font-mono text-slate-900">
                        {activeCertificate.certificateId}
                      </h2>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          activeCertificate.humanApprovalStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : activeCertificate.humanApprovalStatus === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        STATUS: {activeCertificate.humanApprovalStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      World State Version: v{activeCertificate.worldVersion} · Timestamp: {new Date(activeCertificate.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {activeCertificate.approvedBy && (
                  <div className="text-right text-xs font-mono">
                    <div className="text-slate-400">AUTHORIZED BY:</div>
                    <div className="text-emerald-700 font-bold">{activeCertificate.approvedBy}</div>
                  </div>
                )}
              </div>

              {/* Chosen Plan Overview */}
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  RECOMMENDED RESPONSE PLAN
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{activeCertificate.chosenPlan.name}</h3>
                    <span className="text-xs font-mono text-emerald-700 font-bold">
                      Expected Loss: {activeCertificate.chosenPlan.metrics.expectedLoss} · CVaR-0.95: {activeCertificate.chosenPlan.metrics.cvar95WorstLoss}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 text-[10px] block">TOTAL RESCUED</span>
                      <span className="text-slate-900 font-bold">{activeCertificate.chosenPlan.metrics.totalRescued} civilians</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">AVG DISPATCH DELAY</span>
                      <span className="text-slate-700 font-medium">{activeCertificate.chosenPlan.metrics.expectedDelayMin} minutes</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">RESPONDER EXPOSURE</span>
                      <span className="text-amber-700 font-medium">{activeCertificate.chosenPlan.metrics.responderHazardExposure} hazard score</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">EQUITY GINI INDEX</span>
                      <span className="text-slate-700 font-medium">{activeCertificate.chosenPlan.metrics.equityVariance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hard Safety Constraints Checklist */}
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hard Safety Constraint Verification Checklist</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {activeCertificate.hardConstraintChecks.map((check, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-start gap-2.5"
                    >
                      {check.passed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">{check.rule}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{check.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational Limitations */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider font-mono">
                  Model Assumptions &amp; Operational Limitations
                </div>
                <ul className="text-slate-600 text-[11px] space-y-1 list-disc list-inside">
                  {activeCertificate.limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>

              {/* Commander Decision Action Box */}
              {activeCertificate.humanApprovalStatus === 'pending' ? (
                <div className="p-5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-sky-800 font-semibold text-xs uppercase tracking-wider font-mono">
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    <span>Commander Authorization Action</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-600 font-medium block">COMMANDER OPERATIONAL DIRECTIVE</label>
                    <input
                      type="text"
                      placeholder="e.g. Authorized for Phase 1 evacuation. Priority to Machar clinic ICU patients."
                      value={commanderNotes}
                      onChange={(e) => setCommanderNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        onApproveCertificate(
                          activeCertificate.certificateId,
                          'approved',
                          commanderNotes || 'Approved for immediate simulated mission execution.'
                        )
                      }
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Simulated Rescue Dispatch</span>
                    </button>

                    <button
                      onClick={() =>
                        onApproveCertificate(
                          activeCertificate.certificateId,
                          'revision_requested',
                          commanderNotes || 'Revision requested: re-evaluate with lower speed thresholds.'
                        )
                      }
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Revision</span>
                    </button>

                    <button
                      onClick={() =>
                        onApproveCertificate(
                          activeCertificate.certificateId,
                          'rejected',
                          commanderNotes || 'Rejected by Incident Commander.'
                        )
                      }
                      className="px-4 py-2 bg-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Plan</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="text-slate-400 font-mono text-[10px] uppercase font-medium">Logged Directive:</div>
                  <div className="text-slate-800 italic">
                    &quot;{activeCertificate.commanderNotes || 'Approved for mission execution.'}&quot;
                  </div>
                </div>
              )}
            </div>

            {/* Historical Certificates Ledger */}
            {certificates.length > 1 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                  Previous Certificates Ledger
                </h3>
                <div className="space-y-2">
                  {certificates.slice(1).map((cert) => (
                    <div
                      key={cert.certificateId}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs font-mono shadow-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{cert.certificateId}</span>
                        <span className="text-slate-400 ml-2">v{cert.worldVersion}</span>
                      </div>
                      <span className="text-slate-500 uppercase text-[11px] font-medium">
                        Status: {cert.humanApprovalStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
