import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  WorldState,
  Incident,
  Resource,
  RoadEdge,
  Shelter,
  TriageUrgency
} from '../types/crisis';
import {
  AlertTriangle,
  Truck,
  Navigation,
  Waves,
  Building,
  Radio,
  X,
  Layers,
  MapPin,
  Globe,
  Map as MapIcon
} from 'lucide-react';

interface DisasterMapProps {
  worldState: WorldState;
  onSelectEdge?: (edge: RoadEdge) => void;
  onSelectIncident?: (incident: Incident) => void;
}

export const DisasterMap: React.FC<DisasterMapProps> = ({
  worldState,
  onSelectEdge,
  onSelectIncident,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups refs
  const floodLayerRef = useRef<L.LayerGroup | null>(null);
  const roadLayerRef = useRef<L.LayerGroup | null>(null);
  const incidentLayerRef = useRef<L.LayerGroup | null>(null);
  const resourceLayerRef = useRef<L.LayerGroup | null>(null);
  const shelterLayerRef = useRef<L.LayerGroup | null>(null);

  const [basemap, setBasemap] = useState<'street' | 'satellite'>('street');
  const [selectedItem, setSelectedItem] = useState<{
    type: 'incident' | 'edge' | 'resource' | 'shelter';
    data: Incident | RoadEdge | Resource | Shelter;
  } | null>(null);

  const [activeLayers, setActiveLayers] = useState({
    floodZones: true,
    roadNetwork: true,
    incidents: true,
    resources: true,
    shelters: true,
  });

  const getUrgencyColor = (urgency: TriageUrgency) => {
    switch (urgency) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#0ea5e9';
      case 'low':
        return '#10b981';
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Karachi (Lat: 24.8607, Lng: 67.0400)
    const map = L.map(mapContainerRef.current, {
      center: [24.8550, 67.0450],
      zoom: 12,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false, // Reposition or use custom
    });

    // Add Zoom Control on bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Street TileLayer (CartoDB Voyager: crisp, readable street & city features)
    const streetTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = streetTiles;

    // Create Layer Groups
    floodLayerRef.current = L.layerGroup().addTo(map);
    roadLayerRef.current = L.layerGroup().addTo(map);
    incidentLayerRef.current = L.layerGroup().addTo(map);
    resourceLayerRef.current = L.layerGroup().addTo(map);
    shelterLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap (Street vs Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (basemap === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 18,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);
    }
  }, [basemap]);

  // Update Flood Zones Layer
  useEffect(() => {
    const group = floodLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers.floodZones) return;

    // 1. Lyari River Delta Flood Inundation Polygon
    const lyariPolygon = L.polygon(
      [
        [24.8820, 66.9600],
        [24.8950, 67.0000],
        [24.8720, 67.0350],
        [24.8500, 67.0100],
        [24.8420, 66.9750],
      ],
      {
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.28,
        weight: 1.5,
      }
    ).bindTooltip(
      '<div class="font-sans text-xs font-semibold text-sky-900">Lyari River Delta Inundation Zone<div class="text-[10px] text-sky-700 font-normal">Water Depth: 160 cm · High Flash Surcharge</div></div>',
      { sticky: true }
    );
    group.addLayer(lyariPolygon);

    // 2. Malir River Basin & Korangi Creek Flood Inundation Polygon
    const malirPolygon = L.polygon(
      [
        [24.8620, 67.0750],
        [24.8780, 67.1400],
        [24.8350, 67.1550],
        [24.8150, 67.1100],
        [24.8250, 67.0650],
      ],
      {
        color: '#0369a1',
        fillColor: '#0ea5e9',
        fillOpacity: 0.28,
        weight: 1.5,
      }
    ).bindTooltip(
      '<div class="font-sans text-xs font-semibold text-sky-900">Malir River Basin Inundation Zone<div class="text-[10px] text-sky-700 font-normal">Water Depth: 120 cm · Estuary Backflow</div></div>',
      { sticky: true }
    );
    group.addLayer(malirPolygon);

    // 3. PECHS Underpass Basin
    const pechsPolygon = L.polygon(
      [
        [24.8740, 67.0500],
        [24.8760, 67.0750],
        [24.8620, 67.0750],
        [24.8600, 67.0500],
      ],
      {
        color: '#0ea5e9',
        fillColor: '#7dd3fc',
        fillOpacity: 0.22,
        weight: 1.2,
      }
    ).bindTooltip(
      '<div class="font-sans text-xs font-semibold text-sky-900">PECHS Underpass Drainage Basin<div class="text-[10px] text-sky-700 font-normal">Water Depth: 55 cm</div></div>',
      { sticky: true }
    );
    group.addLayer(pechsPolygon);
  }, [activeLayers.floodZones]);

  // Update Road Network & Bridges Layer
  useEffect(() => {
    const group = roadLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers.roadNetwork) return;

    worldState.roadEdges.forEach((edge) => {
      const latlngs: [number, number][] = [
        [edge.fromCoord.lat, edge.fromCoord.lng],
        [edge.toCoord.lat, edge.toCoord.lng],
      ];

      let color = '#10b981';
      let dashArray: string | undefined = undefined;
      let weight = 4.5;

      if (edge.traversability === 'impassable') {
        color = '#ef4444';
        dashArray = '8, 8';
        weight = 4;
      } else if (edge.traversability === 'disputed') {
        color = '#f59e0b';
        dashArray = '10, 6';
        weight = 5;
      } else if (edge.traversability === 'unverified') {
        color = '#64748b';
        dashArray = '5, 5';
        weight = 3.5;
      }

      const polyline = L.polyline(latlngs, {
        color,
        weight,
        dashArray,
        opacity: 0.9,
      });

      polyline.on('click', () => {
        setSelectedItem({ type: 'edge', data: edge });
        if (onSelectEdge) onSelectEdge(edge);
      });

      polyline.bindTooltip(
        `<div class="font-sans text-xs"><strong>${edge.name}</strong><div class="text-[10px] text-slate-500 uppercase font-mono">${edge.traversability} · ${edge.waterDepthCm}cm water</div></div>`,
        { sticky: true }
      );

      group.addLayer(polyline);

      // Add Bridge midpoint icon
      if (edge.isBridge) {
        const midLat = (edge.fromCoord.lat + edge.toCoord.lat) / 2;
        const midLng = (edge.fromCoord.lng + edge.toCoord.lng) / 2;

        const bridgeIcon = L.divIcon({
          className: 'bridge-marker',
          html: `
            <div style="
              width: 22px;
              height: 22px;
              background: #ffffff;
              border: 2px solid ${color};
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.15);
              cursor: pointer;
            ">
              <span style="font-size: 11px; font-weight: bold; color: ${color};">⫽</span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([midLat, midLng], { icon: bridgeIcon });
        marker.on('click', () => {
          setSelectedItem({ type: 'edge', data: edge });
          if (onSelectEdge) onSelectEdge(edge);
        });
        group.addLayer(marker);
      }
    });
  }, [activeLayers.roadNetwork, worldState.roadEdges, onSelectEdge]);

  // Update Incidents Layer
  useEffect(() => {
    const group = incidentLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers.incidents) return;

    worldState.incidents.forEach((inc) => {
      const color = getUrgencyColor(inc.urgency);
      const size = Math.max(26, Math.min(38, 20 + inc.peopleCount * 0.8));

      const incidentIcon = L.divIcon({
        className: 'incident-marker',
        html: `
          <div style="position: relative; width: ${size}px; height: ${size}px; cursor: pointer;">
            ${
              inc.urgency === 'critical'
                ? `<div style="
                    position: absolute;
                    inset: -5px;
                    border-radius: 9999px;
                    background: ${color};
                    opacity: 0.25;
                    animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>`
                : ''
            }
            <div style="
              position: relative;
              width: 100%;
              height: 100%;
              border-radius: 9999px;
              background: ${color};
              border: 2.5px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.22);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-family: monospace;
              font-weight: 700;
              font-size: ${size > 30 ? '12px' : '10px'};
            ">
              ${inc.peopleCount}
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], {
        icon: incidentIcon,
      });

      marker.on('click', () => {
        setSelectedItem({ type: 'incident', data: inc });
        if (onSelectIncident) onSelectIncident(inc);
      });

      marker.bindTooltip(
        `<div class="font-sans text-xs"><strong>${inc.title}</strong><div class="text-[10px] text-slate-500 font-mono">${inc.peopleCount} casualties · ${inc.urgency.toUpperCase()} · ${inc.waterDepthCm}cm</div></div>`,
        { sticky: true }
      );

      group.addLayer(marker);
    });
  }, [activeLayers.incidents, worldState.incidents, onSelectIncident]);

  // Update Resources / Fleet Layer
  useEffect(() => {
    const group = resourceLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers.resources) return;

    worldState.resources.forEach((res) => {
      const label =
        res.kind === 'rescue_boat'
          ? 'B'
          : res.kind === 'ambulance'
          ? 'A'
          : res.kind === 'scout_drone'
          ? 'D'
          : 'T';

      const unitIcon = L.divIcon({
        className: 'resource-marker',
        html: `
          <div style="
            width: 26px;
            height: 26px;
            background: #0284c7;
            border: 2px solid #ffffff;
            border-radius: 7px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-family: sans-serif;
            font-weight: 700;
            font-size: 11px;
            cursor: pointer;
          ">
            ${label}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([res.currentLocation.lat, res.currentLocation.lng], {
        icon: unitIcon,
      });

      marker.on('click', () => {
        setSelectedItem({ type: 'resource', data: res });
      });

      marker.bindTooltip(
        `<div class="font-sans text-xs"><strong>${res.name}</strong><div class="text-[10px] text-slate-500 font-mono">Status: ${res.status.toUpperCase()} · Cap: ${res.capacity}</div></div>`,
        { sticky: true }
      );

      group.addLayer(marker);
    });
  }, [activeLayers.resources, worldState.resources]);

  // Update Shelters Layer
  useEffect(() => {
    const group = shelterLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeLayers.shelters) return;

    worldState.shelters.forEach((shelter) => {
      const shelterIcon = L.divIcon({
        className: 'shelter-marker',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: #6366f1;
            border: 2px solid #ffffff;
            border-radius: 7px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-family: sans-serif;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
          ">
            H
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([shelter.coordinates.lat, shelter.coordinates.lng], {
        icon: shelterIcon,
      });

      marker.on('click', () => {
        setSelectedItem({ type: 'shelter', data: shelter });
      });

      marker.bindTooltip(
        `<div class="font-sans text-xs"><strong>${shelter.name}</strong><div class="text-[10px] text-slate-500 font-mono">Capacity: ${shelter.currentOccupancy}/${shelter.capacity} beds</div></div>`,
        { sticky: true }
      );

      group.addLayer(marker);
    });
  }, [activeLayers.shelters, worldState.shelters]);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex overflow-hidden bg-slate-100">
      {/* Map Viewport Canvas */}
      <div className="relative flex-1 h-full overflow-hidden flex flex-col">
        {/* Real Leaflet DOM Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Clean, Non-Overlapping Floating Controls Bar (Top Left) */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg shadow-sm text-xs max-w-[calc(100%-2rem)]">
          {/* Basemap Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200/80 mr-1">
            <button
              onClick={() => setBasemap('street')}
              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                basemap === 'street'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Street</span>
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                basemap === 'satellite'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span>Satellite</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 my-auto hidden sm:block" />

          {/* Layer Toggles */}
          <button
            onClick={() => setActiveLayers((p) => ({ ...p, floodZones: !p.floodZones }))}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayers.floodZones
                ? 'bg-sky-50 text-sky-700 border border-sky-200 font-medium'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-sky-500" />
            <span>Flood</span>
          </button>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, roadNetwork: !p.roadNetwork }))}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayers.roadNetwork
                ? 'bg-slate-100 text-slate-900 border border-slate-200 font-medium'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-slate-600" />
            <span>Roads</span>
          </button>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, incidents: !p.incidents }))}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayers.incidents
                ? 'bg-rose-50 text-rose-700 border border-rose-200 font-medium'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>SOS ({worldState.incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, resources: !p.resources }))}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayers.resources
                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Fleet ({worldState.resources.length})</span>
          </button>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, shelters: !p.shelters }))}
            className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeLayers.shelters
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            <span>Shelters ({worldState.shelters.length})</span>
          </button>
        </div>

        {/* Status Legend (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-[1000] p-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-lg text-xs space-y-1.5 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Status Legend
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" />
            <span>Passable Corridor</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
            <span>Disputed (Active Sensing)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
            <span>Impassable (Flooded)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Civilian SOS (Casualties)</span>
          </div>
        </div>

        {/* Non-Overlapping Simulation Watermark (Bottom Right, Above Leaflet Controls) */}
        <div className="absolute top-3 right-3 z-[1000] px-3 py-1 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-500 rounded-md text-[11px] font-mono shadow-xs hidden sm:block">
          SIMULATED KARACHI DELTA MODEL · NO REAL DISPATCH
        </div>
      </div>

      {/* Side Inspector Drawer (Docked Right, Clean Non-Overlapping Layout) */}
      {selectedItem && (
        <aside className="w-80 h-full bg-white border-l border-slate-200 p-5 overflow-y-auto shrink-0 z-[1001] shadow-md animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
              {selectedItem.type.toUpperCase()} DETAILS
            </span>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Incident Details */}
          {selectedItem.type === 'incident' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                  {(selectedItem.data as Incident).title}
                </h3>
                <div className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{(selectedItem.data as Incident).locationName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">CASUALTIES</div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {(selectedItem.data as Incident).peopleCount}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">TRIAGE URGENCY</div>
                  <div
                    className="text-base font-bold uppercase font-mono"
                    style={{ color: getUrgencyColor((selectedItem.data as Incident).urgency) }}
                  >
                    {(selectedItem.data as Incident).urgency}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">WATER DEPTH</div>
                  <div className="text-sm font-mono text-sky-700 font-semibold">
                    {(selectedItem.data as Incident).waterDepthCm} cm
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">VERIFICATION</div>
                  <div className="text-sm font-mono text-slate-700 capitalize font-medium">
                    {(selectedItem.data as Incident).verificationStatus}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-500 mb-1">FIELD NOTES</div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-slate-700 leading-relaxed">
                  {(selectedItem.data as Incident).notes || 'No additional field notes logged.'}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-500 mb-1">EVIDENCE AUDIT PROVENANCE</div>
                <div className="text-slate-600 font-mono text-[11px] space-y-1">
                  {(selectedItem.data as Incident).evidenceIds.map((eid) => (
                    <div key={eid} className="p-1.5 bg-slate-50 rounded border border-slate-200/60 flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-sky-600" />
                      <span>{eid}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Road Edge / Bridge Details */}
          {selectedItem.type === 'edge' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                  {(selectedItem.data as RoadEdge).name}
                </h3>
                <div className="text-slate-500">
                  {(selectedItem.data as RoadEdge).fromName} → {(selectedItem.data as RoadEdge).toName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">TRAVERSABILITY</div>
                  <div className="text-sm font-bold font-mono text-amber-700 uppercase">
                    {(selectedItem.data as RoadEdge).traversability}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">COLLAPSE PROBABILITY</div>
                  <div className="text-sm font-bold font-mono text-rose-600">
                    {Math.round((selectedItem.data as RoadEdge).collapseProbability * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">WATER LEVEL</div>
                  <div className="text-sm font-mono text-sky-700 font-semibold">
                    {(selectedItem.data as RoadEdge).waterDepthCm} cm
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">SAFE CLEARANCE</div>
                  <div className="text-sm font-mono text-slate-700">
                    {(selectedItem.data as RoadEdge).maxSafeDepthCm} cm
                  </div>
                </div>
              </div>

              {(selectedItem.data as RoadEdge).traversability === 'disputed' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Disputed Observation Conflict</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    Citizen claims of passable bridge contradict ultrasonic river flow gauge. Target for Active Sensing verification.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rescue Fleet Details */}
          {selectedItem.type === 'resource' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                  {(selectedItem.data as Resource).name}
                </h3>
                <div className="text-slate-500">{(selectedItem.data as Resource).locationName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">PASSENGER CAPACITY</div>
                  <div className="text-sm font-bold font-mono text-sky-700">
                    {(selectedItem.data as Resource).capacity} seats
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">WATER CLEARANCE</div>
                  <div className="text-sm font-mono text-slate-700">
                    {(selectedItem.data as Resource).maxWaterDepthCm} cm
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">FUEL LEVEL</div>
                  <div className="text-sm font-mono text-emerald-600 font-semibold">
                    {(selectedItem.data as Resource).fuelRemainingPct}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">MISSION STATUS</div>
                  <div className="text-sm font-mono text-slate-800 uppercase font-medium">
                    {(selectedItem.data as Resource).status}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shelter Details */}
          {selectedItem.type === 'shelter' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                  {(selectedItem.data as Shelter).name}
                </h3>
                <div className="text-slate-500">{(selectedItem.data as Shelter).locationName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">TOTAL CAPACITY</div>
                  <div className="text-sm font-bold font-mono text-indigo-700">
                    {(selectedItem.data as Shelter).capacity} beds
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">CURRENT OCCUPANCY</div>
                  <div className="text-sm font-mono text-slate-800 font-medium">
                    {(selectedItem.data as Shelter).currentOccupancy}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">SUPPLIES STATUS</div>
                  <div className="text-sm font-mono text-emerald-600 capitalize font-medium">
                    {(selectedItem.data as Shelter).suppliesStatus}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-medium">BOAT ACCESS</div>
                  <div className="text-sm font-mono text-slate-700">
                    {(selectedItem.data as Shelter).accessibleByBoat ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
};
