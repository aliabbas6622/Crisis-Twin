import React, { useState } from 'react';
import {
  WorldState,
  AgentExecutionTrace,
  TriageUrgency,
  NeedType
} from '../types/crisis';
import {
  Cpu,
  Radio,
  Search,
  MapPin,
  Send,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AgentIntelligenceProps {
  worldState: WorldState;
  traces: AgentExecutionTrace[];
  onRunAgentCycle: () => void;
  onSubmitSos: (data: {
    title: string;
    locationName: string;
    peopleCount: number;
    urgency: TriageUrgency;
    needType: NeedType;
    waterDepthCm: number;
    notes: string;
  }) => void;
  isAgentRunning: boolean;
}

export const AgentIntelligence: React.FC<AgentIntelligenceProps> = ({
  worldState,
  traces,
  onRunAgentCycle,
  onSubmitSos,
  isAgentRunning,
}) => {
  const [sosForm, setSosForm] = useState({
    title: '',
    locationName: '',
    peopleCount: 6,
    urgency: 'critical' as TriageUrgency,
    needType: 'evacuation' as NeedType,
    waterDepthCm: 90,
    notes: '',
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosForm.title || !sosForm.locationName) return;
    onSubmitSos(sosForm);
    setSosForm({
      title: '',
      locationName: '',
      peopleCount: 6,
      urgency: 'critical',
      needType: 'evacuation',
      waterDepthCm: 90,
      notes: '',
    });
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 3000);
  };

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] p-6 overflow-y-auto bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                Autonomous Multi-Agent Intelligence &amp; Evidence Engine
              </h1>
              <span className="text-xs font-mono font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                Gemini 3.8 Flash Grounded
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hybrid state-machine orchestrating specialized agents with Google Search and Maps Grounding.
            </p>
          </div>

          <button
            onClick={onRunAgentCycle}
            disabled={isAgentRunning}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isAgentRunning ? 'Running State Machine...' : 'Execute Agent Workflow'}</span>
          </button>
        </div>

        {/* Workflow State Diagram */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2 font-mono">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            <span>Hybrid Multi-Agent Workflow State Diagram</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            {/* Step 1: Ingestion */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="text-[10px] font-mono font-semibold text-slate-400">STAGE 01 · INTAKE</div>
              <div className="font-semibold text-slate-900">Event Ingestion</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                FastAPI ingress, coordinate normalization &amp; deduplication verification.
              </p>
            </div>

            {/* Step 2: Parallel Fan-Out (Geo & Weather) */}
            <div className="p-3 bg-sky-50/60 rounded-lg border border-sky-200 space-y-1.5">
              <div className="text-[10px] font-mono font-semibold text-sky-700">STAGE 02 · PARALLEL FAN-OUT</div>
              <div className="font-semibold text-slate-900">Geo &amp; Weather Agents</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Gemini 3.8 Flash with <strong>Google Search</strong> (monsoon radar) and <strong>Google Maps</strong> (Karachi bridges).
              </p>
            </div>

            {/* Step 3: Triage & Graph */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="text-[10px] font-mono font-semibold text-slate-400">STAGE 03 · TRIAGE &amp; GRAPH</div>
              <div className="font-semibold text-slate-900">Report &amp; Network</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Jev-style rubric classification of SOS urgency and road water clearance.
              </p>
            </div>

            {/* Step 4: Evidence Integrity */}
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1.5">
              <div className="text-[10px] font-mono font-semibold text-amber-700">STAGE 04 · RECONCILIATION</div>
              <div className="font-semibold text-slate-900">Evidence Integrity</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                TwinSense resolves contradictions, marks unverified bridges, flags active sensing needs.
              </p>
            </div>

            {/* Step 5: Versioned Digital Twin */}
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1.5">
              <div className="text-[10px] font-mono font-semibold text-emerald-700">STAGE 05 · DIGITAL TWIN</div>
              <div className="font-semibold text-slate-900">TwinWorld Snapshot</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Commits immutable world state v{worldState.version} with spatial belief distribution.
              </p>
            </div>
          </div>
        </div>

        {/* Live Execution Traces Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
                <Cpu className="w-3.5 h-3.5 text-sky-600" />
                <span>Agent Execution Traces &amp; Tool Grounding</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">Live Telemetry</span>
            </div>

            <div className="space-y-3">
              {traces.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-400 shadow-xs">
                  No execution traces logged yet. Click &quot;Execute Agent Workflow&quot; above to run the multi-agent pipeline.
                </div>
              ) : (
                traces.map((trace) => (
                  <div
                    key={trace.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{trace.agentName}</span>
                        {trace.groundingUsed && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1">
                            {trace.groundingUsed === 'googleSearch' && <Search className="w-3 h-3" />}
                            {trace.groundingUsed === 'googleMaps' && <MapPin className="w-3 h-3" />}
                            <span>{trace.groundingUsed}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="text-slate-400 font-mono text-[10px] block uppercase font-medium">Task:</span>
                      {trace.inputSummary}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-mono">
                      <span className="text-slate-400 text-[10px] block uppercase font-medium">Output:</span>
                      {trace.outputSummary}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Distress SOS Simulation Intake */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Simulate Distress SOS Inflow</span>
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 text-xs shadow-xs"
            >
              <p className="text-[11px] text-slate-500">
                Inject custom emergency observations to test multi-agent triage and world state version updates.
              </p>

              <div>
                <label className="text-slate-600 text-[11px] font-medium block mb-1">INCIDENT TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Stranded school bus on Korangi link"
                  value={sosForm.title}
                  onChange={(e) => setSosForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium block mb-1">LOCATION NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Malir Causeway Underpass"
                  value={sosForm.locationName}
                  onChange={(e) => setSosForm((p) => ({ ...p, locationName: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 text-[11px] font-medium block mb-1">PEOPLE COUNT</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={sosForm.peopleCount}
                    onChange={(e) => setSosForm((p) => ({ ...p, peopleCount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 text-[11px] font-medium block mb-1">WATER DEPTH (CM)</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={sosForm.waterDepthCm}
                    onChange={(e) => setSosForm((p) => ({ ...p, waterDepthCm: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 text-[11px] font-medium block mb-1">URGENCY</label>
                  <select
                    value={sosForm.urgency}
                    onChange={(e) => setSosForm((p) => ({ ...p, urgency: e.target.value as TriageUrgency }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 text-[11px] font-medium block mb-1">NEED TYPE</label>
                  <select
                    value={sosForm.needType}
                    onChange={(e) => setSosForm((p) => ({ ...p, needType: e.target.value as NeedType }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500"
                  >
                    <option value="evacuation">Evacuation</option>
                    <option value="medical">Medical</option>
                    <option value="food_water">Food / Water</option>
                    <option value="infant_elderly">Infant / Elderly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium block mb-1">FIELD NOTES</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or caller details..."
                  value={sosForm.notes}
                  onChange={(e) => setSosForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Inject Simulated SOS Distress Call</span>
              </button>

              {formSubmitted && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-center text-xs">
                  SOS Ingested! Digital twin state incremented to v{worldState.version}.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
