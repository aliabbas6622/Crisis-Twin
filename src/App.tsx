import React, { useState, useEffect } from 'react';
import {
  WorldState,
  ScenarioFuture,
  RescuePlan,
  ValueOfInformationAssessment,
  DecisionCertificate,
  AgentExecutionTrace,
  TriageUrgency,
  NeedType,
  Incident,
  RoadEdge
} from './types/crisis';
import { createKarachiFloodScenario } from './engine/dataFixtures';
import {
  generateScenarios,
  generateCandidatePlans,
  calculateValueOfInformation,
  verifyHardConstraints
} from './engine/counterfactualEngine';
import { TopNav } from './components/TopNav';
import { DisasterMap } from './components/DisasterMap';
import { ScenarioLab } from './components/ScenarioLab';
import { AgentIntelligence } from './components/AgentIntelligence';
import { MissionPlanner } from './components/MissionPlanner';
import { ResponderPwa } from './components/ResponderPwa';

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'scenario' | 'agents' | 'planner' | 'responder'>('map');

  // Core state
  const [worldState, setWorldState] = useState<WorldState>(() => createKarachiFloodScenario(42));
  const [scenarios, setScenarios] = useState<ScenarioFuture[]>(() => generateScenarios(createKarachiFloodScenario(42), 5));
  const [candidatePlans, setCandidatePlans] = useState<RescuePlan[]>(() =>
    generateCandidatePlans(createKarachiFloodScenario(42), generateScenarios(createKarachiFloodScenario(42), 5))
  );
  const [voiAssessment, setVoiAssessment] = useState<ValueOfInformationAssessment | null>(() =>
    calculateValueOfInformation(createKarachiFloodScenario(42))
  );
  const [certificates, setCertificates] = useState<DecisionCertificate[]>([]);
  const [traces, setTraces] = useState<AgentExecutionTrace[]>([]);

  // Loading states
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initial load from backend API
  useEffect(() => {
    async function loadInitialData() {
      try {
        const stateRes = await fetch('/api/state');
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          if (stateData.worldState) {
            setWorldState(stateData.worldState);
          }
          if (stateData.certificates) {
            setCertificates(stateData.certificates);
          }
          if (stateData.recentTraces) {
            setTraces(stateData.recentTraces);
          }
        }

        const simRes = await fetch('/api/simulate/counterfactuals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioCount: 5 }),
        });
        if (simRes.ok) {
          const simData = await simRes.json();
          if (simData.scenarios) setScenarios(simData.scenarios);
          if (simData.candidatePlans) setCandidatePlans(simData.candidatePlans);
        }

        const voiRes = await fetch('/api/voi/calculate');
        if (voiRes.ok) {
          const voiData = await voiRes.json();
          if (voiData.assessment) setVoiAssessment(voiData.assessment);
        }
      } catch (err) {
        console.warn('API sync fallback to local engine:', err);
      }
    }

    loadInitialData();
  }, []);

  // Action 1: Run Full Multi-Agent Workflow
  const handleRunAgentCycle = async () => {
    setIsAgentRunning(true);
    try {
      const res = await fetch('/api/agent/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.traces) {
          setTraces((p) => [...data.traces, ...p]);
        }
      }
    } catch (err) {
      console.error('Agent cycle error:', err);
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Action 2: Run Counterfactual Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/simulate/counterfactuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioCount: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        setScenarios(data.scenarios);
        setCandidatePlans(data.candidatePlans);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Action 3: Targeted Verification of Bridge / Edge (Active Sensing)
  const handleVerifyEdge = async (targetEdgeId: string, status: 'open' | 'closed') => {
    try {
      const res = await fetch('/api/voi/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEdgeId,
          observedStatus: status,
          notes: 'Thermal drone confirmed real-time water flow and bridge substructure integrity.',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);

        // Re-simulate after world state version bump
        const simRes = await fetch('/api/simulate/counterfactuals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioCount: 5 }),
        });
        if (simRes.ok) {
          const simData = await simRes.json();
          setScenarios(simData.scenarios);
          setCandidatePlans(simData.candidatePlans);
        }

        // Recompute VoI
        const voiRes = await fetch('/api/voi/calculate');
        if (voiRes.ok) {
          const voiData = await voiRes.json();
          setVoiAssessment(voiData.assessment);
        }
      }
    } catch (err) {
      console.error('Verify edge error:', err);
    }
  };

  // Action 4: Generate Decision Certificate
  const handleGenerateCertificate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/certificate/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCertificates((p) => [data.certificate, ...p]);
        setActiveTab('planner');
      }
    } catch (err) {
      console.error('Generate certificate error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Action 5: Approve Decision Certificate (Human Gate)
  const handleApproveCertificate = async (
    certificateId: string,
    status: 'approved' | 'rejected' | 'revision_requested',
    notes: string
  ) => {
    try {
      const res = await fetch('/api/certificate/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId,
          status,
          commanderNotes: notes,
          approverName: 'Incident Commander A. Abbas',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCertificates((p) =>
          p.map((c) => (c.certificateId === certificateId ? data.certificate : c))
        );
        if (data.worldState) {
          setWorldState(data.worldState);
        }
      }
    } catch (err) {
      console.error('Approve certificate error:', err);
    }
  };

  // Action 6: Submit Distress SOS
  const handleSubmitSos = async (sosData: {
    title: string;
    locationName: string;
    peopleCount: number;
    urgency: TriageUrgency;
    needType: NeedType;
    waterDepthCm: number;
    notes: string;
  }) => {
    try {
      const res = await fetch('/api/sos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sosData),
      });

      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
      }
    } catch (err) {
      console.error('SOS submit error:', err);
    }
  };

  // Action 7: Reset Scenario to Seed
  const handleResetScenario = async () => {
    try {
      const res = await fetch('/api/scenario/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: 42 }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        setCertificates([]);
        handleRunSimulation();
      }
    } catch (err) {
      console.error('Reset scenario error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Strict Top Navigation Bar */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        worldVersion={worldState.version}
        onRunAgentCycle={handleRunAgentCycle}
        isAgentRunning={isAgentRunning}
        onResetScenario={handleResetScenario}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'map' && (
          <DisasterMap
            worldState={worldState}
            onSelectEdge={(edge: RoadEdge) => {
              if (edge.traversability === 'disputed') {
                setActiveTab('scenario');
              }
            }}
          />
        )}

        {activeTab === 'scenario' && (
          <ScenarioLab
            worldState={worldState}
            scenarios={scenarios}
            candidatePlans={candidatePlans}
            voiAssessment={voiAssessment}
            onRunSimulation={handleRunSimulation}
            onVerifyEdge={handleVerifyEdge}
            isSimulating={isSimulating}
          />
        )}

        {activeTab === 'agents' && (
          <AgentIntelligence
            worldState={worldState}
            traces={traces}
            onRunAgentCycle={handleRunAgentCycle}
            onSubmitSos={handleSubmitSos}
            isAgentRunning={isAgentRunning}
          />
        )}

        {activeTab === 'planner' && (
          <MissionPlanner
            worldState={worldState}
            certificates={certificates}
            onGenerateCertificate={handleGenerateCertificate}
            onApproveCertificate={handleApproveCertificate}
            isGenerating={isGenerating}
          />
        )}

        {activeTab === 'responder' && (
          <ResponderPwa
            worldState={worldState}
            onSubmitSos={handleSubmitSos}
          />
        )}
      </main>
    </div>
  );
}
