# CrisisTwin: Real Interactive Map Overhaul & UI Redesign

Transform the CrisisTwin spatial interface from an abstract vector diagram into a production-grade, interactive geographic map using **Leaflet** with real OpenStreetMap and Satellite raster tiles of Karachi, eliminating all control overlaps and rendering crystal-clear incident, bridge, and fleet overlays.

> [!IMPORTANT]
> **User Review & Confirmed Design Decisions**
> - **Real Interactive Basemap**: Confirmed **Interactive Leaflet map with real street and satellite tiles** (CartoDB / OpenStreetMap / Esri World Imagery toggle). Users will see actual Karachi roads, coastlines, landmarks, and terrain instead of bare SVG lines.
> - **Non-Overlapping Floating Controls**: Confirmed **Floating top controls with non-overlapping collapsible inspector**. Relocates the simulation disclaimer badge to a non-conflicting position, cleans up the layer control bar, and ensures the inspector drawer opens smoothly without obscuring map navigation.
> - **Preserved Functionality**: All existing multi-agent workflows (GeoAgent, WeatherAgent, Gemini 3.8 Flash grounding), counterfactual simulations, Value-of-Information (EVSI) active sensing, and decision certificates will be 100% preserved.

---

## 1. Overview & Core Concept

### Problem Being Solved
The current disaster map renders an abstract SVG coordinate canvas with diagonal vector lines on an empty white canvas. This lacks recognizable geographic features (streets, city blocks, coastlines, topography), confusing the operator. Additionally, floating badges collide on smaller viewports.

### The Solution
1. **Real Leaflet Basemap Integration**:
   - Embed high-performance Leaflet map centered at `[24.8607, 67.0011]` (Karachi).
   - Basemap toggle: **Clean Street View** (CartoDB Positron / OSM) and **Satellite Aerial View** (Esri World Imagery).
2. **Clear Geographic Overlays**:
   - Actual geographic road polylines along Karachi corridors (Lyari Expressway, Shahrah-e-Faisal, Malir River Causeway, Native Jetty).
   - Real flood inundation polygon contours with translucent blue styling.
   - Interactive SVG/HTML markers for SOS Incidents (with casualty count badges), Shelters, and Rescue Fleet (Boats, Trucks, Ambulance, Drone).
3. **Ergonomic, Non-Overlapping Layout**:
   - Clean floating top bar for layer toggles (Flood Zones, Roads, Incidents, Fleet, Shelters).
   - Fixed corner legend with clear visual indicators.
   - Smooth slide-out detail inspector that neatly docks on the right with a visible close button and no layout jitter.

---

## 2. User Experience & Visual Design

### Map Interface Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: CrisisTwin v1.2 · [Map] [Scenario] [Agents] [Planner] [PWA]  │
├────────────────────────────────────────────────────────────────────────┤
│ [Layers: Flood | Roads | SOS (8) | Fleet (5) | Shelters]  [Street|Sat] │
│ ┌─────────────────────────────────────────────────┐ ┌────────────────┐ │
│ │                                                 │ │ INCIDENT PANEL │ │
│ │  REAL LEAFLET BASEMAP (OpenStreetMap / Satellite│ │                │ │
│ │                                                 │ │ Title & Loc    │ │
│ │  • Real Karachi Coastline & Streets             │ │ Casualties: 18 │ │
│ │  • Lyari & Malir River Channels                 │ │ Urgency: CRIT  │ │
│ │  • Colored Road Edges (Passable/Disputed/Flooded│ │ Water: 45 cm   │ │
│ │  • Interactive Pulsing SOS Markers              │ │ Provenance IDs │ │
│ │  • Live Rescue Boats & Trucks                   │ │                │ │
│ │                                                 │ │ [Close Drawer] │ │
│ └─────────────────────────────────────────────────┘ └────────────────┘ │
│ [Status Legend]                         [Simulated Karachi Delta Badge]│
└────────────────────────────────────────────────────────────────────────┘
```

- **Aesthetic Direction**: Modern Apple/Vercel light theme with subtle borders (`#E2E8F0`), high-contrast dark text (`#0F172A`), and clear semantic colors.
- **Color Discipline**:
  - Street Basemap: Clean, low-contrast grayscale/subtle CartoDB Positron tiles so emergency markers pop.
  - Flood Inundation: Pale translucent azure `rgba(14, 165, 233, 0.25)` with distinct boundary strokes.
  - Passable Roads: Emerald `#10B981` (solid).
  - Disputed / Active Sensing Bridges: Amber `#F59E0B` (pulsing dashed).
  - Impassable Corridors: Rose `#EF4444` (bold red dashed).
  - SOS Markers: Vibrant crimson `#EF4444`, amber `#F59E0B`, sky-blue `#0EA5E9` with casualty count numerals.

---

## 3. Key Technical Decisions & Dependencies

### Decision 1: Leaflet via React vs. Raw SVG
- **Chosen Approach**: `leaflet` and `react-leaflet` (or direct lightweight Leaflet DOM initialization with smooth cleanup).
- **Why**: Leaflet handles zoom, pan, tile loading, spherical Mercator coordinate projection, and smooth layer management natively with zero boilerplate.
- **Basemaps**:
  - Street / Light: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
  - Satellite Aerial: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

### Decision 2: Elimination of UI Element Collisions
- **Chosen Approach**:
  - Layer controls placed in a single compact floating bar with `z-20` on the top-left.
  - Basemap toggle (Street / Satellite) neatly integrated into the layer bar.
  - Simulation badge moved to the bottom right above status legend, completely decoupled from top navigation.
  - Inspector drawer rendered as a docked right panel with fixed width and smooth open/close toggle.

---

## 4. Implementation Steps (Post-Approval)

1. **Install Dependencies**: Install `leaflet` and `@types/leaflet`.
2. **Include Leaflet CSS**: Add `leaflet/dist/leaflet.css` in `index.html` or `src/index.css`.
3. **Rebuild `DisasterMap.tsx`**:
   - Initialize Leaflet map centered at Karachi `[24.8607, 67.0011]`.
   - Add TileLayers with Street/Satellite toggle.
   - Render flood polygons using GeoJSON / Leaflet polygons.
   - Render road edges using Leaflet `Polyline` with dynamic color matching traversability status.
   - Render incident markers using custom Leaflet `DivIcon` with casualty count badges and click handlers.
   - Render rescue vehicles and shelters with crisp icons.
   - Mount non-overlapping side drawer and bottom status bar.
4. **Verify & Test**:
   - Run `compile_applet` and verify zero TypeScript/build errors.
   - Test zooming, panning, layer toggling, clicking incidents/bridges, and inspecting active sensing items.
