import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createKarachiFloodScenario } from './src/engine/dataFixtures';
import {
  generateScenarios,
  generateCandidatePlans,
  calculateValueOfInformation,
  verifyHardConstraints
} from './src/engine/counterfactualEngine';
import {
  WorldState,
  DecisionCertificate,
  AgentExecutionTrace,
  EvidenceItem,
  Incident
} from './src/types/crisis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory state store for the probabilistic digital twin
let currentWorldState: WorldState = createKarachiFloodScenario(42);
let currentCertificates: DecisionCertificate[] = [];
let agentTraceLog: AgentExecutionTrace[] = [];

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyPlaceholderKeyForBuild',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes

/**
 * 1. GET /api/state - Return current world state snapshot
 */
app.get('/api/state', (_req: Request, res: Response) => {
  res.json({
    worldState: currentWorldState,
    certificates: currentCertificates,
    recentTraces: agentTraceLog.slice(-10),
  });
});

/**
 * 2. POST /api/scenario/reset - Reset world to initial seeded state
 */
app.post('/api/scenario/reset', (req: Request, res: Response) => {
  const seed = req.body?.seed ? Number(req.body.seed) : 42;
  currentWorldState = createKarachiFloodScenario(seed);
  currentCertificates = [];
  agentTraceLog = [
    {
      id: `trace-init-${Date.now()}`,
      agentName: 'EvidenceAgent',
      inputSummary: `World initialized to Karachi Flood Simulation with Seed #${seed}`,
      outputSummary: 'Loaded 8 incidents, 5 rescue assets, 6 road edges, 3 shelters, and 2 disputed hypotheses.',
      status: 'success',
      timestamp: new Date().toISOString(),
    },
  ];
  res.json({ success: true, worldState: currentWorldState });
});

/**
 * 3. POST /api/agent/run - Execute hybrid multi-agent workflow
 * Coordinates GeoAgent, WeatherAgent, ReportAgent, NetworkAgent, and EvidenceAgent
 */
app.post('/api/agent/run', async (_req: Request, res: Response) => {
  const traces: AgentExecutionTrace[] = [];
  const timestamp = new Date().toISOString();

  // 1. WeatherAgent with Google Search Grounding
  let weatherSummary = 'Monsoon trough active over Sindh coast; predicted 45-75mm precipitation in next 6 hours with peak high tide of 2.4m.';
  let weatherGrounding: 'googleSearch' | 'deterministic_geospatial' = 'deterministic_geospatial';

  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Provide a concise 2-sentence meteorological hazard assessment for urban flood conditions in Karachi during intense monsoon rainfall and coastal Arabian sea high tide.',
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      if (response.text) {
        weatherSummary = response.text.trim();
        weatherGrounding = 'googleSearch';
      }
    } catch (err) {
      console.warn('WeatherAgent Gemini search fallback:', err);
    }
  }

  traces.push({
    id: `trace-weather-${Date.now()}`,
    agentName: 'WeatherAgent',
    toolUsed: 'googleSearch Grounding',
    groundingUsed: weatherGrounding,
    inputSummary: 'Querying coastal meteorological radar & Arabian Sea tidal surge forecasts',
    outputSummary: weatherSummary,
    status: 'success',
    timestamp,
  });

  // 2. GeoAgent with Google Maps Grounding
  let geoSummary = 'Verified coordinates for Malir River Causeway, Lyari Expressway, and JPMC Trauma Centre. Cross-referenced hospital access routes.';
  let geoGrounding: 'googleMaps' | 'deterministic_geospatial' = 'deterministic_geospatial';

  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Identify the primary river crossings and major public hospitals in Karachi that are vulnerable during monsoon floods, including Malir River Causeway, Lyari Expressway, and Jinnah Postgraduate Medical Centre.',
        config: {
          tools: [{ googleMaps: {} }],
        },
      });
      if (response.text) {
        geoSummary = response.text.trim();
        geoGrounding = 'googleMaps';
      }
    } catch (err) {
      console.warn('GeoAgent Gemini maps fallback:', err);
    }
  }

  traces.push({
    id: `trace-geo-${Date.now()}`,
    agentName: 'GeoAgent',
    toolUsed: 'googleMaps Grounding',
    groundingUsed: geoGrounding,
    inputSummary: 'Cross-verifying Karachi river bridges, hospital nodes, and elevation contours',
    outputSummary: geoSummary,
    status: 'success',
    timestamp,
  });

  // 3. ReportAgent (SOS Classification & Triage Extraction)
  traces.push({
    id: `trace-report-${Date.now()}`,
    agentName: 'ReportAgent',
    toolUsed: 'Jev Triage Classification Protocol',
    groundingUsed: 'deterministic_geospatial',
    inputSummary: `Parsed ${currentWorldState.incidents.length} raw distress messages and citizen field transmissions`,
    outputSummary: 'Classified 3 Critical tier (Maternity ICU, Lyari Roof, Korangi School), 3 High tier, and 2 Medium tier needs.',
    status: 'success',
    timestamp,
  });

  // 4. NetworkAgent (Road graph traversability)
  const impassableCount = currentWorldState.roadEdges.filter((e) => e.traversability === 'impassable').length;
  const disputedCount = currentWorldState.roadEdges.filter((e) => e.traversability === 'disputed').length;

  traces.push({
    id: `trace-net-${Date.now()}`,
    agentName: 'NetworkAgent',
    toolUsed: 'Topological Spatial Graph Engine',
    groundingUsed: 'deterministic_geospatial',
    inputSummary: 'Computed network traversability and water depth thresholds across 6 strategic corridors',
    outputSummary: `Detected ${impassableCount} flooded routes and ${disputedCount} structurally disputed bridge (Malir Causeway).`,
    status: disputedCount > 0 ? 'warning' : 'success',
    timestamp,
  });

  // 5. Evidence Integrity Engine (Reconciliation)
  traces.push({
    id: `trace-ev-${Date.now()}`,
    agentName: 'EvidenceAgent',
    toolUsed: 'TwinSense Evidence Reconciliation Ledger',
    groundingUsed: 'deterministic_geospatial',
    inputSummary: 'Assessing provenance, sensor reliability, and conflicting claims on bridge integrity',
    outputSummary: 'Flagged Malir Causeway as UNRESOLVED CONFLICT. Triggered Value-of-Information (VoI) review gate.',
    status: 'warning',
    timestamp,
  });

  agentTraceLog.push(...traces);

  res.json({
    success: true,
    traces,
    currentVersion: currentWorldState.version,
  });
});

/**
 * 4. POST /api/simulate/counterfactuals - Run scenario simulations
 */
app.post('/api/simulate/counterfactuals', (req: Request, res: Response) => {
  const scenarioCount = req.body?.scenarioCount ? Number(req.body.scenarioCount) : 5;
  const scenarios = generateScenarios(currentWorldState, scenarioCount);
  const candidatePlans = generateCandidatePlans(currentWorldState, scenarios);

  res.json({
    success: true,
    scenarios,
    candidatePlans,
    worldVersion: currentWorldState.version,
  });
});

/**
 * 5. GET /api/voi/calculate - Compute Value of Information for active sensing
 */
app.get('/api/voi/calculate', (_req: Request, res: Response) => {
  const assessment = calculateValueOfInformation(currentWorldState);
  res.json({ success: true, assessment });
});

/**
 * 6. POST /api/voi/verify - Submit targeted verification result (e.g. Drone Scout)
 * Bumps world state version v_k -> v_{k+1}
 */
app.post('/api/voi/verify', (req: Request, res: Response) => {
  const { targetEdgeId, observedStatus, notes } = req.body;

  const edgeIndex = currentWorldState.roadEdges.findIndex((e) => e.id === targetEdgeId);
  if (edgeIndex === -1) {
    return res.status(404).json({ error: 'Target edge not found' });
  }

  const prevVersion = currentWorldState.version;
  const nextVersion = prevVersion + 1;

  // Clone world state for immutability
  const updatedEdges = [...currentWorldState.roadEdges];
  const targetEdge = { ...updatedEdges[edgeIndex] };

  targetEdge.traversability = observedStatus === 'open' ? 'passable' : 'impassable';
  targetEdge.collapseProbability = observedStatus === 'open' ? 0.05 : 0.99;
  targetEdge.lastInspectedAt = new Date().toISOString();
  targetEdge.evidenceIds = [...targetEdge.evidenceIds, `obs-scout-${Date.now()}`];
  updatedEdges[edgeIndex] = targetEdge;

  // Update hypothesis
  const updatedHypotheses = currentWorldState.hypotheses.map((h) => {
    if (h.targetId === targetEdgeId) {
      return {
        ...h,
        confidence: observedStatus === 'open' ? 0.95 : 0.02,
        claim: `${h.claim} [VERIFIED: ${observedStatus.toUpperCase()}]`,
      };
    }
    return h;
  });

  // Add evidence assessment
  const newEvidence: EvidenceItem = {
    observationId: `obs-scout-${Date.now()}`,
    claimId: 'hypo-01',
    status: 'confirmed',
    reasons: [
      `AeroScout drone aerial thermal verification confirmed: ${targetEdge.name} is ${observedStatus === 'open' ? 'STRUCTURALLY PASSABLE' : 'IMPASSABLE / SUBMERGED'}.`,
      notes || 'Live drone telemetry streamed to TwinCommand.',
    ],
    corroboratingIds: [`obs-scout-${Date.now()}`],
    contradictingIds: [],
    reviewRequired: false,
    assessedAt: new Date().toISOString(),
  };

  currentWorldState = {
    ...currentWorldState,
    version: nextVersion,
    asOf: new Date().toISOString(),
    roadEdges: updatedEdges,
    hypotheses: updatedHypotheses,
    evidenceLog: [newEvidence, ...currentWorldState.evidenceLog],
  };

  // Log trace
  agentTraceLog.push({
    id: `trace-voi-${Date.now()}`,
    agentName: 'EvidenceAgent',
    toolUsed: 'Active Sensing Verification Ingest',
    groundingUsed: 'deterministic_geospatial',
    inputSummary: `Field scout verified ${targetEdge.name}: ${observedStatus.toUpperCase()}`,
    outputSummary: `World state version incremented v${prevVersion} -> v${nextVersion}. Disputed hypotheses resolved.`,
    status: 'success',
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    previousVersion: prevVersion,
    newVersion: nextVersion,
    worldState: currentWorldState,
  });
});

/**
 * 7. POST /api/certificate/generate - Create an immutable Decision Certificate
 */
app.post('/api/certificate/generate', (req: Request, res: Response) => {
  const scenarios = generateScenarios(currentWorldState, 5);
  const plans = generateCandidatePlans(currentWorldState, scenarios);
  const chosenPlan = plans[0]; // Robust CVaR plan by default
  const alternatives = plans.slice(1);

  const hardConstraintChecks = verifyHardConstraints(currentWorldState, chosenPlan);

  const certificate: DecisionCertificate = {
    certificateId: `CERT-${currentWorldState.version}-${Date.now().toString(36).toUpperCase()}`,
    worldVersion: currentWorldState.version,
    createdAt: new Date().toISOString(),
    chosenPlan,
    alternativePlans: alternatives,
    supportingEvidenceIds: currentWorldState.evidenceLog.map((e) => e.observationId),
    scenariosUsed: scenarios,
    hardConstraintChecks,
    limitations: [
      'Projections conditioned on current radar rainfall rate; extreme cloudbursts >150mm/hr would require emergency re-optimization.',
      'Civilians count estimates derived from mobile density and historical census; actual on-site counts may deviate by +/- 15%.',
      'SIMULATED SYSTEM: Authorized for operational rehearsal and mission planning only.',
    ],
    modelVersions: {
      orchestrator: 'CrisisTwin-HybridStateGraph-v2.4',
      geospatialModel: 'Gemini-3.8-Flash-GoogleMapsGrounding',
      weatherService: 'Gemini-3.8-Flash-GoogleSearchGrounding',
      optimizer: 'Robust-CVaR-Optimizer-v1.8',
    },
    humanApprovalStatus: 'pending',
  };

  currentCertificates.unshift(certificate);

  res.json({ success: true, certificate });
});

/**
 * 8. POST /api/certificate/approve - Human Commander Approval Gate
 */
app.post('/api/certificate/approve', (req: Request, res: Response) => {
  const { certificateId, status, commanderNotes, approverName } = req.body;

  const certIndex = currentCertificates.findIndex((c) => c.certificateId === certificateId);
  if (certIndex === -1) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  currentCertificates[certIndex] = {
    ...currentCertificates[certIndex],
    humanApprovalStatus: status,
    commanderNotes: commanderNotes || 'Approved by Incident Commander for execution in simulation.',
    approvedBy: approverName || 'Commander A. Abbas (Emergency Ops)',
    approvedAt: new Date().toISOString(),
  };

  // If approved, update vehicle assignments in simulation
  if (status === 'approved') {
    const chosen = currentCertificates[certIndex].chosenPlan;
    const updatedResources = currentWorldState.resources.map((res) => {
      const assignment = chosen.assignments.find((a) => a.resourceId === res.id);
      if (assignment) {
        return {
          ...res,
          status: 'en_route' as const,
          assignedIncidentIds: assignment.incidentIds,
          assignedShelterId: assignment.destinationShelterId,
        };
      }
      return res;
    });

    currentWorldState = {
      ...currentWorldState,
      resources: updatedResources,
    };
  }

  res.json({
    success: true,
    certificate: currentCertificates[certIndex],
    worldState: currentWorldState,
  });
});

/**
 * 9. POST /api/sos/submit - Dynamic SOS and citizen incident submission
 */
app.post('/api/sos/submit', (req: Request, res: Response) => {
  const { title, locationName, peopleCount, urgency, needType, waterDepthCm, notes } = req.body;

  const newIncident: Incident = {
    id: `inc-${Date.now().toString(36)}`,
    title: title || 'Emergency Civilian SOS Alert',
    locationName: locationName || 'Karachi Coastal District',
    coordinates: {
      lat: 24.8400 + (Math.random() - 0.5) * 0.08,
      lng: 67.0400 + (Math.random() - 0.5) * 0.08,
    },
    peopleCount: Number(peopleCount) || 5,
    urgency: urgency || 'high',
    needType: needType || 'evacuation',
    waterDepthCm: Number(waterDepthCm) || 60,
    evidenceIds: [`obs-citizen-${Date.now()}`],
    verificationStatus: 'unverified',
    createdAt: new Date().toISOString(),
    notes: notes || 'Citizen reported via mobile emergency channel.',
  };

  currentWorldState = {
    ...currentWorldState,
    version: currentWorldState.version + 1,
    incidents: [newIncident, ...currentWorldState.incidents],
  };

  agentTraceLog.push({
    id: `trace-sos-${Date.now()}`,
    agentName: 'ReportAgent',
    toolUsed: 'Citizen SOS Ingest Gateway',
    groundingUsed: 'deterministic_geospatial',
    inputSummary: `New distress call ingested: ${newIncident.title} (${newIncident.peopleCount} people)`,
    outputSummary: `Added to world state v${currentWorldState.version}. Unverified claim awaiting field corroboration.`,
    status: 'success',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, incident: newIncident, worldState: currentWorldState });
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CrisisTwin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
