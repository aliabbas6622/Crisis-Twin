import React, { useState } from 'react';
import { WorldState, Resource, Incident } from '../types/crisis';
import {
  Wifi,
  WifiOff,
  Truck,
  CheckCircle,
  UploadCloud,
  MapPin,
  Clock,
  Send
} from 'lucide-react';

interface ResponderPwaProps {
  worldState: WorldState;
  onSubmitSos: (data: {
    title: string;
    locationName: string;
    peopleCount: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    needType: 'evacuation' | 'medical' | 'food_water' | 'infant_elderly' | 'structural_collapse';
    waterDepthCm: number;
    notes: string;
  }) => void;
}

interface QueuedReport {
  id: string;
  title: string;
  locationName: string;
  waterDepthCm: number;
  peopleCount: number;
  notes: string;
  timestamp: string;
}

export const ResponderPwa: React.FC<ResponderPwaProps> = ({ worldState, onSubmitSos }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('res-boat-1');
  const [offlineQueue, setOfflineQueue] = useState<QueuedReport[]>([]);
  const [reportTitle, setReportTitle] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [waterDepth, setWaterDepth] = useState(70);
  const [peopleCount, setPeopleCount] = useState(4);
  const [reportNotes, setReportNotes] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const selectedUnit = worldState.resources.find((r) => r.id === selectedUnitId) || worldState.resources[0];

  const handleQueueReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !reportLocation) return;

    const newReport: QueuedReport = {
      id: `queue-${Date.now()}`,
      title: reportTitle,
      locationName: reportLocation,
      waterDepthCm: waterDepth,
      peopleCount,
      notes: reportNotes || 'Reported from field unit.',
      timestamp: new Date().toISOString(),
    };

    if (isOnline) {
      onSubmitSos({
        title: reportTitle,
        locationName: reportLocation,
        peopleCount,
        urgency: 'high',
        needType: 'evacuation',
        waterDepthCm: waterDepth,
        notes: reportNotes,
      });
      setSyncStatus('Report transmitted directly to TwinSense Ingestion.');
    } else {
      setOfflineQueue((p) => [newReport, ...p]);
      setSyncStatus('Offline: Report queued in local encrypted storage.');
    }

    setReportTitle('');
    setReportLocation('');
    setReportNotes('');
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleSyncAll = () => {
    offlineQueue.forEach((rep) => {
      onSubmitSos({
        title: rep.title,
        locationName: rep.locationName,
        peopleCount: rep.peopleCount,
        urgency: 'high',
        needType: 'evacuation',
        waterDepthCm: rep.waterDepthCm,
        notes: rep.notes,
      });
    });
    setOfflineQueue([]);
    setSyncStatus(`Successfully synchronized ${offlineQueue.length} offline field observations.`);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] p-6 overflow-y-auto bg-slate-50 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Mobile Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">CrisisTwin Field Responder PWA</h1>
              <div className="text-xs text-slate-500">
                Offline-First Resilient Mobile Telemetry Client
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ONLINE (SYNCED)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>OFFLINE SIMULATION</span>
                </>
              )}
            </button>

            {offlineQueue.length > 0 && isOnline && (
              <button
                onClick={handleSyncAll}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Sync ({offlineQueue.length})</span>
              </button>
            )}
          </div>
        </div>

        {syncStatus && (
          <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Vehicle Unit Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono block">
            Select Active Field Unit:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {worldState.resources.map((unit) => (
              <button
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer shadow-xs ${
                  selectedUnitId === unit.id
                    ? 'bg-white border-sky-500 ring-2 ring-sky-500/10 text-slate-900 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold truncate text-slate-900">{unit.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">
                  {unit.status} · {unit.capacity} seats
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Waypoints & Guidance */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Mission Waypoint Guidance: {selectedUnit?.name}
              </h2>
              <p className="text-xs text-slate-500">
                Turn-by-turn water level warnings and survivor manifest.
              </p>
            </div>
            <span className="text-xs font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 font-medium">
              Fuel: {selectedUnit?.fuelRemainingPct}%
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-semibold text-slate-900">Staging Base: {selectedUnit?.locationName}</div>
                <div className="text-slate-500 text-[11px]">
                  Departing via elevated Shahrah-e-Faisal corridor. Avoid coastal beach underpasses.
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-sky-200/80 flex items-start gap-3">
              <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-semibold text-slate-900">Assigned Rescue Target: Sector 8-B School</div>
                <div className="text-slate-500 text-[11px]">
                  Estimated transit: ~18 min. Ground water depth approx 110cm. Inflatable boat required for final 400m approach.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Field Observation Logging */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Log Field Observation (Works Offline)</h2>
            <p className="text-xs text-slate-500">
              Submit on-the-ground observations of flooded roads, stranded civilians, or breached culverts.
            </p>
          </div>

          <form onSubmit={handleQueueReport} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 text-[11px] font-medium block mb-1">OBSERVATION TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Submerged culvert on Korangi link"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium block mb-1">LOCATION / LANDMARK</label>
                <input
                  type="text"
                  placeholder="e.g. Near Indus Hospital Crossing"
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 text-[11px] font-medium block mb-1">MEASURED WATER DEPTH (CM)</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={waterDepth}
                  onChange={(e) => setWaterDepth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 text-[11px] font-medium block mb-1">PEOPLE AT LOCATION</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 text-[11px] font-medium block mb-1">FIELD NOTES</label>
              <textarea
                rows={2}
                placeholder="Observed vehicle transit viability, flow velocity, power lines..."
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isOnline ? 'Transmit Observation to TwinSense' : 'Queue Observation Offline'}</span>
            </button>
          </form>

          {/* Queued Reports Table */}
          {offlineQueue.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-amber-700">
                Locally Queued Observations ({offlineQueue.length})
              </div>
              <div className="space-y-1.5">
                {offlineQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      <span className="text-slate-500 ml-2 font-mono">({item.locationName})</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      QUEUED OFFLINE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
