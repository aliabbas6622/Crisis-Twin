import React, { useState } from 'react';
import {
  WorldState,
  ScenarioFuture,
  RescuePlan,
  ValueOfInformationAssessment
} from '../types/crisis';
import {
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle,
  Radio,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';

interface ScenarioLabProps {
  worldState: WorldState;
  scenarios: ScenarioFuture[];
  candidatePlans: RescuePlan[];
  voiAssessment: ValueOfInformationAssessment | null;
  onRunSimulation: () => void;
  onVerifyEdge: (targetEdgeId: string, status: 'open' | 'closed') => void;
  isSimulating: boolean;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({
  worldState,
  scenarios,
  candidatePlans,
  voiAssessment,
  onRunSimulation,
  onVerifyEdge,
  isSimulating,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-robust-cvar');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const selectedPlan =
    candidatePlans.find((p) => p.id === selectedPlanId) || candidatePlans[0];

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] p-6 overflow-y-auto bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                TwinFutures: Counterfactual Scenario Lab
              </h1>
              <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                World v{worldState.version}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Replay candidate response plans across identical sampled hazard futures to measure downside CVaR tail risk.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Sampling Scenarios...' : 'Run Counterfactual Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Value of Information (Active Sensing) Banner */}
        {voiAssessment && (
          <div className="p-4 bg-white border border-amber-200 rounded-xl space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                      ACTIVE SENSING GATE · VALUE OF INFORMATION (EVSI)
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Target: {voiAssessment.targetName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                    {voiAssessment.explanation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Decision Value (EVSI)</div>
                  <div className="text-base font-bold font-mono text-emerald-600">
                    +{voiAssessment.expectedDecisionValue} loss reduction
                  </div>
                </div>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Inspect Bridge Now</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2.5 border-t border-slate-100 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">UNCERTAINTY VARIANCE</span>
                <span className="text-slate-700 font-medium">{Math.round(voiAssessment.currentUncertainty * 100)}% collapse risk</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">DECIDE NOW (NO SENSING)</span>
                <span className="text-rose-600 font-medium">{voiAssessment.expectedLossWithoutVerification} expected loss</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">POST-SENSING EXPECTED LOSS</span>
                <span className="text-emerald-600 font-medium">{voiAssessment.expectedLossWithVerification} expected loss</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">SCOUT RECON LATENCY</span>
                <span className="text-slate-700 font-medium">~{voiAssessment.scoutInspectionDelayMin} minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Coherent Future Scenarios Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
              <GitBranch className="w-3.5 h-3.5 text-sky-600" />
              <span>Sampled Hazard Futures ({scenarios.length} Coherent Worlds)</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Conditioned on World State v{worldState.version}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {scenarios.map((scen, idx) => (
              <div
                key={scen.id}
                className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold font-mono text-sky-600">Omega {idx + 1}</span>
                  <span className="text-[10px] font-mono text-slate-400">Seed {scen.seed}</span>
                </div>
                <div className="text-xs font-medium text-slate-800 truncate" title={scen.name}>
                  {scen.name.split('(')[0]}
                </div>
                <div className="space-y-1 text-[11px] font-mono text-slate-500 pt-1.5 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Rainfall Surge:</span>
                    <span className="text-slate-800 font-medium">+{scen.rainfallSurgeMm} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tidal Level:</span>
                    <span className="text-slate-800 font-medium">+{scen.tidalSurgeMeters} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bridge Failures:</span>
                    <span className={scen.bridgeFailures.length > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {scen.bridgeFailures.length > 0 ? 'Malir Causeway' : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Competing Candidate Plans Comparison Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Counterfactual Plan Comparison Matrix (Tested on Identical Seeds)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {candidatePlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isRobust = plan.strategy === 'robust_cvar';

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative bg-white shadow-xs ${
                    isSelected
                      ? 'border-sky-500 ring-2 ring-sky-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isRobust && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-mono font-bold">
                      RECOMMENDED
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
                      <div className="text-[11px] text-slate-500 capitalize font-mono mt-0.5">
                        Strategy: {plan.strategy.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Metric Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs font-mono">
                      <div>
                        <div className="text-slate-400 text-[10px]">EXPECTED LOSS</div>
                        <div className="text-base font-bold text-slate-900">{plan.metrics.expectedLoss}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">CVAR-0.95 (TAIL RISK)</div>
                        <div className={`text-base font-bold ${isRobust ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {plan.metrics.cvar95WorstLoss}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">EXPECTED DELAY</div>
                        <div className="text-sm text-slate-700 font-medium">{plan.metrics.expectedDelayMin} min</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">CIVILIANS RESCUED</div>
                        <div className="text-sm text-sky-700 font-bold">{plan.metrics.totalRescued} / 88</div>
                      </div>
                    </div>

                    {/* Assumptions */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-slate-500">Core Assumptions:</div>
                      <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                        {plan.assumptions.map((assump, i) => (
                          <li key={i} className="leading-snug">{assump}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Hard Constraint Violations */}
                    {plan.hardConstraintViolations.length > 0 && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] space-y-1">
                        <div className="font-semibold flex items-center gap-1 text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Safety Violation</span>
                        </div>
                        <p>{plan.hardConstraintViolations[0]}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Selected Plan Mission Manifest */}
        {selectedPlan && (
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Assignment Manifest: {selectedPlan.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Vehicle-to-incident routing dispatch assignments simulated across 5 scenarios.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {selectedPlan.assignments.length} Rescue Units Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {selectedPlan.assignments.map((asg, idx) => {
                const resource = worldState.resources.find((r) => r.id === asg.resourceId);
                const shelter = worldState.shelters.find((s) => s.id === asg.destinationShelterId);

                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{resource?.name || asg.resourceId}</span>
                      <span className="text-[11px] font-mono text-sky-700 font-medium">
                        Transit: ~{asg.estimatedTransitMin} min
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Destination: <span className="text-slate-800 font-medium">{shelter?.name || asg.destinationShelterId}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 font-mono text-[11px]">
                      <span className="text-slate-500">Evacuees: <strong className="text-emerald-700">{asg.survivorsEvacuated}</strong></span>
                      <span className="text-slate-500">Hazard Exposure: <strong className="text-amber-700">{asg.responderExposureScore}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Targeted Verification Modal */}
      {showVerificationModal && voiAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-600" />
                <span>Simulate Field Scout Drone Verification</span>
              </h3>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Target: <strong className="text-slate-900">{voiAssessment.targetName}</strong>. Select the confirmed condition observed by the AeroScout drone telemetry. This will resolve the disputed hypothesis, increment world state to v{worldState.version + 1}, and trigger re-optimization.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  onVerifyEdge(voiAssessment.targetEdgeId, 'open');
                  setShowVerificationModal(false);
                }}
                className="w-full p-3 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Confirm Passable (Elevated Lanes Clear)</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-1">
                  Water level below 40cm. Trucks can transit safely without turnaround risk.
                </p>
              </button>

              <button
                onClick={() => {
                  onVerifyEdge(voiAssessment.targetEdgeId, 'closed');
                  setShowVerificationModal(false);
                }}
                className="w-full p-3 bg-rose-50/60 hover:bg-rose-50 border border-rose-200 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Confirm Impassable (Submerged / Structural Risk)</span>
                </div>
                <p className="text-[11px] text-rose-700/80 mt-1">
                  Water level exceeds 85cm. All rescue trucks must divert to Lyari Viaduct.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
