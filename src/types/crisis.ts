/**
 * CrisisTwin Shared Types and System Contracts
 * Architecture reference: Diagram A & Diagram B
 */

export type NeedType = 'medical' | 'evacuation' | 'food_water' | 'infant_elderly' | 'structural_collapse';
export type TriageUrgency = 'critical' | 'high' | 'medium' | 'low';
export type EvidenceStatus = 'confirmed' | 'disputed' | 'unverified' | 'rejected';
export type TraversabilityStatus = 'passable' | 'disputed' | 'impassable' | 'unverified';
export type ResourceKind = 'rescue_boat' | 'high_clearance_truck' | 'ambulance' | 'scout_drone';
export type ResourceStatus = 'available' | 'en_route' | 'rescuing' | 'offline';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  title: string;
  locationName: string;
  coordinates: Coordinate;
  peopleCount: number;
  urgency: TriageUrgency;
  needType: NeedType;
  waterDepthCm: number;
  evidenceIds: string[];
  verificationStatus: EvidenceStatus;
  createdAt: string;
  notes?: string;
  assignedResourceId?: string;
  resolved?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  kind: ResourceKind;
  capacity: number;
  currentLocation: Coordinate;
  locationName: string;
  status: ResourceStatus;
  maxWaterDepthCm: number;
  fuelRemainingPct: number;
  assignedIncidentIds: string[];
  assignedShelterId?: string;
}

export interface RoadEdge {
  id: string;
  name: string;
  fromName: string;
  toName: string;
  fromCoord: Coordinate;
  toCoord: Coordinate;
  traversability: TraversabilityStatus;
  waterDepthCm: number;
  maxSafeDepthCm: number; // e.g. 30cm for trucks, 0cm for ambulances
  isBridge: boolean;
  collapseProbability: number; // 0 to 1
  evidenceIds: string[];
  lastInspectedAt?: string;
}

export interface Shelter {
  id: string;
  name: string;
  locationName: string;
  coordinates: Coordinate;
  capacity: number;
  currentOccupancy: number;
  suppliesStatus: 'adequate' | 'strained' | 'depleted';
  accessibleByBoat: boolean;
  accessibleByRoad: boolean;
}

export interface Hypothesis {
  id: string;
  targetId: string; // e.g. road edge id
  claim: string;
  confidence: number;
  supportingEvidenceIds: string[];
  opposingEvidenceIds: string[];
  decisionCriticality: 'high' | 'medium' | 'low';
}

export interface Observation {
  id: string;
  kind: 'sos_distress' | 'satellite_radar' | 'weather_forecast' | 'field_sensor' | 'drone_imagery';
  sourceName: string;
  sourceId: string;
  observedAt: string;
  ingestedAt: string;
  coordinates: Coordinate;
  locationName: string;
  payloadText: string;
  reliabilityScore: number; // 0 to 1
  isSimulation: boolean;
  rawConfidence?: number;
}

export interface EvidenceItem {
  observationId: string;
  claimId: string;
  status: EvidenceStatus;
  reasons: string[];
  corroboratingIds: string[];
  contradictingIds: string[];
  reviewRequired: boolean;
  assessedAt: string;
}

export interface WorldState {
  version: number;
  asOf: string;
  scenarioName: string;
  seed: number;
  incidents: Incident[];
  resources: Resource[];
  roadEdges: RoadEdge[];
  shelters: Shelter[];
  hypotheses: Hypothesis[];
  evidenceLog: EvidenceItem[];
  simulationFlag: boolean;
}

export interface ScenarioFuture {
  id: string;
  name: string;
  seed: number;
  rainfallSurgeMm: number;
  tidalSurgeMeters: number;
  bridgeFailures: string[]; // road edge IDs that fail in this future
  probabilityWeight: number;
}

export interface PlanAssignment {
  resourceId: string;
  incidentIds: string[];
  destinationShelterId: string;
  estimatedTransitMin: number;
  routeEdges: string[];
  survivorsEvacuated: number;
  responderExposureScore: number;
}

export interface PlanMetrics {
  expectedLoss: number;
  expectedDelayMin: number;
  unmetCivilianNeed: number;
  responderHazardExposure: number;
  equityVariance: number;
  cvar95WorstLoss: number;
  totalRescued: number;
  feasibilityChecked: boolean;
}

export interface RescuePlan {
  id: string;
  name: string;
  strategy: 'robust_cvar' | 'urgency_first' | 'nearest_first';
  worldVersion: number;
  assignments: PlanAssignment[];
  metrics: PlanMetrics;
  assumptions: string[];
  hardConstraintViolations: string[];
}

export interface ValueOfInformationAssessment {
  targetEdgeId: string;
  targetName: string;
  currentUncertainty: number;
  expectedLossWithoutVerification: number;
  expectedLossWithVerification: number;
  expectedDecisionValue: number; // EVSI
  scoutInspectionDelayMin: number;
  recommendedAction: 'inspect_immediately' | 'proceed_with_robust_plan';
  explanation: string;
}

export interface DecisionCertificate {
  certificateId: string;
  worldVersion: number;
  createdAt: string;
  chosenPlan: RescuePlan;
  alternativePlans: RescuePlan[];
  supportingEvidenceIds: string[];
  scenariosUsed: ScenarioFuture[];
  hardConstraintChecks: {
    rule: string;
    passed: boolean;
    details: string;
  }[];
  limitations: string[];
  modelVersions: {
    orchestrator: string;
    geospatialModel: string;
    weatherService: string;
    optimizer: string;
  };
  humanApprovalStatus: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  approvedBy?: string;
  approvedAt?: string;
  commanderNotes?: string;
}

export interface AgentExecutionTrace {
  id: string;
  agentName: 'GeoAgent' | 'WeatherAgent' | 'ReportAgent' | 'NetworkAgent' | 'EvidenceAgent';
  toolUsed?: string;
  groundingUsed?: 'googleSearch' | 'googleMaps' | 'deterministic_geospatial';
  inputSummary: string;
  outputSummary: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
  dataPayload?: unknown;
}
