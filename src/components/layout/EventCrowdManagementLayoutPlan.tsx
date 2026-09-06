import React, { useState, useMemo } from 'react';
import { 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders, 
  Layers, 
  Flame, 
  Shield, 
  Cpu, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  Sparkles,
  Info,
  X,
  Footprints,
  Eye,
  Radio,
  DoorOpen
} from 'lucide-react';

export interface EventCrowdManagementLayoutPlanProps {
  areaSqFt?: number;
  onAreaChange?: (sqFt: number) => void;
  venueName?: string;
  eventName?: string;
  expectedCrowd?: number;
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
}

export const EventCrowdManagementLayoutPlan: React.FC<EventCrowdManagementLayoutPlanProps> = ({
  areaSqFt: externalAreaSqFt,
  onAreaChange,
  venueName = 'Festival Grounds & Arena',
  eventName = 'Grand Music & Cultural Concourse',
  expectedCrowd: externalExpectedCrowd,
  isSimulating: externalIsSimulating,
  onToggleSimulate,
}) => {
  // Local state for internal / standalone usage or when not controlled from outside
  const [internalAreaSqFt, setInternalAreaSqFt] = useState<number>(75000);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer toggles
  const [showFacilities, setShowFacilities] = useState<boolean>(true);
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showPathways, setShowPathways] = useState<boolean>(true);
  const [showDensityHeatmap, setShowDensityHeatmap] = useState<boolean>(false);
  const [showEmergencyEvac, setShowEmergencyEvac] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<any | null>(null);

  // Active area value
  const currentAreaSqFt = externalAreaSqFt ?? internalAreaSqFt;
  const updateArea = (val: number) => {
    const clamped = Math.max(5000, Math.min(250000, val));
    if (onAreaChange) {
      onAreaChange(clamped);
    } else {
      setInternalAreaSqFt(clamped);
    }
  };

  // Safe crowd density standard: 4.5 sq.ft / person
  const safeCapacity = Math.floor(currentAreaSqFt / 4.5);
  const currentCrowd = externalExpectedCrowd ?? Math.round(safeCapacity * 0.72);

  // Calculate dynamic scaling tiers based on square footage:
  // Scale factor normalized around 75,000 sq ft baseline
  const scaleRatio = useMemo(() => {
    return Math.sqrt(currentAreaSqFt / 75000);
  }, [currentAreaSqFt]);

  // Dynamic facility counts based on area
  const layoutSpecs = useMemo(() => {
    // Stage Barricades rings (2 to 5)
    let stageBarricadeRings = 2;
    if (currentAreaSqFt > 120000) stageBarricadeRings = 5;
    else if (currentAreaSqFt > 70000) stageBarricadeRings = 4;
    else if (currentAreaSqFt > 25000) stageBarricadeRings = 3;

    // Entrance queue lanes (2 to 6)
    let entranceLanes = 2;
    if (currentAreaSqFt > 120000) entranceLanes = 6;
    else if (currentAreaSqFt > 70000) entranceLanes = 4;
    else if (currentAreaSqFt > 30000) entranceLanes = 3;

    // Restroom banks & units
    let restroomBanks = 1;
    let totalRestrooms = 8;
    if (currentAreaSqFt > 100000) {
      restroomBanks = 3;
      totalRestrooms = 28;
    } else if (currentAreaSqFt > 35000) {
      restroomBanks = 2;
      totalRestrooms = 16;
    }

    // Emergency exits (2 to 6)
    let emergencyExits = 2;
    if (currentAreaSqFt > 120000) emergencyExits = 6;
    else if (currentAreaSqFt > 60000) emergencyExits = 4;
    else if (currentAreaSqFt > 25000) emergencyExits = 3;

    // Food & Beverage pavilions (2 to 6)
    let foodPavilions = 2;
    if (currentAreaSqFt > 100000) foodPavilions = 6;
    else if (currentAreaSqFt > 40000) foodPavilions = 4;

    // First aid stations (1 or 2)
    const firstAidStations = currentAreaSqFt > 40000 ? 2 : 1;

    // IoT Sensors count
    const sensorCount = Math.min(32, Math.max(6, Math.round(12 * scaleRatio)));

    return {
      stageBarricadeRings,
      entranceLanes,
      restroomBanks,
      totalRestrooms,
      emergencyExits,
      foodPavilions,
      firstAidStations,
      sensorCount,
      evacTimeMinutes: Math.max(3.2, Math.min(12, Number((currentCrowd / (emergencyExits * 650)).toFixed(1)))),
    };
  }, [currentAreaSqFt, scaleRatio, currentCrowd]);

  // Preset sizes
  const presets = [
    { label: 'Plaza / Club', area: 10000, desc: '~2.2k Cap' },
    { label: 'Arena Grounds', area: 35000, desc: '~7.8k Cap' },
    { label: 'Stadium Concourse', area: 75000, desc: '~16.5k Cap' },
    { label: 'Mega Festival', area: 150000, desc: '~33k Cap' },
  ];

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (Matching reference title style) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 border-b border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-widest text-white uppercase text-center sm:text-left drop-shadow-md">
            EVENT CROWD MANAGEMENT LAYOUT PLAN
          </h2>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300 font-medium justify-center sm:justify-start">
            <span className="text-blue-400 font-bold">{venueName}</span>
            <span>•</span>
            <span className="text-slate-400">{eventName}</span>
          </div>
        </div>

        {/* Real-time calculated Area & Capacity pill */}
        <div className="flex items-center justify-center sm:justify-end gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2 text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white">{currentAreaSqFt.toLocaleString()} sq.ft</span>
            <span className="text-slate-400">({Math.round(currentAreaSqFt / 10.7639).toLocaleString()} m²)</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-700/60 text-blue-200 font-bold">
            Max Cap: <span className="text-white font-extrabold">{safeCapacity.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC CONTROLS TOOLBAR (Square Footage Slider + Presets + Layers) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Quick Area Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px] hidden sm:inline">
            Area Presets:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.area}
              onClick={() => updateArea(preset.area)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                Math.abs(currentAreaSqFt - preset.area) < 4000
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {preset.label} <span className="opacity-70 text-[10px]">({preset.desc})</span>
            </button>
          ))}
        </div>

        {/* Continuous Square Feet Slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-bold text-slate-300">Size:</span>
            <input
              type="range"
              min="5000"
              max="200000"
              step="2500"
              value={currentAreaSqFt}
              onChange={(e) => updateArea(parseInt(e.target.value))}
              className="w-24 sm:w-32 accent-blue-500 cursor-pointer"
            />
            <span className="text-[11px] font-mono font-black text-blue-300 min-w-[4rem] text-right">
              {Math.round(currentAreaSqFt / 1000)}k ft²
            </span>
          </div>

          {/* View controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700 p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.65, z - 0.15))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer Visibility Pills */}
      <div className="bg-slate-900/50 px-4 sm:px-6 py-2 border-b border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1">
            Display Layers:
          </span>

          <button
            onClick={() => setShowFacilities(!showFacilities)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              showFacilities
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800/40 text-slate-500 border-slate-700'
            }`}
          >
            🏛️ Facilities
          </button>

          <button
            onClick={() => setShowPathways(!showPathways)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              showPathways
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/40 text-slate-500 border-slate-700'
            }`}
          >
            🚶 Concourse Paths
          </button>

          <button
            onClick={() => setShowSensors(!showSensors)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              showSensors
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-800/40 text-slate-500 border-slate-700'
            }`}
          >
            📡 IoT LiDAR & Radar
          </button>

          <button
            onClick={() => setShowDensityHeatmap(!showDensityHeatmap)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              showDensityHeatmap
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/40 text-slate-500 border-slate-700'
            }`}
          >
            🔥 Density Heatmap
          </button>

          <button
            onClick={() => setShowEmergencyEvac(!showEmergencyEvac)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              showEmergencyEvac
                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                : 'bg-slate-800/40 text-slate-500 border-slate-700'
            }`}
          >
            🚨 Evac Routes
          </button>
        </div>

        {/* Evacuation Estimate */}
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>NFPA Evac Window:</span>
          <span className="font-bold text-emerald-400">{layoutSpecs.evacTimeMinutes} mins</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN INTERACTIVE ISOMETRIC VENUE CANVAS */}
      {/* ========================================================================= */}
      <div 
        className="relative w-full h-[620px] bg-[#16221c] overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Night atmosphere backdrop with subtle ambient light gradients */}
        <div className="absolute inset-0 bg-radial from-slate-900/40 via-[#101a14] to-[#0a100c] pointer-events-none" />

        {/* Pan and Zoom container */}
        <div
          className="w-full h-full transition-transform duration-100 ease-out origin-center flex items-center justify-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {/* High-Resolution SVG Architectural Isometric Layout Diagram */}
          <svg
            viewBox="0 0 1200 780"
            className="w-full h-full max-w-[1280px] max-h-[820px] drop-shadow-2xl overflow-visible"
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="groundGrass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e3428" />
                <stop offset="50%" stopColor="#223d2f" />
                <stop offset="100%" stopColor="#182d22" />
              </linearGradient>

              <linearGradient id="roadAsphalt" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3c4a52" />
                <stop offset="50%" stopColor="#4a5a63" />
                <stop offset="100%" stopColor="#3c4a52" />
              </linearGradient>

              <linearGradient id="stageRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              <radialGradient id="spotlightCone" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#facc15" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="exitGreenGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
              </radialGradient>

              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* ------------------------------------------------------------- */}
            {/* A. VENUE GROUND SURFACE (Bounded Grass Lawn) */}
            {/* ------------------------------------------------------------- */}
            {/* Outer buffer area */}
            <polygon
              points="120,440 680,120 1140,280 580,720"
              fill="url(#groundGrass)"
              stroke="#13231a"
              strokeWidth="4"
            />

            {/* Perimeter Security Fence - Dynamic boundary adjusting to square feet */}
            <polygon
              points="140,430 670,135 1120,290 590,700"
              fill="none"
              stroke="#64748b"
              strokeWidth="3.5"
              strokeDasharray="8 4"
            />
            {/* Fence corner and side posts */}
            <circle cx="140" cy="430" r="5" fill="#94a3b8" />
            <circle cx="670" cy="135" r="5" fill="#94a3b8" />
            <circle cx="1120" cy="290" r="5" fill="#94a3b8" />
            <circle cx="590" cy="700" r="5" fill="#94a3b8" />
            <circle cx="405" cy="282" r="4" fill="#94a3b8" />
            <circle cx="895" cy="212" r="4" fill="#94a3b8" />
            <circle cx="365" cy="565" r="4" fill="#94a3b8" />
            <circle cx="855" cy="495" r="4" fill="#94a3b8" />

            {/* Floodlight cones on perimeter poles */}
            <ellipse cx="365" cy="565" rx="55" ry="32" fill="url(#spotlightCone)" />
            <ellipse cx="610" cy="380" rx="75" ry="40" fill="url(#spotlightCone)" />
            <ellipse cx="855" cy="495" rx="55" ry="32" fill="url(#spotlightCone)" />
            <ellipse cx="405" cy="282" rx="60" ry="35" fill="url(#spotlightCone)" />

            {/* ------------------------------------------------------------- */}
            {/* B. PEDESTRIAN CONCOURSE PATHWAY SYSTEM (Asphalt Thoroughfares) */}
            {/* ------------------------------------------------------------- */}
            {showPathways && (
              <g id="pathways" className="transition-opacity duration-300">
                {/* 1. Main Entrance Roadway (bottom left leading into grounds) */}
                <polygon
                  points="20,590 190,490 270,540 80,660"
                  fill="url(#roadAsphalt)"
                  stroke="#2d3748"
                  strokeWidth="2"
                />

                {/* Entrance directional road markings */}
                <g fill="#f8fafc" opacity="0.8">
                  <path d="M 60 610 L 95 590 L 90 584 L 115 586 L 105 608 L 98 602 L 67 620 Z" />
                  <path d="M 120 570 L 155 550 L 150 544 L 175 546 L 165 568 L 158 562 L 127 580 Z" />
                </g>

                {/* 2. Central Concourse: Entrance to Central Plaza */}
                <polygon
                  points="220,510 490,390 560,430 280,555"
                  fill="url(#roadAsphalt)"
                  stroke="#2d3748"
                  strokeWidth="2"
                />

                {/* 3. Central Plaza to Main Stage Spine */}
                <polygon
                  points="470,400 680,260 760,290 550,435"
                  fill="url(#roadAsphalt)"
                  stroke="#2d3748"
                  strokeWidth="2"
                />

                {/* 4. Left Concourse: to Restrooms and Top-Left Emergency Exit */}
                <polygon
                  points="460,395 310,320 370,290 510,365"
                  fill="url(#roadAsphalt)"
                  stroke="#2d3748"
                  strokeWidth="2"
                />

                {/* 5. Right Concourse: to Restrooms, Food Area & Right Exits */}
                <polygon
                  points="550,430 890,520 860,560 520,470"
                  fill="url(#roadAsphalt)"
                  stroke="#2d3748"
                  strokeWidth="2"
                />

                {/* 6. Perimeter Egress Corridors to Emergency Exits */}
                <polygon
                  points="750,285 1060,315 1040,345 740,315"
                  fill="url(#roadAsphalt)"
                  stroke="#2d3748"
                  strokeWidth="1.5"
                />
                <polygon
                  points="780,530 1020,620 980,660 750,570"
                  fill="url(#roadAsphalt)"
                  stroke="#2d3748"
                  strokeWidth="2"
                />

                {/* Flow arrows on pathways */}
                <g stroke="#93c5fd" strokeWidth="2.5" strokeDasharray="6 4" fill="none" opacity="0.6">
                  <line x1="160" y1="540" x2="380" y2="445" />
                  <line x1="520" y1="410" x2="690" y2="295" />
                  <line x1="560" y1="450" x2="820" y2="520" />
                </g>
              </g>
            )}

            {/* ------------------------------------------------------------- */}
            {/* C. ENTRANCE & SECURITY CHECKPOINT COMPLEX (Bottom Left) */}
            {/* ------------------------------------------------------------- */}
            <g 
              id="entrance-complex"
              className="cursor-pointer group"
              onClick={() => setSelectedElement({
                title: 'Main Ingress Checkpoint & Queuing Plaza',
                type: 'Entrance',
                capacity: Math.round(currentCrowd * 0.4),
                density: 'Safe Flow • 2.8 ft²/person',
                details: `${layoutSpecs.entranceLanes} Parallel Security Inspection Corridors equipped with millimeter-wave metal detectors and automated RFID ticket turnstiles.`,
                sensors: 'ESP32-CAM-01 (Inflow LiDAR), Beam-Break Sensor A1'
              })}
            >
              {/* Security Inspection Cabins / Booths */}
              <g transform="translate(210, 470)">
                <polygon points="0,20 28,5 48,15 20,30" fill="#78350f" />
                <polygon points="0,20 20,30 20,48 0,38" fill="#451a03" />
                <polygon points="20,30 48,15 48,33 20,48" fill="#b45309" />
                <circle cx="24" cy="18" r="3" fill="#fef08a" />
              </g>

              <g transform="translate(245, 490)">
                <polygon points="0,20 28,5 48,15 20,30" fill="#78350f" />
                <polygon points="0,20 20,30 20,48 0,38" fill="#451a03" />
                <polygon points="20,30 48,15 48,33 20,48" fill="#b45309" />
                <circle cx="24" cy="18" r="3" fill="#fef08a" />
              </g>

              {/* Serpentine Zig-Zag Queue Barricades (Stanchions) */}
              {Array.from({ length: layoutSpecs.entranceLanes }).map((_, i) => (
                <path
                  key={i}
                  d={`M ${120 + i * 14} ${560 - i * 6} 
                      L ${160 + i * 14} ${540 - i * 6} 
                      L ${190 + i * 14} ${555 - i * 6} 
                      L ${230 + i * 14} ${535 - i * 6}`}
                  stroke="#cbd5e1"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              ))}

              {/* Entrance Floating Label Badge */}
              <g transform="translate(110, 480)">
                <rect x="0" y="0" width="85" height="22" rx="5" fill="#0f766e" stroke="#14b8a6" strokeWidth="1.5" />
                <text x="42" y="15" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="1">
                  ENTRANCE
                </text>
              </g>

              {/* Road white arrow: ENTRANCE */}
              <g transform="translate(80, 640)">
                <text x="0" y="0" fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="2" opacity="0.85">
                  ENTRANCE ➜
                </text>
              </g>
            </g>

            {/* ------------------------------------------------------------- */}
            {/* D. MAIN STAGE & CONCENTRIC BARRICADE VIEWING PENS (Top Rear) */}
            {/* ------------------------------------------------------------- */}
            <g 
              id="main-stage-complex"
              className="cursor-pointer group"
              onClick={() => setSelectedElement({
                title: 'Main Concert Stage & Tiered Barricades',
                type: 'Main Stage',
                capacity: Math.round(currentCrowd * 0.55),
                density: 'Dynamic Viewing Pit • 3.2 ft²/person',
                details: `Elevated roofed festival stage equipped with line-array sound towers and ${layoutSpecs.stageBarricadeRings} tiered curved crowd control barricades to compartmentalize surges and eliminate front-of-stage crowd crush.`,
                sensors: 'ESP32-STAGE-LIDAR, Front Pit Pressure Mat, Thermal Density Sensor'
              })}
            >
              {/* Elevated Stage Structure (Top center) */}
              <g transform="translate(620, 100)">
                <polygon points="40,110 140,65 240,110 140,155" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <polygon points="40,110 140,155 140,175 40,130" fill="#0f172a" />
                <polygon points="140,155 240,110 240,130 140,175" fill="#334155" />

                <polygon points="40,65 140,20 240,65 140,110" fill="url(#stageRoofGrad)" stroke="#64748b" strokeWidth="2" />
                <line x1="45" y1="68" x2="45" y2="110" stroke="#94a3b8" strokeWidth="4" />
                <line x1="235" y1="68" x2="235" y2="110" stroke="#94a3b8" strokeWidth="4" />
                <line x1="140" y1="110" x2="140" y2="155" stroke="#94a3b8" strokeWidth="4" />

                <polygon points="70,75 140,45 210,75 140,105" fill="#3b82f6" opacity="0.85" filter="url(#glowEffect)" />

                <rect x="25" y="60" width="14" height="40" fill="#020617" stroke="#475569" strokeWidth="1" />
                <rect x="241" y="60" width="14" height="40" fill="#020617" stroke="#475569" strokeWidth="1" />

                <circle cx="100" cy="80" r="16" fill="#38bdf8" opacity="0.6" filter="url(#glowEffect)" />
                <circle cx="140" cy="70" r="18" fill="#a855f7" opacity="0.7" filter="url(#glowEffect)" />
                <circle cx="180" cy="80" r="16" fill="#ec4899" opacity="0.6" filter="url(#glowEffect)" />
              </g>

              {/* Concentric Curved Crowd Control Barricades (Tiered Viewing Pens) */}
              {Array.from({ length: layoutSpecs.stageBarricadeRings }).map((_, rIdx) => {
                const radiusX = 110 + rIdx * 45 * scaleRatio;
                const radiusY = 55 + rIdx * 25 * scaleRatio;
                const centerY = 245 + rIdx * 16;
                const centerX = 760;

                return (
                  <g key={rIdx}>
                    <path
                      d={`M ${centerX - radiusX * 0.95} ${centerY + radiusY * 0.3} 
                          Q ${centerX - radiusX * 0.4} ${centerY + radiusY * 0.95} ${centerX} ${centerY + radiusY}
                          Q ${centerX + radiusX * 0.4} ${centerY + radiusY * 0.95} ${centerX + radiusX * 0.95} ${centerY + radiusY * 0.3}`}
                      stroke="#94a3b8"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      fill="none"
                    />
                    <circle cx={centerX} cy={centerY + radiusY} r="3" fill="#38bdf8" />
                  </g>
                );
              })}

              {/* Floating Badge: MAIN STAGE */}
              <g transform="translate(540, 140)">
                <rect x="0" y="0" width="105" height="24" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="52" y="16" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="1">
                  MAIN STAGE ⬆
                </text>
              </g>
            </g>

            {/* ------------------------------------------------------------- */}
            {/* E. FIRST AID MEDICAL EMERGENCY STATIONS (Center Plaza & Lawn) */}
            {/* ------------------------------------------------------------- */}
            {showFacilities && (
              <g 
                id="first-aid-complex"
                className="cursor-pointer group"
                onClick={() => setSelectedElement({
                  title: 'Primary Emergency Medical & Triage Station',
                  type: 'First Aid',
                  capacity: 'Triage Center • 12 Trauma Bays',
                  density: 'Emergency Response Hub',
                  details: 'Staffed field medical center with automated external defibrillators (AED), oxygen reserve, and direct ambulance egress channel.',
                  sensors: 'LiDAR Rapid Egress Node, IoT Cold Chain Vaccine & Supply Monitor'
                })}
              >
                {/* 1. Primary Central First Aid Tent */}
                <g transform="translate(480, 370)">
                  <polygon points="0,30 35,10 70,30 35,50" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                  <polygon points="0,30 35,50 35,75 0,55" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
                  <polygon points="35,50 70,30 70,55 35,75" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />

                  <path
                    d="M 31 23 H 39 V 37 H 31 Z M 24 27 H 46 V 33 H 24 Z"
                    fill="#dc2626"
                  />
                  <path
                    d="M 15 42 H 21 V 54 H 15 Z M 10 46 H 26 V 50 H 10 Z"
                    fill="#dc2626"
                  />
                </g>

                <g transform="translate(470, 350)">
                  <rect x="0" y="0" width="85" height="22" rx="5" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
                  <text x="42" y="15" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="1">
                    FIRST AID ✚
                  </text>
                </g>

                {/* 2. Secondary First Aid Station (Lower sector) */}
                {layoutSpecs.firstAidStations > 1 && (
                  <g 
                    transform="translate(560, 580)"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement({
                        title: 'Secondary Field Medical Post (South Lawn)',
                        type: 'First Aid',
                        capacity: 'Rapid Triage • 4 Responders',
                        density: 'South Concourse Support',
                        details: 'Mobile medical outpost supporting the south exit corridor and lawn crowd.',
                        sensors: 'ESP32 South Sector Health Node'
                      });
                    }}
                  >
                    <polygon points="0,20 25,8 50,20 25,32" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                    <polygon points="0,20 25,32 25,48 0,36" fill="#e2e8f0" />
                    <polygon points="25,32 50,20 50,36 25,48" fill="#cbd5e1" />
                    <path d="M 23 16 H 27 V 24 H 23 Z M 19 19 H 31 V 21 H 19 Z" fill="#dc2626" />
                    
                    <g transform="translate(-10, -22)">
                      <rect x="0" y="0" width="80" height="20" rx="4" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.2" />
                      <text x="40" y="14" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                        FIRST AID
                      </text>
                    </g>
                  </g>
                )}
              </g>
            )}

            {/* ------------------------------------------------------------- */}
            {/* F. RESTROOMS SANITATION BLOCKS (Top Left & Mid Right) */}
            {/* ------------------------------------------------------------- */}
            {showFacilities && (
              <g id="restroom-complex">
                {/* Bank 1: Top Left Restrooms */}
                <g 
                  transform="translate(180, 290)"
                  className="cursor-pointer group"
                  onClick={() => setSelectedElement({
                    title: 'West Concourse Sanitation Facilities',
                    type: 'Restrooms',
                    capacity: `${Math.round(layoutSpecs.totalRestrooms * 0.55)} Sanitation Units`,
                    density: 'Accessible ADA compliant blocks',
                    details: 'Heavy-duty portable sanitation trailers with continuous fresh water circulation, handwashing sinks, and gray water containment.',
                    sensors: 'ESP32-RESTROOM-WEST Door Counter'
                  })}
                >
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <g key={idx} transform={`translate(${idx * 16}, ${idx * 9})`}>
                      <polygon points="0,15 12,8 24,15 12,22" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                      <polygon points="0,15 12,22 12,42 0,35" fill="#1e40af" />
                      <polygon points="12,22 24,15 24,35 12,42" fill="#2563eb" />
                    </g>
                  ))}

                  <g transform="translate(-10, -22)">
                    <rect x="0" y="0" width="95" height="22" rx="5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                    <text x="47" y="15" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="1">
                      RESTROOMS 🚻
                    </text>
                  </g>
                </g>

                {/* Bank 2: Mid Right Restrooms */}
                {layoutSpecs.restroomBanks >= 2 && (
                  <g 
                    transform="translate(820, 480)"
                    className="cursor-pointer group"
                    onClick={() => setSelectedElement({
                      title: 'East Promenade Sanitation Facilities',
                      type: 'Restrooms',
                      capacity: `${Math.round(layoutSpecs.totalRestrooms * 0.45)} Sanitation Units`,
                      density: 'Sanitation Core',
                      details: 'East cluster serving the main dining village and east perimeter egress.',
                      sensors: 'ESP32-RESTROOM-EAST Door Counter'
                    })}
                  >
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <g key={idx} transform={`translate(${idx * 16}, ${idx * 9})`}>
                        <polygon points="0,15 12,8 24,15 12,22" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                        <polygon points="0,15 12,22 12,42 0,35" fill="#1e40af" />
                        <polygon points="12,22 24,15 24,35 12,42" fill="#2563eb" />
                      </g>
                    ))}

                    <g transform="translate(-10, -22)">
                      <rect x="0" y="0" width="95" height="22" rx="5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                      <text x="47" y="15" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="1">
                        RESTROOMS 🚻
                      </text>
                    </g>
                  </g>
                )}
              </g>
            )}

            {/* ------------------------------------------------------------- */}
            {/* G. FOOD & BEVERAGE VILLAGE & PICNIC TABLES (Along Central Road) */}
            {/* ------------------------------------------------------------- */}
            {showFacilities && (
              <g 
                id="food-beverage-complex"
                className="cursor-pointer group"
                onClick={() => setSelectedElement({
                  title: 'Food & Beverage Village & Dining Plaza',
                  type: 'Food & Beverage',
                  capacity: `${layoutSpecs.foodPavilions * 250} Servings/Hr Throughput`,
                  density: 'Refreshment Hub',
                  details: 'Artisan food shacks, licensed beverage stalls, hydration water refilling stations, and outdoor communal picnic benches.',
                  sensors: 'Queue Depth Camera Q1, Concourse Flow Radar'
                })}
              >
                {/* Stall 1 (Left Plaza) */}
                <g transform="translate(340, 430)">
                  <polygon points="0,18 25,6 50,18 25,30" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                  <polygon points="0,18 25,30 25,48 0,36" fill="#78350f" />
                  <polygon points="25,30 50,18 50,36 25,48" fill="#92400e" />
                </g>

                {/* Stall 2 (Center Plaza) */}
                <g transform="translate(390, 460)">
                  <polygon points="0,18 25,6 50,18 25,30" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                  <polygon points="0,18 25,30 25,48 0,36" fill="#78350f" />
                  <polygon points="25,30 50,18 50,36 25,48" fill="#92400e" />
                </g>

                {/* Stall 3 & 4 (East Promenade) */}
                {layoutSpecs.foodPavilions >= 4 && (
                  <>
                    <g transform="translate(630, 450)">
                      <polygon points="0,18 28,6 56,18 28,30" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                      <polygon points="0,18 28,30 28,48 0,36" fill="#78350f" />
                      <polygon points="28,30 56,18 56,36 28,48" fill="#92400e" />
                    </g>
                    <g transform="translate(710, 485)">
                      <polygon points="0,18 28,6 56,18 28,30" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                      <polygon points="0,18 28,30 28,48 0,36" fill="#78350f" />
                      <polygon points="28,30 56,18 56,36 28,48" fill="#92400e" />
                    </g>
                  </>
                )}

                {/* Picnic Dining Tables */}
                {Array.from({ length: 4 }).map((_, pIdx) => (
                  <g key={pIdx} transform={`translate(${640 + pIdx * 25}, ${510 + pIdx * 12})`}>
                    <polygon points="0,6 16,0 32,6 16,12" fill="#a16207" />
                    <polygon points="0,6 16,12 16,16 0,10" fill="#713f12" />
                    <polygon points="16,12 32,6 32,10 16,16" fill="#854d0e" />
                  </g>
                ))}

                <path d="M 350 430 Q 520 460 740 480" stroke="#fde047" strokeWidth="1.2" strokeDasharray="8 6" fill="none" opacity="0.8" />

                <g transform="translate(615, 435)">
                  <rect x="0" y="0" width="130" height="22" rx="5" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
                  <text x="65" y="15" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="0.8">
                    FOOD & BEVERAGE 🍔
                  </text>
                </g>
              </g>
            )}

            {/* ------------------------------------------------------------- */}
            {/* H. EMERGENCY EXITS & STANDARD EXITS (Perimeter Gates) */}
            {/* ------------------------------------------------------------- */}
            <g id="emergency-exits">
              {/* 1. Top-Left Emergency Exit */}
              <g 
                transform="translate(70, 350)"
                className="cursor-pointer group"
                onClick={() => setSelectedElement({
                  title: 'North-West Emergency Egress Gate',
                  type: 'Emergency Exit',
                  capacity: '1,400 Persons / Minute',
                  density: 'Panic-Free Rapid Egress',
                  details: 'Illuminated panic-bar double outward release doors with high-intensity LED running man beacon and direct access to outer ring road.',
                  sensors: 'LiDAR Evacuation Flow Sensor NW-1'
                })}
              >
                <circle cx="28" cy="20" r="30" fill="url(#exitGreenGlow)" filter="url(#glowEffect)" />
                <rect x="0" y="0" width="56" height="34" rx="6" fill="#15803d" stroke="#4ade80" strokeWidth="2" />
                <text x="28" y="21" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
                  EXIT 🏃
                </text>

                <g transform="translate(-25, -24)">
                  <rect x="0" y="0" width="115" height="22" rx="5" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
                  <text x="57" y="15" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">
                    EMERGENCY EXIT
                  </text>
                </g>

                <path d="M 0 50 L -40 70 M -40 70 L -30 60 M -40 70 L -40 82" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
              </g>

              {/* 2. Top-Right Emergency Exit */}
              <g 
                transform="translate(1060, 270)"
                className="cursor-pointer group"
                onClick={() => setSelectedElement({
                  title: 'North-East Perimeter Emergency Exit',
                  type: 'Emergency Exit',
                  capacity: '1,600 Persons / Minute',
                  density: 'Backstage & East Pen Evac Route',
                  details: 'Primary emergency evacuation path for front-of-stage crowd pens.',
                  sensors: 'LiDAR Evacuation Flow Sensor NE-1'
                })}
              >
                <circle cx="28" cy="20" r="30" fill="url(#exitGreenGlow)" filter="url(#glowEffect)" />
                <rect x="0" y="0" width="56" height="34" rx="6" fill="#15803d" stroke="#4ade80" strokeWidth="2" />
                <text x="28" y="21" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
                  EXIT 🏃
                </text>

                <g transform="translate(-25, -24)">
                  <rect x="0" y="0" width="115" height="22" rx="5" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
                  <text x="57" y="15" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">
                    EMERGENCY EXIT
                  </text>
                </g>

                <path d="M 60 20 L 100 0 M 100 0 L 88 0 M 100 0 L 100 12" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
              </g>

              {/* 3. Mid-Right Standard & Emergency Exit */}
              <g 
                transform="translate(900, 480)"
                className="cursor-pointer group"
                onClick={() => setSelectedElement({
                  title: 'East Concourse Main Exit & Egress Boulevard',
                  type: 'Exit',
                  capacity: '2,200 Persons / Minute',
                  density: 'Standard & Evacuation Concourse',
                  details: 'Standard outbound gate with turnstile bypass gates and guard cabin.',
                  sensors: 'Outflow ESP32-GATE-E2'
                })}
              >
                <rect x="0" y="0" width="45" height="26" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                <text x="22" y="17" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
                  EXIT
                </text>

                <g transform="translate(45, 60)">
                  <rect x="0" y="0" width="52" height="30" rx="5" fill="#15803d" stroke="#4ade80" strokeWidth="2" />
                  <text x="26" y="19" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
                    EXIT 🏃
                  </text>
                  <g transform="translate(-30, -22)">
                    <rect x="0" y="0" width="110" height="20" rx="4" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
                    <text x="55" y="14" fill="#ffffff" fontSize="9.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8">
                      EMERGENCY EXIT
                    </text>
                  </g>
                </g>
              </g>

              {/* 4. Bottom-Right Main Exit Boulevard */}
              <g 
                transform="translate(710, 710)"
                className="cursor-pointer group"
                onClick={() => setSelectedElement({
                  title: 'South-East Main Dispersal Boulevard',
                  type: 'Exit',
                  capacity: '3,000 Persons / Minute',
                  density: 'Primary Outflow Axis',
                  details: 'Wide 32-ft pedestrian boulevard leading to transit shuttle bus bays and subway terminal.',
                  sensors: 'Radar Concourse Sensor S1'
                })}
              >
                <text x="0" y="0" fill="#ffffff" fontSize="14" fontWeight="900" letterSpacing="2" opacity="0.9">
                  EXIT ➜
                </text>

                <g transform="translate(-140, -100)">
                  <polygon points="0,15 20,5 40,15 20,25" fill="#475569" />
                  <polygon points="0,15 20,25 20,45 0,35" fill="#1e293b" />
                  <polygon points="20,25 40,15 40,35 20,45" fill="#334155" />
                </g>
              </g>
            </g>

            {/* ------------------------------------------------------------- */}
            {/* I. IoT SENSOR NODES (LiDAR, mmWave, People Counters) */}
            {/* ------------------------------------------------------------- */}
            {showSensors && (
              <g id="iot-sensors" className="transition-opacity duration-300">
                {[
                  { id: 'SN-01', x: 230, y: 520, name: 'Entrance Influx LiDAR' },
                  { id: 'SN-02', x: 420, y: 440, name: 'West Concourse Radar' },
                  { id: 'SN-03', x: 530, y: 410, name: 'Plaza Intersection LiDAR' },
                  { id: 'SN-04', x: 740, y: 260, name: 'Stage Front Pit Sensor' },
                  { id: 'SN-05', x: 670, y: 230, name: 'VIP Pen Density Node' },
                  { id: 'SN-06', x: 780, y: 510, name: 'Food Plaza Flow Sensor' },
                  { id: 'SN-07', x: 860, y: 460, name: 'East Corridors Node' },
                  { id: 'SN-08', x: 120, y: 370, name: 'NW Emergency Egress' },
                  { id: 'SN-09', x: 1040, y: 310, name: 'NE Emergency Egress' },
                ].slice(0, layoutSpecs.sensorCount).map((sensor) => (
                  <g 
                    key={sensor.id}
                    transform={`translate(${sensor.x}, ${sensor.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement({
                        title: `IoT Node: ${sensor.name}`,
                        type: 'IoT Sensor',
                        capacity: '1,200 Pings/Sec Telemetry',
                        density: 'ESP32 Dual-Core • Edge AI',
                        details: `Direct telemetry node transmitting instantaneous crowd vector speed, head-count density, and directional drift. 100% privacy-preserving with no CCTV.`,
                        sensors: `${sensor.id} (Status: ONLINE • Signal: -48dBm)`
                      });
                    }}
                  >
                    <circle cx="0" cy="0" r="9" fill="#3b82f6" opacity="0.3" className="animate-ping" />
                    <circle cx="0" cy="0" r="5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                ))}
              </g>
            )}

            {/* ------------------------------------------------------------- */}
            {/* J. CROWD DENSITY HEATMAP OVERLAY */}
            {/* ------------------------------------------------------------- */}
            {showDensityHeatmap && (
              <g id="density-heatmap" opacity="0.45" className="transition-opacity duration-300 pointer-events-none">
                <ellipse cx="760" cy="270" rx="90" ry="45" fill="#ef4444" filter="url(#glowEffect)" />
                <ellipse cx="510" cy="420" rx="70" ry="35" fill="#f59e0b" filter="url(#glowEffect)" />
                <ellipse cx="230" cy="530" rx="55" ry="30" fill="#f59e0b" filter="url(#glowEffect)" />
                <ellipse cx="800" cy="520" rx="80" ry="40" fill="#22c55e" filter="url(#glowEffect)" />
                <ellipse cx="320" cy="330" rx="60" ry="30" fill="#22c55e" filter="url(#glowEffect)" />
              </g>
            )}

            {/* ------------------------------------------------------------- */}
            {/* K. EMERGENCY EVACUATION OVERLAY */}
            {/* ------------------------------------------------------------- */}
            {showEmergencyEvac && (
              <g id="emergency-evac-paths" className="pointer-events-none">
                <path
                  d="M 680 270 L 140 370"
                  stroke="#4ade80"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                  fill="none"
                />
                <path
                  d="M 760 280 L 1050 280"
                  stroke="#4ade80"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                  fill="none"
                />
                <path
                  d="M 520 440 L 920 500"
                  stroke="#4ade80"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                  fill="none"
                />
                <path
                  d="M 540 460 L 730 690"
                  stroke="#4ade80"
                  strokeWidth="5"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                  fill="none"
                />
              </g>
            )}

            {/* ------------------------------------------------------------- */}
            {/* L. LEGEND BOX (Exact Replica of User's Reference Image) */}
            {/* ------------------------------------------------------------- */}
            <g transform="translate(1040, 600)" className="select-none">
              <rect
                x="0"
                y="0"
                width="145"
                height="160"
                rx="6"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1.5"
                className="drop-shadow-lg"
              />

              <text x="72" y="20" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="1.5">
                LEGEND
              </text>
              <line x1="12" y1="26" x2="133" y2="26" stroke="#334155" strokeWidth="1" />

              {/* Item 1: MAIN STAGE */}
              <g transform="translate(14, 38)">
                <rect x="0" y="0" width="14" height="14" rx="2" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                <path d="M 7 3 L 7 11 M 3 7 L 11 7" stroke="#ffffff" strokeWidth="1.5" />
                <text x="22" y="11" fill="#e2e8f0" fontSize="9.5" fontWeight="800" letterSpacing="0.5">
                  MAIN STAGE
                </text>
              </g>

              {/* Item 2: RESTROOMS */}
              <g transform="translate(14, 62)">
                <rect x="0" y="0" width="14" height="14" rx="2" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1" />
                <text x="7" y="11" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  🚻
                </text>
                <text x="22" y="11" fill="#e2e8f0" fontSize="9.5" fontWeight="800" letterSpacing="0.5">
                  RESTROOMS
                </text>
              </g>

              {/* Item 3: FIRST AID */}
              <g transform="translate(14, 86)">
                <rect x="0" y="0" width="14" height="14" rx="2" fill="#dc2626" stroke="#fca5a5" strokeWidth="1" />
                <path d="M 7 3 L 7 11 M 3 7 L 11 7" stroke="#ffffff" strokeWidth="2" />
                <text x="22" y="11" fill="#e2e8f0" fontSize="9.5" fontWeight="800" letterSpacing="0.5">
                  FIRST AID
                </text>
              </g>

              {/* Item 4: FOOD & BEVERAGE */}
              <g transform="translate(14, 110)">
                <rect x="0" y="0" width="14" height="14" rx="2" fill="#78350f" stroke="#d97706" strokeWidth="1" />
                <text x="7" y="11" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  🍔
                </text>
                <text x="22" y="11" fill="#e2e8f0" fontSize="9" fontWeight="800" letterSpacing="0.3">
                  FOOD & BEVERAGE
                </text>
              </g>

              {/* Item 5: EXIT */}
              <g transform="translate(14, 134)">
                <rect x="0" y="0" width="14" height="14" rx="2" fill="#15803d" stroke="#4ade80" strokeWidth="1" />
                <text x="7" y="11" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  🏃
                </text>
                <text x="22" y="11" fill="#e2e8f0" fontSize="9.5" fontWeight="800" letterSpacing="0.5">
                  EXIT / EVAC
                </text>
              </g>
            </g>

          </svg>
        </div>

        {/* ===================================================================== */}
        {/* ELEMENT INSPECTION DRAWER (Shows details when user clicks any sector) */}
        {/* ===================================================================== */}
        {selectedElement && (
          <div className="absolute bottom-4 left-4 max-w-sm bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-700 shadow-2xl space-y-3 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-blue-400">
                  {selectedElement.type}
                </span>
                <h4 className="text-sm font-extrabold text-white">{selectedElement.title}</h4>
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedElement.details}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/80 rounded-xl p-2">
                <span className="text-[10px] text-slate-400 block font-semibold">Capacity</span>
                <span className="font-extrabold text-white text-xs">{selectedElement.capacity}</span>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-2">
                <span className="text-[10px] text-slate-400 block font-semibold">Density Status</span>
                <span className="font-extrabold text-emerald-400 text-xs">{selectedElement.density}</span>
              </div>
            </div>

            {selectedElement.sensors && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{selectedElement.sensors}</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ARCHITECTURAL METRICS FOOTER */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 px-6 py-4 border-t border-slate-800/90 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Barricaded Pens
          </span>
          <p className="text-sm font-black text-white flex items-center gap-1.5">
            <span>{layoutSpecs.stageBarricadeRings} Curved Tier Rings</span>
          </p>
          <p className="text-[10px] text-slate-500">Scaled for {currentAreaSqFt.toLocaleString()} sq.ft</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Entrance Flow Channels
          </span>
          <p className="text-sm font-black text-white flex items-center gap-1.5">
            <span>{layoutSpecs.entranceLanes} Parallel Lanes</span>
          </p>
          <p className="text-[10px] text-slate-500">With inspection booths</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sanitation Units
          </span>
          <p className="text-sm font-black text-white flex items-center gap-1.5">
            <span>{layoutSpecs.totalRestrooms} Portable Cabins</span>
          </p>
          <p className="text-[10px] text-slate-500">{layoutSpecs.restroomBanks} distributed clusters</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Perimeter Egress
          </span>
          <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
            <span>{layoutSpecs.emergencyExits} Emergency Exits</span>
          </p>
          <p className="text-[10px] text-slate-500">Full NFPA compliance</p>
        </div>
      </div>

    </div>
  );
};
