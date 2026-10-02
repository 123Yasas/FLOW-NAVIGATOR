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
  Users,
  Compass,
  Crosshair,
  Droplets,
  Activity,
  Ambulance,
  HeartPulse
} from 'lucide-react';

export interface EventCrowdManagementLayoutPlanProps {
  areaSqFt?: number;
  onAreaChange?: (sqFt: number) => void;
  expectedCrowd?: number;
  onCrowdChange?: (crowd: number) => void;
  length?: number;
  width?: number;
  unit?: 'sqft' | 'sqm';
  onDimensionsChange?: (length: number, width: number) => void;
  venueName?: string;
  eventName?: string;
  isSimulating?: boolean;
  onToggleSimulate?: () => void;
}

interface ObstacleDetails {
  id: string;
  title: string;
  category: 'Stage' | 'Barricade' | 'Security' | 'Medical' | 'Hydration' | 'Sanitation' | 'Egress' | 'Sensor';
  dimensions: string;
  capacity?: string;
  specs: string;
  safetyProtocol: string;
  status: 'OPTIMAL' | 'MODERATE' | 'CRITICAL' | 'STANDBY';
  riskScore: string;
}

export const EventCrowdManagementLayoutPlan: React.FC<EventCrowdManagementLayoutPlanProps> = ({
  areaSqFt: externalAreaSqFt,
  onAreaChange,
  expectedCrowd: externalExpectedCrowd,
  onCrowdChange,
  length: externalLength,
  width: externalWidth,
  unit = 'sqft',
  onDimensionsChange,
  venueName = 'Festival Grounds & Concourse',
  eventName = 'Grand Music & Cultural Concourse',
  isSimulating: externalIsSimulating,
  onToggleSimulate,
}) => {
  // Internal state fallback
  const [internalAreaSqFt, setInternalAreaSqFt] = useState<number>(75000);
  const [internalExpectedCrowd, setInternalExpectedCrowd] = useState<number>(12000);
  const [internalLength, setInternalLength] = useState<number>(300);
  const [internalWidth, setInternalWidth] = useState<number>(190);

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer Toggles
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showBarricades, setShowBarricades] = useState<boolean>(true);
  const [showFlowArrows, setShowFlowArrows] = useState<boolean>(true);
  const [showMedicalAmenities, setShowMedicalAmenities] = useState<boolean>(true);
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showEvacOverlay, setShowEvacOverlay] = useState<boolean>(false);

  // Active selected obstacle for deep CAD inspection
  const [selectedObstacle, setSelectedObstacle] = useState<ObstacleDetails | null>(null);

  // Effective values
  const currentAreaSqFt = externalAreaSqFt ?? internalAreaSqFt;
  const currentCrowd = externalExpectedCrowd ?? internalExpectedCrowd;
  const currentLength = externalLength ?? internalLength;
  const currentWidth = externalWidth ?? internalWidth;

  // Safe crowd calculation: NFPA 101 standard 4.5 sq.ft / person
  const safeCapacity = Math.floor(currentAreaSqFt / 4.5);
  const occupancyPercentage = Math.min(150, Math.round((currentCrowd / safeCapacity) * 100));
  const spacePerPerson = (currentAreaSqFt / Math.max(1, currentCrowd)).toFixed(1);

  // Handlers for inputs
  const handleCrowdInput = (newVal: number) => {
    const val = Math.max(100, Math.min(250000, newVal));
    if (onCrowdChange) onCrowdChange(val);
    else setInternalExpectedCrowd(val);
  };

  const handleAreaInput = (newSqFt: number) => {
    const val = Math.max(5000, Math.min(500000, newSqFt));
    if (onAreaChange) onAreaChange(val);
    else setInternalAreaSqFt(val);
  };

  // Determine Architecture Scale Tier based on size & people
  const tier = useMemo(() => {
    if (currentCrowd <= 3500 || currentAreaSqFt <= 25000) return 'SMALL';
    if (currentCrowd <= 18000 || currentAreaSqFt <= 110000) return 'MEDIUM';
    return 'MEGA';
  }, [currentCrowd, currentAreaSqFt]);

  // Derived CAD layout metrics based on size & people
  const cadMetrics = useMemo(() => {
    // Meters representation
    const lenM = Math.round(unit === 'sqm' ? currentLength : currentLength * 0.3048);
    const widM = Math.round(unit === 'sqm' ? currentWidth : currentWidth * 0.3048);

    // Perimeter road width based on NFPA crowd evacuation guidelines
    let perimeterRoadWidthM = 6.0;
    let accessRoadWidthM = 8.0;
    if (tier === 'MEDIUM') {
      perimeterRoadWidthM = 8.0;
      accessRoadWidthM = 10.0;
    } else if (tier === 'MEGA') {
      perimeterRoadWidthM = 12.0;
      accessRoadWidthM = 15.0;
    }

    // Dynamic obstacle counts
    const penCount = tier === 'SMALL' ? 2 : tier === 'MEDIUM' ? 4 : 6;
    const stageCount = tier === 'SMALL' ? 1 : tier === 'MEDIUM' ? 2 : 3;
    const waterStations = tier === 'SMALL' ? 4 : tier === 'MEDIUM' ? 8 : 16;
    const sensorCount = tier === 'SMALL' ? 8 : tier === 'MEDIUM' ? 16 : 28;
    const ambulanceBays = tier === 'SMALL' ? 1 : tier === 'MEDIUM' ? 2 : 4;
    const egressRoads = tier === 'SMALL' ? 2 : tier === 'MEDIUM' ? 3 : 5;
    const evacTimeMins = (currentCrowd / (egressRoads * 850)).toFixed(1);

    return {
      lenM: lenM || (tier === 'SMALL' ? 120 : tier === 'MEDIUM' ? 190 : 350),
      widM: widM || (tier === 'SMALL' ? 180 : tier === 'MEDIUM' ? 300 : 500),
      perimeterRoadWidthM,
      accessRoadWidthM,
      penCount,
      stageCount,
      waterStations,
      sensorCount,
      ambulanceBays,
      egressRoads,
      evacTimeMins,
    };
  }, [tier, unit, currentLength, currentWidth, currentCrowd]);

  // Presets
  const sizePresets = [
    { label: 'Small Concourse', area: 15000, crowd: 2500, len: 120, wid: 80, desc: '2 Compartment Pens • 2.5k Cap' },
    { label: 'Reference Arena (190m×300m)', area: 75000, crowd: 12000, len: 300, wid: 190, desc: '4 Segmented Pens • 12k Cap' },
    { label: 'Mega Festival Grounds', area: 180000, crowd: 35000, len: 500, wid: 300, desc: '6 High-Density Pens • 35k Cap' },
  ];

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="bg-[#070b14] text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans select-none">
      
      {/* ========================================================================= */}
      {/* 1. TOP CAD BLUEPRINT HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0a1122] via-[#0d162d] to-[#0a1122] px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono text-[10px] font-black tracking-wider uppercase">
              CAD ARCHITECTURAL BLUEPRINT
            </span>
            <span className="text-xs text-slate-400 font-mono">
              SCALE: 1:500 • NFPA 101 COMPLIANT
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            EVENT CROWD MANAGEMENT LAYOUT PLAN
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {venueName} — <strong className="text-slate-300">{eventName}</strong>
          </p>
        </div>

        {/* Live Safety Density Metrics Pill */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              occupancyPercentage > 90 ? 'bg-red-500' : occupancyPercentage > 75 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}></span>
            <span className="text-slate-300 font-mono">
              Density: <strong className="text-white font-black">{spacePerPerson} sq.ft/person</strong>
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-blue-950/70 border border-blue-800/80 text-blue-200">
            <span className="font-mono">Cap: <strong className="text-white font-extrabold">{safeCapacity.toLocaleString()}</strong> ({occupancyPercentage}%)</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-800/80 text-indigo-200 font-mono">
            Evac Time: <strong className="text-white font-extrabold">{cadMetrics.evacTimeMins} mins</strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC INPUTS BAR: SIZE PRESETS + APPROX PEOPLE CONTROLLER */}
      {/* ========================================================================= */}
      <div className="bg-[#0b1224] px-4 sm:px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Preset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            Layout Presets:
          </span>
          {sizePresets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                handleAreaInput(p.area);
                handleCrowdInput(p.crowd);
                if (onDimensionsChange) onDimensionsChange(p.len, p.wid);
                else {
                  setInternalLength(p.len);
                  setInternalWidth(p.wid);
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                Math.abs(currentAreaSqFt - p.area) < 5000
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
              title={p.desc}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Approx People Input & Slider */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-3.5 py-1.5 rounded-2xl border border-slate-700/80">
          <Users className="w-4 h-4 text-blue-400" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300 font-bold">Approx. People:</span>
            <input
              type="number"
              value={currentCrowd}
              step={500}
              min={500}
              max={100000}
              onChange={(e) => handleCrowdInput(parseInt(e.target.value) || 0)}
              className="w-20 bg-slate-800 border border-slate-600 rounded-lg px-2 py-0.5 text-center font-mono font-black text-cyan-300 focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <input
            type="range"
            min={1000}
            max={50000}
            step={1000}
            value={currentCrowd}
            onChange={(e) => handleCrowdInput(parseInt(e.target.value))}
            className="w-28 sm:w-36 accent-cyan-400 cursor-pointer"
          />

          <span className="text-[10px] font-mono font-bold text-slate-400 hidden sm:inline">
            Tier: <strong className="text-white">{tier}</strong>
          </span>
        </div>

        {/* Blueprint Layer Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              showDimensions ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Dimension Lines & Annotations"
          >
            📐 Dimensions
          </button>
          <button
            onClick={() => setShowBarricades(!showBarricades)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              showBarricades ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Heavy-Duty Barricades & Pens"
          >
            🚧 Barricades
          </button>
          <button
            onClick={() => setShowFlowArrows(!showFlowArrows)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              showFlowArrows ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Directional Flow Arrows"
          >
            🟢 Flow Arrows
          </button>
          <button
            onClick={() => setShowMedicalAmenities(!showMedicalAmenities)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              showMedicalAmenities ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Medical & Water Stations"
          >
            🏥 Medical / Water
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE 2D CAD VECTOR BLUEPRINT CANVAS */}
      {/* ========================================================================= */}
      <div 
        className="relative bg-[#060913] h-[640px] w-full overflow-hidden cursor-grab active:cursor-grabbing border-b border-slate-800"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Subtle CAD Background Grid Lines */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #1e293b 1px, transparent 1px),
              linear-gradient(to bottom, #1e293b 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating Zoom & Pan Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-[#0a1120]/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl">
          <button 
            onClick={() => setZoomLevel(prev => Math.min(2.2, prev + 0.15))}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Egress Simulation Toggle Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {onToggleSimulate && (
            <button
              onClick={onToggleSimulate}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer ${
                externalIsSimulating 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {externalIsSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{externalIsSimulating ? 'Stop Flow Simulation' : '▶ Simulate Egress Movement'}</span>
            </button>
          )}

          <span className="px-3 py-1 bg-slate-900/90 text-slate-400 border border-slate-700/80 rounded-xl text-[11px] font-mono">
            Obstacles Loaded: <strong className="text-cyan-400">{cadMetrics.penCount} Pens • {cadMetrics.stageCount} Stages</strong>
          </span>
        </div>

        {/* SVG CAD Blueprint Viewport */}
        <svg
          viewBox="0 0 1400 850"
          className="w-full h-full select-none transition-transform duration-75"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Arrow marker for dimension lines */}
            <marker id="dim-arrow-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="flow-arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#22c55e" />
            </marker>

            {/* Pattern for Heavy Duty Barricades */}
            <pattern id="barricade-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="16" y2="16" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* ================================================================= */}
          {/* A. OUTER DIMENSION LINES (AutoCAD style markings matching image 1) */}
          {/* ================================================================= */}
          {showDimensions && (
            <g className="font-mono font-bold text-xs" stroke="#38bdf8" fill="#38bdf8" opacity="0.9">
              {/* TOP DIMENSION: Perimeter Road Width */}
              <line x1="140" y1="35" x2="1260" y2="35" strokeWidth="1.5" markerStart="url(#dim-arrow-cyan)" markerEnd="url(#dim-arrow-cyan)" />
              <line x1="140" y1="25" x2="140" y2="45" strokeWidth="1.5" />
              <line x1="1260" y1="25" x2="1260" y2="45" strokeWidth="1.5" />
              <rect x="580" y="24" width="240" height="22" fill="#060913" rx="4" />
              <text x="700" y="40" textAnchor="middle" fill="#38bdf8" fontSize="12" stroke="none">
                {cadMetrics.perimeterRoadWidthM.toFixed(2)}M WIDE PERIMETER ROAD
              </text>

              {/* BOTTOM DIMENSION: Access Road & Multi-segment mm measurements */}
              <line x1="140" y1="815" x2="1260" y2="815" strokeWidth="1.5" markerStart="url(#dim-arrow-cyan)" markerEnd="url(#dim-arrow-cyan)" />
              <line x1="140" y1="805" x2="140" y2="825" strokeWidth="1.5" />
              <line x1="1260" y1="805" x2="1260" y2="825" strokeWidth="1.5" />
              <rect x="530" y="804" width="340" height="22" fill="#060913" rx="4" />
              <text x="700" y="820" textAnchor="middle" fill="#38bdf8" fontSize="12" stroke="none">
                {cadMetrics.accessRoadWidthM.toFixed(0)}M WIDE ACCESS ROAD (MAIN) • {cadMetrics.lenM * 100}mm
              </text>

              {/* Sub-dimension markings on bottom right */}
              <line x1="880" y1="835" x2="1260" y2="835" strokeWidth="1" markerStart="url(#dim-arrow-cyan)" markerEnd="url(#dim-arrow-cyan)" />
              <text x="980" y="847" textAnchor="middle" fill="#94a3b8" fontSize="10" stroke="none">3000</text>
              <text x="1080" y="847" textAnchor="middle" fill="#94a3b8" fontSize="10" stroke="none">2000</text>
              <text x="1180" y="847" textAnchor="middle" fill="#94a3b8" fontSize="10" stroke="none">1000</text>

              {/* LEFT VERTICAL DIMENSION */}
              <line x1="45" y1="80" x2="45" y2="770" strokeWidth="1.5" markerStart="url(#dim-arrow-cyan)" markerEnd="url(#dim-arrow-cyan)" />
              <line x1="35" y1="80" x2="55" y2="80" strokeWidth="1.5" />
              <line x1="35" y1="770" x2="55" y2="770" strokeWidth="1.5" />
              <text 
                x="35" 
                y="425" 
                textAnchor="middle" 
                fill="#38bdf8" 
                fontSize="12" 
                transform="rotate(-90 35 425)" 
                stroke="none"
              >
                {cadMetrics.widM}M WIDE VENUE BOUNDARY
              </text>

              {/* RIGHT VERTICAL DIMENSION */}
              <text 
                x="1360" 
                y="425" 
                textAnchor="middle" 
                fill="#38bdf8" 
                fontSize="12" 
                transform="rotate(90 1360 425)" 
                stroke="none"
              >
                {cadMetrics.accessRoadWidthM.toFixed(0)}M WIDE ACCESS ROAD (MAIN)
              </text>
            </g>
          )}

          {/* ================================================================= */}
          {/* B. VENUE BOUNDARY & PERIMETER ROADS (Purple boundary line + Green roads) */}
          {/* ================================================================= */}
          {/* Outer Main Perimeter Enclosure (Purple line with rounded corners) */}
          <rect
            x="130"
            y="70"
            width="1140"
            height="710"
            rx="30"
            fill="#090f1d"
            stroke="#a855f7"
            strokeWidth="4"
          />

          {/* Dedicated Perimeter Road Corridor (Green dashed guidance lines) */}
          <rect
            x="160"
            y="95"
            width="1080"
            height="660"
            rx="20"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeDasharray="6,4"
            opacity="0.8"
          />

          {/* Perimeter Road Directional Green Arrows */}
          {showFlowArrows && (
            <g stroke="#22c55e" strokeWidth="2.5" fill="none">
              {/* Top perimeter road flow (West to East) */}
              <line x1="400" y1="82" x2="480" y2="82" markerEnd="url(#flow-arrow-green)" />
              <line x1="880" y1="82" x2="960" y2="82" markerEnd="url(#flow-arrow-green)" />

              {/* Bottom perimeter road flow (East to West) */}
              <line x1="460" y1="768" x2="380" y2="768" markerEnd="url(#flow-arrow-green)" />
              <line x1="960" y1="768" x2="880" y2="768" markerEnd="url(#flow-arrow-green)" />

              {/* Left perimeter road (South to North) */}
              <line x1="145" y1="650" x2="145" y2="570" markerEnd="url(#flow-arrow-green)" />
              <line x1="145" y1="280" x2="145" y2="200" markerEnd="url(#flow-arrow-green)" />

              {/* Right perimeter road (Emergency Egress) */}
              <line x1="1255" y1="260" x2="1255" y2="180" markerEnd="url(#flow-arrow-green)" />
              <line x1="1255" y1="640" x2="1255" y2="720" markerEnd="url(#flow-arrow-green)" />
            </g>
          )}

          {/* ================================================================= */}
          {/* C. STAGE & SOUND OBSTACLES (Left side of blueprint) */}
          {/* ================================================================= */}
          {/* 1. MAJOR STAGE (GREEN) */}
          <g 
            className="cursor-pointer group"
            onClick={() => setSelectedObstacle({
              id: 'stage-major',
              title: 'Major Concert Stage (Green)',
              category: 'Stage',
              dimensions: `${cadMetrics.lenM > 250 ? '36m × 22m' : '24m × 16m'} Elevated Deck`,
              capacity: `${Math.round(currentCrowd * 0.45).toLocaleString()} Spectator Front Pit`,
              specs: 'Reinforced aluminum ground-support roof with acoustic line-array towers and dual backstage service ramps.',
              safetyProtocol: '6.0m buffer security moat with emergency crowd crush release gates.',
              status: 'OPTIMAL',
              riskScore: 'Low (Controlled Ingress)'
            })}
          >
            {/* Stage outer safety compound */}
            <rect
              x="180"
              y="230"
              width="130"
              height="280"
              fill="#062215"
              stroke="#22c55e"
              strokeWidth="3"
              rx="8"
            />
            {/* Stage inner elevated performance platform */}
            <rect
              x="200"
              y="265"
              width="90"
              height="210"
              fill="#0d3822"
              stroke="#22c55e"
              strokeWidth="2"
            />
            <text x="245" y="365" textAnchor="middle" fill="#4ade80" fontSize="14" fontWeight="900" transform="rotate(-90 245 365)">
              MAJOR STAGE (GREEN)
            </text>
          </g>

          {/* 2. SIDE STAGE (ORANGE) - Scales or adjusts based on tier */}
          {cadMetrics.stageCount >= 2 && (
            <g
              className="cursor-pointer group"
              onClick={() => setSelectedObstacle({
                id: 'stage-side',
                title: 'Side Stage (Orange)',
                category: 'Stage',
                dimensions: '18m × 12m Secondary Stage',
                capacity: `${Math.round(currentCrowd * 0.2).toLocaleString()} Viewing Area`,
                specs: 'Secondary acoustic performance platform with independent mixer and perimeter crowd railing.',
                safetyProtocol: 'Dedicated 4m wide side egress lane connected directly to the North perimeter ring road.',
                status: 'OPTIMAL',
                riskScore: 'Safe'
              })}
            >
              <rect
                x="320"
                y="125"
                width="150"
                height="80"
                fill="#2c1706"
                stroke="#f97316"
                strokeWidth="2.5"
                rx="6"
              />
              <text x="395" y="160" textAnchor="middle" fill="#fb923c" fontSize="12" fontWeight="900">
                SIDE STAGE
              </text>
              <text x="395" y="178" textAnchor="middle" fill="#ea580c" fontSize="10" fontWeight="bold">
                (ORANGE)
              </text>
            </g>
          )}

          {/* Front-of-House (FOH) Sound / Tech Mixing Island */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedObstacle({
              id: 'foh-tower',
              title: 'Front-of-House Sound & Lighting Island',
              category: 'Security',
              dimensions: '14m × 8m Technical Enclosure',
              specs: 'FOH sound engineering mixing riser, lighting consoles, and delay-tower signal hub.',
              safetyProtocol: 'High-impact perimeter crash barriers with anti-climb fascia and crowd diversion angles.',
              status: 'STANDBY',
              riskScore: 'Neutral Obstacle'
            })}
          >
            <rect
              x="320"
              y="530"
              width="150"
              height="80"
              fill="#181308"
              stroke="#eab308"
              strokeWidth="2"
              rx="4"
            />
            {/* Interior structure divisions */}
            <line x1="370" y1="530" x2="370" y2="610" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="3,3" />
            <line x1="420" y1="530" x2="420" y2="610" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x="395" y="565" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="bold">
              FOH MIXING TOWER
            </text>
            <text x="395" y="582" textAnchor="middle" fill="#a16207" fontSize="9" fontWeight="bold">
              (TECH CONTROL)
            </text>
          </g>

          {/* ================================================================= */}
          {/* D. HEAVY-DUTY CROWD BARRICADES & SEGMENTED PENS (OBSTACLES) */}
          {/* ================================================================= */}
          {showBarricades && (
            <g>
              {/* PEN 1: Top-Left Pen ("HEAVY-DUTY BARRICADE") */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedObstacle({
                  id: 'pen-1',
                  title: 'Heavy-Duty Barricade Pen 01',
                  category: 'Barricade',
                  dimensions: '42m × 36m Front Pen',
                  capacity: `${Math.round(currentCrowd * 0.28).toLocaleString()} Max Standing Capacity`,
                  specs: 'Steel crowd-crush barrier with rear footplate (5.0 kN/m lateral crowd surge resistance rating).',
                  safetyProtocol: 'Two designated lateral escape lanes; pressure-relief gates every 15 meters.',
                  status: occupancyPercentage > 85 ? 'CRITICAL' : 'OPTIMAL',
                  riskScore: `${occupancyPercentage}% Density Load`
                })}
              >
                <rect
                  x="500"
                  y="125"
                  width="170"
                  height="260"
                  fill="#1c0e12"
                  stroke="#ef4444"
                  strokeWidth="3"
                  rx="6"
                />
                <text x="585" y="240" textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="900">
                  HEAVY-DUTY
                </text>
                <text x="585" y="260" textAnchor="middle" fill="#ef4444" fontSize="13" fontWeight="900">
                  BARRICADE
                </text>
                <text x="585" y="285" textAnchor="middle" fill="#fda4af" fontSize="10" fontStyle="italic">
                  Pen Cap: {Math.round(currentCrowd * 0.28).toLocaleString()}
                </text>
              </g>

              {/* PEN 2: Top-Mid Pen ("MULTI-SEGMENT CROWD CONTROL") */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedObstacle({
                  id: 'pen-2',
                  title: 'Multi-Segment Crowd Control Pen 02',
                  category: 'Barricade',
                  dimensions: '42m × 36m Mid Concourse Pen',
                  capacity: `${Math.round(currentCrowd * 0.24).toLocaleString()} Capacity`,
                  specs: 'Segmented modular interlocking barriers to break incoming crowd wave velocity.',
                  safetyProtocol: 'Direct connection to Central Security Hub flow routing corridor.',
                  status: 'OPTIMAL',
                  riskScore: 'Controlled'
                })}
              >
                <rect
                  x="690"
                  y="125"
                  width="170"
                  height="260"
                  fill="#1c0e12"
                  stroke="#ef4444"
                  strokeWidth="3"
                  rx="6"
                />
                <text x="775" y="230" textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="900">
                  MULTI-
                </text>
                <text x="775" y="250" textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="900">
                  SEGMENT
                </text>
                <text x="775" y="270" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="900">
                  CROWD CONTROL
                </text>
              </g>

              {/* PEN 3: Bottom-Left Pen ("MULTI-SEGMENT BARRICADE") */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedObstacle({
                  id: 'pen-3',
                  title: 'Multi-Segment Barricade Pen 03',
                  category: 'Barricade',
                  dimensions: '42m × 36m Lower Spectator Pen',
                  capacity: `${Math.round(currentCrowd * 0.25).toLocaleString()} Capacity`,
                  specs: 'Heavy-gauge steel crash fencing with anti-trip rubber floor transitions.',
                  safetyProtocol: 'Direct egress opening to Southern perimeter access road.',
                  status: 'OPTIMAL',
                  riskScore: 'Normal'
                })}
              >
                <rect
                  x="500"
                  y="420"
                  width="170"
                  height="260"
                  fill="#1c0e12"
                  stroke="#ef4444"
                  strokeWidth="3"
                  rx="6"
                />
                <text x="585" y="540" textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="900">
                  MULTI-
                </text>
                <text x="585" y="560" textAnchor="middle" fill="#ef4444" fontSize="13" fontWeight="900">
                  SEGMENT
                </text>
                <text x="585" y="580" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="900">
                  BARRICADE
                </text>
              </g>

              {/* PEN 4: Bottom-Mid Pen ("MULTI-DUTY CROWD CONTROL") */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedObstacle({
                  id: 'pen-4',
                  title: 'Multi-Duty Crowd Control Pen 04',
                  category: 'Barricade',
                  dimensions: '42m × 36m Concourse Pen',
                  capacity: `${Math.round(currentCrowd * 0.23).toLocaleString()} Capacity`,
                  specs: 'Flexible dual-hinge barriers with emergency break-open gate for first-responder access.',
                  safetyProtocol: 'Equipped with ESP32 optical gate counter [S-04].',
                  status: 'OPTIMAL',
                  riskScore: 'Normal'
                })}
              >
                <rect
                  x="690"
                  y="420"
                  width="170"
                  height="260"
                  fill="#1c0e12"
                  stroke="#ef4444"
                  strokeWidth="3"
                  rx="6"
                />
                <text x="775" y="540" textAnchor="middle" fill="#f87171" fontSize="13" fontWeight="900">
                  MULTI-DUTY
                </text>
                <text x="775" y="560" textAnchor="middle" fill="#ef4444" fontSize="13" fontWeight="900">
                  CROWD
                </text>
                <text x="775" y="580" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="900">
                  CONTROL
                </text>
              </g>

              {/* Red Barrier Line across the center dividing corridor */}
              <line x1="320" y1="400" x2="860" y2="400" stroke="#dc2626" strokeWidth="4" />
              <line x1="500" y1="125" x2="500" y2="680" stroke="#dc2626" strokeWidth="4" />
              <line x1="680" y1="125" x2="680" y2="680" stroke="#dc2626" strokeWidth="4" />
              <line x1="860" y1="125" x2="860" y2="680" stroke="#dc2626" strokeWidth="4" />
            </g>
          )}

          {/* ================================================================= */}
          {/* E. CENTRAL SECURITY & ROUTING HUB (Matching Image 1) */}
          {/* ================================================================= */}
          <g
            className="cursor-pointer group"
            onClick={() => setSelectedObstacle({
              id: 'security-hub',
              title: 'Central Security & Guidance Hub',
              category: 'Security',
              dimensions: '16m × 16m Tactical Command Post',
              specs: 'Elevated 360-degree command pod, electronic gate override triggers, high-decibel PA announcement hub.',
              safetyProtocol: 'Central distributor routing crowd outward into four separated concourses to prevent crowd intersection.',
              status: 'OPTIMAL',
              riskScore: 'Key Anchor'
            })}
          >
            {/* Outer buffer */}
            <rect
              x="875"
              y="350"
              width="90"
              height="100"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="2.5"
              rx="10"
            />
            {/* Inner Hub Core */}
            <rect
              x="890"
              y="365"
              width="60"
              height="70"
              fill="#1e293b"
              stroke="#0284c7"
              strokeWidth="2"
              rx="6"
            />
            <text x="920" y="405" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="900">
              HUB
            </text>

            <text x="920" y="475" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="800">
              SECURITY
            </text>
            <text x="920" y="490" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="800">
              HUB
            </text>

            {/* Pointer line connecting Hub label to box */}
            <line x1="920" y1="450" x2="920" y2="460" stroke="#38bdf8" strokeWidth="1.5" />
          </g>

          {/* Central Hub Radiating Flow Arrows */}
          {showFlowArrows && (
            <g stroke="#22c55e" strokeWidth="3" fill="none">
              {/* North Arrow */}
              <line x1="920" y1="330" x2="920" y2="240" markerEnd="url(#flow-arrow-green)" />
              {/* South Arrow */}
              <line x1="920" y1="520" x2="920" y2="620" markerEnd="url(#flow-arrow-green)" />
              {/* East Egress Arrow */}
              <line x1="975" y1="400" x2="1100" y2="400" markerEnd="url(#flow-arrow-green)" />
            </g>
          )}

          {/* ================================================================= */}
          {/* F. MEDICAL, FIRST AID & AMBULANCE EGRESS (Top Right Zone) */}
          {/* ================================================================= */}
          {showMedicalAmenities && (
            <g>
              {/* 1. MEDICAL STATION with Triage Beds */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedObstacle({
                  id: 'medical-station',
                  title: 'Medical Station & Field Hospital',
                  category: 'Medical',
                  dimensions: '30m × 22m Triage Facility',
                  capacity: `${cadMetrics.tier === 'MEGA' ? '24' : '12'} Triage Beds`,
                  specs: 'Air-conditioned sterile field hospital with emergency resuscitation, oxygen supply, and cardiac monitoring.',
                  safetyProtocol: 'Direct zero-delay connection to external Ambulance Egress corridor.',
                  status: 'OPTIMAL',
                  riskScore: 'Ready'
                })}
              >
                <rect
                  x="990"
                  y="125"
                  width="180"
                  height="160"
                  fill="#08182b"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  rx="8"
                />

                {/* Patient Bed Icons */}
                <g stroke="#38bdf8" strokeWidth="1.5" fill="none">
                  {/* Row 1 beds */}
                  <rect x="1005" y="140" width="35" height="45" rx="3" fill="#0f2942" />
                  <rect x="1055" y="140" width="35" height="45" rx="3" fill="#0f2942" />
                  <rect x="1105" y="140" width="35" height="45" rx="3" fill="#0f2942" />
                  {/* Bed pill / crosses */}
                  <line x1="1022" y1="150" x2="1022" y2="175" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="1072" y1="150" x2="1072" y2="175" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="1122" y1="150" x2="1122" y2="175" stroke="#38bdf8" strokeWidth="2" />
                </g>

                <text x="1080" y="215" textAnchor="middle" fill="#7dd3fc" fontSize="13" fontWeight="900">
                  MEDICAL
                </text>
                <text x="1080" y="235" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="900">
                  STATION
                </text>

                {/* Stretcher / Personnel icon */}
                <circle cx="1080" cy="255" r="7" fill="#38bdf8" />
                <path d="M 1070 270 Q 1080 262 1090 270" stroke="#38bdf8" strokeWidth="2" fill="none" />
              </g>

              {/* 2. FIRST AID STATION (Red box with white cross) */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedObstacle({
                  id: 'first-aid',
                  title: 'First Aid Immediate Response Station',
                  category: 'Medical',
                  dimensions: '12m × 12m Rapid Post',
                  specs: 'Rapid wound dressing, dehydration relief, cold-pack packs, and paramedic triage point.',
                  safetyProtocol: 'Staffed by 4 certified EMT paramedics throughout the event.',
                  status: 'OPTIMAL',
                  riskScore: 'Active'
                })}
              >
                <rect
                  x="1185"
                  y="205"
                  width="55"
                  height="55"
                  fill="#dc2626"
                  stroke="#ef4444"
                  strokeWidth="2"
                  rx="4"
                />
                {/* White Cross */}
                <path
                  d="M 1205 212 H 1220 V 1222 H 1205 Z"
                  fill="white"
                />
                <line x1="1195" y1="232" x2="1230" y2="232" stroke="white" strokeWidth="7" />
                <line x1="1212" y1="215" x2="1212" y2="250" stroke="white" strokeWidth="7" />

                <text x="1255" y="225" fill="#fca5a5" fontSize="10" fontWeight="bold">
                  FIRST AID
                </text>
                <text x="1255" y="240" fill="#f87171" fontSize="10" fontWeight="bold">
                  STATION
                </text>
                <line x1="1242" y1="232" x2="1252" y2="232" stroke="#ef4444" strokeWidth="1.5" />
              </g>

              {/* 3. AMBULANCE EGRESS CORRIDOR & AMBULANCES */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedObstacle({
                  id: 'ambulance-egress',
                  title: 'Dedicated Ambulance Egress Fast-Track',
                  category: 'Egress',
                  dimensions: '6.0m Wide Clear Vehicle Channel',
                  specs: 'Sterile vehicular passage guaranteed free of pedestrian crowding for hospital transfer.',
                  safetyProtocol: 'Continuous police and barrier security escorts; exit directly onto regional medical highway.',
                  status: 'OPTIMAL',
                  riskScore: 'Critical Priority'
                })}
              >
                {/* Ambulance Parking Bay */}
                <rect
                  x="1185"
                  y="125"
                  width="65"
                  height="65"
                  fill="#0c192d"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  rx="4"
                />
                <text x="1217" y="160" textAnchor="middle" fill="#38bdf8" fontSize="20">
                  🚑
                </text>

                <text x="1260" y="145" fill="#38bdf8" fontSize="10" fontWeight="black">
                  AMBULANCE
                </text>
                <text x="1260" y="160" fill="#38bdf8" fontSize="10" fontWeight="black">
                  EGRESS
                </text>
                <line x1="1250" y1="152" x2="1258" y2="152" stroke="#38bdf8" strokeWidth="1.5" />

                {/* Ambulance 1 parked */}
                <rect x="1175" y="320" width="55" height="30" rx="4" fill="#1e293b" stroke="#f87171" strokeWidth="1.5" />
                <text x="1202" y="340" textAnchor="middle" fill="#ef4444" fontSize="14">🚑</text>

                {/* Ambulance 2 parked */}
                <rect x="1175" y="365" width="55" height="30" rx="4" fill="#1e293b" stroke="#f87171" strokeWidth="1.5" />
                <text x="1202" y="385" textAnchor="middle" fill="#ef4444" fontSize="14">🚑</text>
              </g>
            </g>
          )}

          {/* ================================================================= */}
          {/* G. PUBLIC WATER & SANITATION STATIONS (Bottom Right Zone) */}
          {/* ================================================================= */}
          {showMedicalAmenities && (
            <g>
              {/* 1. Sanitation Blocks / Restrooms */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedObstacle({
                  id: 'sanitation-block',
                  title: 'Modular Sanitation & Restroom Cluster',
                  category: 'Sanitation',
                  dimensions: '28m × 16m Restroom Compound',
                  capacity: `${cadMetrics.waterStations * 3} Vacuum Restrooms`,
                  specs: 'Gender-segregated accessible toilet cabins with pressurized greywater recycling.',
                  safetyProtocol: 'Continuous lighting, non-slip rubber decking, and one-way entry/exit queue gates.',
                  status: 'OPTIMAL',
                  riskScore: 'Clean'
                })}
              >
                <rect
                  x="990"
                  y="530"
                  width="180"
                  height="150"
                  fill="#081e2b"
                  stroke="#0284c7"
                  strokeWidth="2"
                  rx="6"
                />

                {/* Grid of restroom cubicles */}
                <g fill="#0c2d40" stroke="#0284c7" strokeWidth="1">
                  {[0, 1, 2].map((col) => (
                    [0, 1].map((row) => (
                      <g key={`${col}-${row}`}>
                        <rect x={1005 + col * 52} y={545 + row * 45} width="44" height="38" rx="2" />
                        <text x={1027 + col * 52} y={568 + row * 45} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                          🚻
                        </text>
                      </g>
                    ))
                  ))}
                </g>

                <text x="1080" y="650" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">
                  SANITATION BLOCK
                </text>
                <text x="1080" y="665" textAnchor="middle" fill="#0284c7" fontSize="10">
                  (RESTROOMS)
                </text>
              </g>

              {/* 2. PUBLIC WATER STATIONS Grid */}
              <g
                className="cursor-pointer group"
                onClick={() => setSelectedObstacle({
                  id: 'water-stations',
                  title: 'Public Water Hydration Hubs',
                  category: 'Hydration',
                  dimensions: '16 Station High-Flow Water Grid',
                  capacity: '500 Liters / Minute Continuous Chilled Water',
                  specs: 'Potable multi-spigot hydration stations preventing spectator heat exhaustion and queue surges.',
                  safetyProtocol: 'Zero-barrier walk-through flow; drainage channels prevent slip hazards.',
                  status: 'OPTIMAL',
                  riskScore: 'Hydrated'
                })}
              >
                <rect
                  x="1185"
                  y="460"
                  width="100"
                  height="220"
                  fill="#061c28"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  rx="6"
                />

                {/* Water spigot icons grid */}
                {[0, 1].map((col) => (
                  [0, 1, 2, 3].map((row) => (
                    <g key={`w-${col}-${row}`} stroke="#38bdf8" strokeWidth="1.5" fill="none">
                      <rect x={1195 + col * 45} y={475 + row * 46} width="36" height="36" rx="3" fill="#082b3d" />
                      <circle cx={1213 + col * 45} cy={490 + row * 46} r="4" fill="#38bdf8" />
                      <line x1={1213 + col * 45} y1={494 + row * 46} x2={1213 + col * 45} y2={504 + row * 46} stroke="#38bdf8" strokeWidth="2" />
                    </g>
                  ))
                ))}

                <text x="1300" y="550" fill="#38bdf8" fontSize="12" fontWeight="900">
                  PUBLIC
                </text>
                <text x="1300" y="568" fill="#38bdf8" fontSize="12" fontWeight="900">
                  WATER
                </text>
                <text x="1300" y="586" fill="#38bdf8" fontSize="12" fontWeight="900">
                  STATIONS
                </text>

                {/* Pointer line */}
                <line x1="1285" y1="565" x2="1295" y2="565" stroke="#38bdf8" strokeWidth="1.5" />
              </g>
            </g>
          )}

          {/* ================================================================= */}
          {/* H. IOT SENSOR NODES [S01, S02, S03...] at Gate Obstacles */}
          {/* ================================================================= */}
          {showSensors && (
            <g className="font-mono font-black text-[9px]">
              {/* Sensor 1: Stage North Gate */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedObstacle({
                  id: 'sensor-s01',
                  title: 'IoT Sensor Node [S01] - North Stage Gate',
                  category: 'Sensor',
                  dimensions: 'Dual-Laser IR Beam Interruption',
                  specs: 'Hardware ESP32 pulse detector registering in/out crowd delta at 10Hz sampling.',
                  safetyProtocol: 'Auto-triggers barrier lock if pit density exceeds 4.0 people/m².',
                  status: 'OPTIMAL',
                  riskScore: 'Live Stream'
                })}
              >
                <rect x="500" y="115" width="28" height="20" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <text x="514" y="129" textAnchor="middle" fill="white">S01</text>
              </g>

              {/* Sensor 2: Pen Mid Corridor */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedObstacle({
                  id: 'sensor-s02',
                  title: 'IoT Sensor Node [S02] - Central Concourse',
                  category: 'Sensor',
                  dimensions: 'mmWave Radar Velocity Counter',
                  specs: 'Directional velocity detection tracking foot-traffic momentum heading toward the hub.',
                  safetyProtocol: 'Feeds live trend to the FlowNavigator routing engine.',
                  status: 'OPTIMAL',
                  riskScore: 'Live Stream'
                })}
              >
                <rect x="680" y="390" width="28" height="20" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <text x="694" y="404" textAnchor="middle" fill="white">S02</text>
              </g>

              {/* Sensor 3: Hub East Inflow */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedObstacle({
                  id: 'sensor-s03',
                  title: 'IoT Sensor Node [S03] - Security Hub East',
                  category: 'Sensor',
                  dimensions: 'ToF LiDAR Gate Counter',
                  specs: 'Bi-directional spectator influx counter measuring throughput into medical/water alley.',
                  safetyProtocol: 'Alerts medical dispatch if bottleneck formation begins.',
                  status: 'OPTIMAL',
                  riskScore: 'Live Stream'
                })}
              >
                <rect x="975" y="390" width="28" height="20" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <text x="989" y="404" textAnchor="middle" fill="white">S03</text>
              </g>

              {/* Sensor 4: South Concourse */}
              <g 
                className="cursor-pointer"
                onClick={() => setSelectedObstacle({
                  id: 'sensor-s04',
                  title: 'IoT Sensor Node [S04] - South Egress Gate',
                  category: 'Sensor',
                  dimensions: 'Dual-Laser IR Beam Interruption',
                  specs: 'Monitors perimeter discharge rate during event egress.',
                  safetyProtocol: 'Reports clearance velocity to local emergency coordinators.',
                  status: 'OPTIMAL',
                  riskScore: 'Live Stream'
                })}
              >
                <rect x="500" y="670" width="28" height="20" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                <text x="514" y="684" textAnchor="middle" fill="white">S04</text>
              </g>
            </g>
          )}

          {/* ================================================================= */}
          {/* I. DYNAMIC SIMULATION PARTICLES (When Egress Simulation is active) */}
          {/* ================================================================= */}
          {externalIsSimulating && (
            <g fill="#22c55e" opacity="0.85">
              {/* Particle flow around perimeter */}
              <circle cx="280" cy="82" r="4" className="animate-ping" />
              <circle cx="580" cy="82" r="5" />
              <circle cx="780" cy="82" r="4" />
              <circle cx="1080" cy="82" r="5" />

              {/* Particle flow through central concourse */}
              <circle cx="600" cy="400" r="4" />
              <circle cx="750" cy="400" r="5" className="animate-pulse" />
              <circle cx="1020" cy="400" r="4" />

              {/* Bottom road flow */}
              <circle cx="900" cy="768" r="5" />
              <circle cx="600" cy="768" r="4" />
              <circle cx="300" cy="768" r="5" className="animate-ping" />
            </g>
          )}
        </svg>

        {/* Selected Obstacle Deep Inspection Modal Card */}
        {selectedObstacle && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-96 z-30 bg-[#0d1527]/95 backdrop-blur-md rounded-2xl border-2 border-cyan-500/70 p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {selectedObstacle.category}
                </span>
                <span className="font-black text-white text-xs">{selectedObstacle.status}</span>
              </div>
              <button 
                onClick={() => setSelectedObstacle(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-black text-slate-100 text-sm">{selectedObstacle.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedObstacle.specs}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">CAD Dimensions:</span>
                <strong className="text-cyan-300">{selectedObstacle.dimensions}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Safety Capacity:</span>
                <strong className="text-emerald-400">{selectedObstacle.capacity || 'Engineered Pass'}</strong>
              </div>
            </div>

            <div className="bg-blue-950/40 border border-blue-800/60 p-2.5 rounded-xl text-[11px] text-blue-200">
              <strong className="text-blue-300 block font-bold mb-0.5">Crowd Safety Protocol:</strong>
              {selectedObstacle.safetyProtocol}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. FOOTER LEGEND & NFPA COMPLIANCE BENCHMARK */}
      {/* ========================================================================= */}
      <div className="bg-[#090e1c] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs border-t border-slate-800">
        
        {/* CAD Blueprint Legend Items */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold">
          <span className="text-slate-400 font-mono uppercase tracking-wider text-[10px]">
            CAD Layers:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-[#22c55e] bg-[#0d3822]"></span>
            <span className="text-slate-200">Major Stage (Green)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-[#f97316] bg-[#2c1706]"></span>
            <span className="text-slate-200">Side Stage (Orange)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-[#ef4444] bg-[#1c0e12]"></span>
            <span className="text-slate-200">Heavy-Duty Barricades</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-[#38bdf8] bg-[#0f172a]"></span>
            <span className="text-slate-200">Security Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#dc2626] text-white flex items-center justify-center text-[8px] font-black">✚</span>
            <span className="text-slate-200">Medical / First Aid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-[#0284c7] bg-[#061c28]"></span>
            <span className="text-slate-200">Water & Sanitation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0284c7] text-white text-[8px] font-mono flex items-center justify-center font-bold">S</span>
            <span className="text-slate-200">IoT LiDAR Counters</span>
          </div>
        </div>

        {/* Dynamic Obstacle Summary & Dimensions */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
          <span>Active Venue: <strong className="text-cyan-400">{cadMetrics.lenM}m × {cadMetrics.widM}m</strong></span>
          <span>•</span>
          <span>Obstacles: <strong className="text-emerald-400">{cadMetrics.penCount} Compartments</strong></span>
          <span>•</span>
          <span>NFPA 101: <strong className="text-emerald-400">PASSED ✓</strong></span>
        </div>
      </div>

    </div>
  );
};
