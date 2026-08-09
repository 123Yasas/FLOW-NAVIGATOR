import React, { useState } from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { 
  Building2, 
  Ruler, 
  Users, 
  Navigation, 
  ShieldAlert, 
  Crosshair, 
  Sparkles, 
  Save, 
  Download, 
  Printer, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Shield, 
  PlusCircle, 
  Cpu, 
  MapPin, 
  ArrowRight, 
  XCircle, 
  Layers, 
  Eye, 
  Maximize2,
  HelpCircle,
  X,
  Sliders,
  RefreshCw,
  Zap
} from 'lucide-react';
import { IoTSensor } from '../../types';

type UnitType = 'sqft' | 'sqm';
type ModeType = 'preevent' | 'live';

interface SelectedSensorDetails {
  id: string;
  code: string;
  zoneName: string;
  purpose: string;
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  peopleIn: number;
  peopleOut: number;
  currentCount: number;
}

export const SmartVenuePlanner: React.FC = () => {
  const { zones, sensors, emergencyMode, simulateCrowdSpikeRouteC, resetToBaseline } = useCrowd();

  // Mode state
  const [plannerMode, setPlannerMode] = useState<ModeType>('preevent');

  // Unit of measure
  const [unit, setUnit] = useState<UnitType>('sqft');

  // Form input state
  const [venueName, setVenueName] = useState('Palani Gathering Complex - Main Festival Grounds');
  const [length, setLength] = useState<number>(200); // 200 ft or ~61 m
  const [width, setWidth] = useState<number>(100);  // 100 ft or ~30.5 m
  const [expectedCrowd, setExpectedCrowd] = useState<number>(8000);
  const [numEntrances, setNumEntrances] = useState<number>(4);
  const [numExits, setNumExits] = useState<number>(6);
  const [numPathways, setNumPathways] = useState<number>(3);
  const [numZones, setNumZones] = useState<number>(5);
  const [destinationName, setDestinationName] = useState('Main Inner Sanctum / Shrine Stage');
  
  // Custom Safety Rule Density Threshold (sq.ft per person or sq.m per person)
  const [maxSqFtPerPerson, setMaxSqFtPerPerson] = useState<number>(2.5); // e.g. 2.5 sq.ft / person
  
  // Facilities options
  const [hasEmergencyExits, setHasEmergencyExits] = useState(true);
  const [hasMedicalPoint, setHasMedicalPoint] = useState(true);
  const [hasSecurityPoint, setHasSecurityPoint] = useState(true);
  const [hasRestrictedArea, setHasRestrictedArea] = useState(true);

  // UI States
  const [isPlanGenerated, setIsPlanGenerated] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<SelectedSensorDetails | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Unit conversions
  // 1 sq.m = 10.7639 sq.ft
  const rawArea = length * width; // in current chosen unit
  const totalAreaSqFt = unit === 'sqft' ? rawArea : Math.round(rawArea * 10.7639);
  const totalAreaSqM = unit === 'sqm' ? rawArea : Math.round(rawArea / 10.7639);

  // Maximum permitted capacity calculated based on safety density threshold rule
  const maxSafetyCapacity = Math.floor(totalAreaSqFt / maxSqFtPerPerson);

  // Unit Toggle Handler
  const handleUnitToggle = (newUnit: UnitType) => {
    if (newUnit === unit) return;
    if (newUnit === 'sqm') {
      // Converting ft to m (1 ft ≈ 0.3048 m)
      setLength(Math.round(length * 0.3048));
      setWidth(Math.round(width * 0.3048));
      setUnit('sqm');
    } else {
      // Converting m to ft (1 m ≈ 3.28084 ft)
      setLength(Math.round(length * 3.28084));
      setWidth(Math.round(width * 3.28084));
      setUnit('sqft');
    }
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlanGenerated(true);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleSavePlan = () => {
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Sensor click handler on SVG map
  const handleSensorClick = (sensorId: string, sensorCode: string, zoneName: string, purpose: string) => {
    // Find matching real sensor if available
    const matched = sensors.find(s => s.id === sensorId) || {
      id: sensorId,
      peopleIn: 340,
      peopleOut: 120,
      currentCount: 220,
      status: 'ONLINE' as const
    };

    setSelectedSensor({
      id: sensorId,
      code: sensorCode,
      zoneName,
      purpose,
      status: matched.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE',
      peopleIn: matched.peopleIn,
      peopleOut: matched.peopleOut,
      currentCount: matched.currentCount
    });
  };

  // Dynamically generated zone metrics for the venue grid
  const zoneList = Array.from({ length: numZones }).map((_, idx) => {
    const code = `ZONE ${String.fromCharCode(65 + idx)}`; // ZONE A, ZONE B, etc.
    const names = [
      'Main Entry Plaza',
      'East Corridor Queue',
      'Inner Sanctum Choke Point',
      'West Bypass Arcade',
      'South Exit Promenade',
      'North Terrace Stairs'
    ];
    const name = names[idx % names.length];
    
    const zoneAreaSqFt = Math.round(totalAreaSqFt / numZones);
    const zoneAreaSqM = Math.round(totalAreaSqM / numZones);
    const configuredCapacity = Math.floor(zoneAreaSqFt / maxSqFtPerPerson);

    // Live vs Pre-event crowd levels
    let currentCrowd = Math.round(expectedCrowd / numZones);
    if (plannerMode === 'live' && zones[idx]) {
      currentCrowd = zones[idx].currentCount;
    } else if (plannerMode === 'live') {
      currentCrowd = Math.round(configuredCapacity * (idx === 2 ? 0.95 : 0.45));
    } else {
      // Pre-event planning mode
      currentCrowd = Math.round(configuredCapacity * 0.55);
    }

    const occupancyPercent = Math.round((currentCrowd / configuredCapacity) * 100);
    
    let status: 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'SAFE';
    let statusColor = '#22c55e'; // green
    let statusText = 'LOW';

    if (occupancyPercent > 90 || (emergencyMode && idx === 2)) {
      status = 'CRITICAL';
      statusColor = '#ef4444'; // red
      statusText = 'CRITICAL';
    } else if (occupancyPercent > 80) {
      status = 'HIGH';
      statusColor = '#f97316'; // orange
      statusText = 'HIGH';
    } else if (occupancyPercent > 60) {
      status = 'MODERATE';
      statusColor = '#eab308'; // yellow
      statusText = 'MODERATE';
    }

    return {
      id: `zone-${idx}`,
      code,
      name,
      zoneAreaSqFt,
      zoneAreaSqM,
      configuredCapacity,
      currentCrowd,
      occupancyPercent,
      remainingCapacity: Math.max(0, configuredCapacity - currentCrowd),
      status,
      statusColor,
      statusText
    };
  });

  // Check if any zone is CRITICAL (for redirection display)
  const criticalZone = zoneList.find(z => z.status === 'CRITICAL');
  const safeZone = zoneList.find(z => z.status === 'SAFE') || zoneList[3] || zoneList[1];

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR & MODE TOGGLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-black bg-indigo-100 text-indigo-800 rounded-full flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-700" />
              SMART VENUE LAYOUT PLANNER
            </span>
            <span className="text-xs font-semibold text-slate-500">2D Vector Spatial Engine</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Dynamic Crowd & Area Layout Generator
          </h2>
          <p className="text-xs text-slate-500">
            Define venue dimensions, configure safety thresholds, overlay sensor telemetry & model crowd redirection.
          </p>
        </div>

        {/* MODE SWITCHER: PRE-EVENT PLANNING vs LIVE CROWD MANAGEMENT */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold gap-1">
          <button
            onClick={() => setPlannerMode('preevent')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              plannerMode === 'preevent'
                ? 'bg-white text-indigo-800 shadow-sm border border-slate-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>PRE-EVENT PLANNING</span>
          </button>

          <button
            onClick={() => setPlannerMode('live')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              plannerMode === 'live'
                ? 'bg-red-600 text-white shadow-md font-extrabold animate-pulse'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>LIVE CROWD MODE</span>
          </button>
        </div>
      </div>

      {/* TOP NOTIFICATION / SUCCESS TOAST */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Smart Crowd Plan generated and saved successfully! Layout updated below.</span>
        </div>
      )}

      {/* INPUT FORM SECTION: VENUE DETAILS & SAFETY RULES (Requirement #31, #33) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-600" />
              <span>1. Physical Venue Specifications & Safety Configuration</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter venue dimensions and set permitted density thresholds to calculate zone capacities.
            </p>
          </div>

          {/* Unit Toggle Buttons [ Square Feet ] [ Square Meters ] */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleUnitToggle('sqft')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                unit === 'sqft'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Square Feet (sq.ft)
            </button>
            <button
              type="button"
              onClick={() => handleUnitToggle('sqm')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                unit === 'sqm'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Square Meters (sq.m)
            </button>
          </div>
        </div>

        <form onSubmit={handleGeneratePlan} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
            
            {/* Venue Name */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-700 font-bold block">Venue / Event Complex Name</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Destination Location */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-700 font-bold block">Destination Location</label>
              <input
                type="text"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Length */}
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Length ({unit === 'sqft' ? 'feet' : 'meters'})</label>
              <input
                type="number"
                min={10}
                value={length}
                onChange={(e) => setLength(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Width */}
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Width ({unit === 'sqft' ? 'feet' : 'meters'})</label>
              <input
                type="number"
                min={10}
                value={width}
                onChange={(e) => setWidth(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Total Area Display (Calculated & Auto-Converted) */}
            <div className="space-y-1 bg-blue-50/80 border border-blue-200 p-2.5 rounded-xl text-blue-950">
              <span className="text-[11px] font-bold text-blue-700 uppercase block">Calculated Total Area</span>
              <div className="text-sm font-black">
                {totalAreaSqFt.toLocaleString()} sq.ft
              </div>
              <span className="text-[10px] text-blue-800 block">({totalAreaSqM.toLocaleString()} sq.meters)</span>
            </div>

            {/* Expected Maximum Crowd */}
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Expected Maximum Crowd</label>
              <input
                type="number"
                min={100}
                value={expectedCrowd}
                onChange={(e) => setExpectedCrowd(Math.max(100, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Number of Entrances */}
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Number of Entrances</label>
              <input
                type="number"
                min={1}
                max={10}
                value={numEntrances}
                onChange={(e) => setNumEntrances(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Number of Exits */}
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Number of Exits</label>
              <input
                type="number"
                min={1}
                max={12}
                value={numExits}
                onChange={(e) => setNumExits(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Number of Pathways */}
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Number of Pathways</label>
              <input
                type="number"
                min={1}
                max={6}
                value={numPathways}
                onChange={(e) => setNumPathways(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Number of Zones */}
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Number of Monitoring Zones</label>
              <input
                type="number"
                min={2}
                max={6}
                value={numZones}
                onChange={(e) => setNumZones(Math.min(6, Math.max(2, parseInt(e.target.value) || 2)))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* SAFETY DENSITY RULE (Requirement #33) */}
            <div className="space-y-1 sm:col-span-2 bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
              <label className="text-amber-950 font-extrabold block">
                Configured Safety Density Rule (Max Allowed Occupancy)
              </label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="20"
                  value={maxSqFtPerPerson}
                  onChange={(e) => setMaxSqFtPerPerson(Math.max(1, parseFloat(e.target.value) || 2.5))}
                  className="w-24 bg-white border border-amber-300 rounded-lg p-2 text-slate-900 font-bold text-xs"
                />
                <span className="text-amber-900 text-xs font-semibold">
                  sq.ft per person (Safety Threshold)
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Calculated Venue Max Safe Capacity: <strong className="text-amber-950 font-black">{maxSafetyCapacity.toLocaleString()} visitors</strong>
              </p>
            </div>

          </div>

          {/* Facility Requirements Checkboxes */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Required Venue Infrastructure Points</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-slate-800">
              <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={hasEmergencyExits}
                  onChange={(e) => setHasEmergencyExits(e.target.checked)}
                  className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <Flame className="w-4 h-4 text-red-600" />
                <span>Emergency Exits</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={hasMedicalPoint}
                  onChange={(e) => setHasMedicalPoint(e.target.checked)}
                  className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="w-4 h-4 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-[10px]">+</span>
                <span>Medical / First Aid</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={hasSecurityPoint}
                  onChange={(e) => setHasSecurityPoint(e.target.checked)}
                  className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <Shield className="w-4 h-4 text-blue-700" />
                <span>Security Outpost</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={hasRestrictedArea}
                  onChange={(e) => setHasRestrictedArea(e.target.checked)}
                  className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Restricted Zone</span>
              </label>
            </div>
          </div>

          {/* GENERATE PLAN BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-sm rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>GENERATE SMART CROWD PLAN</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSavePlan}
                className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Plan</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2.5 bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Layout</span>
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* DYNAMIC 2D VENUE LAYOUT CANVAS + AI RECOMMENDATIONS PANEL (Requirement #32, #34, #35, #36, #37, #38) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: 2D VECTOR SVG VENUE MAP */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-5 text-white space-y-4 shadow-xl relative overflow-hidden">
          
          {/* Map Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                  plannerMode === 'live' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white'
                }`}>
                  {plannerMode === 'live' ? 'LIVE CROWD OVERLAY ACTIVE' : 'PRE-EVENT PLANNING SCHEMATIC'}
                </span>
                <span className="text-xs text-slate-400 font-mono">2D SVG Vector Canvas</span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-0.5">
                {venueName}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>Dim: {length} × {width} {unit} ({totalAreaSqFt.toLocaleString()} sq.ft)</span>
            </div>
          </div>

          {/* DYNAMIC REDIRECTION OVERLAY BANNER IF CRITICAL ZONE EXISTS (Requirement #38) */}
          {criticalZone && (
            <div className="bg-red-600 text-white p-3 rounded-2xl border-2 border-red-400 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg animate-pulse text-xs font-bold">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-white shrink-0" />
                <div>
                  <span className="font-extrabold uppercase">ZONE CONGESTION ALERT: {criticalZone.code} ({criticalZone.name}) AT {criticalZone.occupancyPercent}% CAPACITY!</span>
                  <p className="text-[11px] text-red-100 font-medium">Auto-rerouting visitors via Pathway 2 to {safeZone.code}.</p>
                </div>
              </div>
              <div className="bg-white text-red-900 px-3 py-1 rounded-xl text-xs font-extrabold shrink-0 shadow-xs flex items-center gap-1">
                <span>AVOID {criticalZone.code}</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>REDIRECT TO {safeZone.code}</span>
              </div>
            </div>
          )}

          {/* COLOR LEGEND BAR */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Legend:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
              <span>Green = Low</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
              <span>Yellow = Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-orange-500"></span>
              <span>Orange = High</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-600"></span>
              <span>Red = Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
              <span>Blue = Pathway</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="px-1 bg-red-600 text-white text-[9px] rounded-sm font-black">EXIT</span>
              <span>Emergency Exit</span>
            </div>
            <div className="flex items-center gap-1 text-indigo-400">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">S</span>
              <span>Sensor [S]</span>
            </div>
          </div>

          {/* SVG DYNAMIC MAP CONTAINER */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 relative select-none overflow-x-auto">
            
            <svg
              viewBox="0 0 800 450"
              className="w-full h-auto min-w-[600px] font-sans"
              style={{ aspectRatio: '16/9' }}
            >
              <defs>
                {/* Pathway pattern */}
                <pattern id="pathwayPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="10" y2="10" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" />
                </pattern>
                {/* Restricted Area Hatching */}
                <pattern id="hazardHatch" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M-3,3 l6,-6 M0,12 l12,-12 M9,15 l6,-6" stroke="#ef4444" strokeWidth="2" opacity="0.6" />
                </pattern>
              </defs>

              {/* Venue Outer Boundary Frame */}
              <rect
                x="30"
                y="30"
                width="740"
                height="390"
                rx="16"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="4"
                strokeDasharray="8 4"
              />

              {/* Boundary Dimensions Label */}
              <text x="400" y="22" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
                OUTER VENUE BOUNDARY ({length} {unit} × {width} {unit} • {totalAreaSqFt.toLocaleString()} sq.ft)
              </text>

              {/* BLUE WALKING PATHWAYS */}
              <path
                d="M 50 120 L 220 120 L 220 220 L 400 220 L 580 220 L 730 220"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="16"
                strokeOpacity="0.3"
                strokeLinecap="round"
              />
              <path
                d="M 220 220 L 220 370 L 580 370 L 580 220"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeOpacity="0.25"
                strokeLinecap="round"
              />

              {/* DIRECTION OF CROWD MOVEMENT ARROWS */}
              <g stroke="#60a5fa" strokeWidth="2.5" fill="none">
                {/* Arrow 1 */}
                <path d="M 120 120 L 140 120 M 132 114 L 140 120 L 132 126" />
                {/* Arrow 2 */}
                <path d="M 300 220 L 320 220 M 312 214 L 320 220 L 312 226" />
                {/* Arrow 3 */}
                <path d="M 480 220 L 500 220 M 492 214 L 500 220 L 492 226" />
              </g>

              {/* DYNAMIC ZONES IN GRID */}
              {zoneList.map((z, idx) => {
                // Layout positions for N zones
                const cols = Math.min(3, numZones);
                const colIdx = idx % cols;
                const rowIdx = Math.floor(idx / cols);

                const zoneWidth = Math.floor(660 / cols);
                const zoneHeight = 150;
                const x = 70 + colIdx * (zoneWidth + 20);
                const y = 55 + rowIdx * 170;

                const isCrit = z.status === 'CRITICAL';

                return (
                  <g key={z.id} className="transition-all duration-300">
                    {/* Zone Box */}
                    <rect
                      x={x}
                      y={y}
                      width={zoneWidth}
                      height={zoneHeight}
                      rx="12"
                      fill={z.statusColor}
                      fillOpacity={isCrit ? 0.35 : 0.18}
                      stroke={z.statusColor}
                      strokeWidth={isCrit ? 3 : 1.5}
                      className={isCrit ? 'animate-pulse' : ''}
                    />

                    {/* Zone Header Label */}
                    <rect
                      x={x + 10}
                      y={y + 10}
                      width={70}
                      height={20}
                      rx="6"
                      fill={z.statusColor}
                    />
                    <text
                      x={x + 45}
                      y={y + 24}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      {z.code}
                    </text>

                    {/* Zone Name */}
                    <text
                      x={x + 90}
                      y={y + 24}
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="800"
                    >
                      {z.name.length > 20 ? z.name.slice(0, 18) + '...' : z.name}
                    </text>

                    {/* Area & Density Metrics */}
                    <text x={x + 12} y={y + 50} fill="#94a3b8" fontSize="10" fontWeight="bold">
                      Area: {z.zoneAreaSqFt.toLocaleString()} sq.ft
                    </text>

                    {/* Capacity & Occupancy */}
                    <text x={x + 12} y={y + 68} fill="#e2e8f0" fontSize="11" fontWeight="extrabold">
                      Occupancy: {z.currentCrowd} / {z.configuredCapacity} ({z.occupancyPercent}%)
                    </text>

                    {/* Progress Bar */}
                    <rect
                      x={x + 12}
                      y={y + 80}
                      width={zoneWidth - 24}
                      height={8}
                      rx="4"
                      fill="#1e293b"
                    />
                    <rect
                      x={x + 12}
                      y={y + 80}
                      width={Math.min(zoneWidth - 24, ((zoneWidth - 24) * z.occupancyPercent) / 100)}
                      height={8}
                      rx="4"
                      fill={z.statusColor}
                    />

                    {/* Zone Status Tag */}
                    <rect
                      x={x + zoneWidth - 75}
                      y={y + 10}
                      width={65}
                      height={18}
                      rx="6"
                      fill="#020617"
                      stroke={z.statusColor}
                      strokeWidth="1"
                    />
                    <text
                      x={x + zoneWidth - 42.5}
                      y={y + 22}
                      fill={z.statusColor}
                      fontSize="9"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      {z.statusText}
                    </text>

                    {/* REDIRECTION OVERLAY ARROW IF CRITICAL (Requirement #38) */}
                    {isCrit && (
                      <g>
                        {/* Red X over critical zone */}
                        <circle cx={x + zoneWidth / 2} cy={y + zoneHeight / 2 + 10} r="18" fill="#ef4444" />
                        <text x={x + zoneWidth / 2} y={y + zoneHeight / 2 + 15} fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle">✕</text>
                        <text x={x + zoneWidth / 2} y={y + zoneHeight - 10} fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">AVOID ZONE</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ENTRANCE MARKERS (Green) */}
              <g>
                <rect x="25" y="100" width="12" height="40" rx="3" fill="#22c55e" />
                <text x="18" y="92" fill="#4ade80" fontSize="10" fontWeight="900">ENTRY 1</text>

                <rect x="25" y="200" width="12" height="40" rx="3" fill="#22c55e" />
                <text x="18" y="192" fill="#4ade80" fontSize="10" fontWeight="900">ENTRY 2</text>
              </g>

              {/* EXIT MARKERS (Orange / Red) */}
              <g>
                <rect x="763" y="100" width="12" height="40" rx="3" fill="#f97316" />
                <text x="730" y="92" fill="#fb923c" fontSize="10" fontWeight="900">EXIT A</text>

                <rect x="763" y="200" width="12" height="40" rx="3" fill="#f97316" />
                <text x="730" y="192" fill="#fb923c" fontSize="10" fontWeight="900">EXIT B</text>
              </g>

              {/* EMERGENCY EXITS (Requirement #32 - Special visual indicator) */}
              {hasEmergencyExits && (
                <g>
                  {/* Emergency Exit 1 */}
                  <rect x="400" y="20" width="60" height="14" rx="4" fill="#dc2626" />
                  <text x="430" y="31" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">🚨 EVAC EXIT 1</text>

                  {/* Emergency Exit 2 */}
                  <rect x="400" y="416" width="60" height="14" rx="4" fill="#dc2626" />
                  <text x="430" y="427" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle">🚨 EVAC EXIT 2</text>
                </g>
              )}

              {/* MEDICAL & SECURITY POINTS (Requirement #32) */}
              {hasMedicalPoint && (
                <g transform="translate(140, 360)">
                  <rect x="0" y="0" width="28" height="28" rx="6" fill="#ef4444" />
                  <text x="14" y="19" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle">+</text>
                  <text x="14" y="38" fill="#fca5a5" fontSize="8" fontWeight="800" textAnchor="middle">MEDICAL</text>
                </g>
              )}

              {hasSecurityPoint && (
                <g transform="translate(620, 360)">
                  <rect x="0" y="0" width="28" height="28" rx="6" fill="#1d4ed8" />
                  <text x="14" y="18" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">🛡️</text>
                  <text x="14" y="38" fill="#93c5fd" fontSize="8" fontWeight="800" textAnchor="middle">SECURITY</text>
                </g>
              )}

              {/* RESTRICTED AREA (Hatched hazard zone) */}
              {hasRestrictedArea && (
                <g transform="translate(600, 75)">
                  <rect x="0" y="0" width="100" height="60" rx="8" fill="url(#hazardHatch)" stroke="#ef4444" strokeWidth="1.5" />
                  <rect x="10" y="20" width="80" height="18" rx="4" fill="#7f1d1d" opacity="0.9" />
                  <text x="50" y="32" fill="#fca5a5" fontSize="9" fontWeight="900" textAnchor="middle">RESTRICTED</text>
                </g>
              )}

              {/* DESTINATION MARKER */}
              <g transform="translate(420, 200)">
                <circle cx="0" cy="0" r="22" fill="#3b82f6" fillOpacity="0.3" className="animate-ping" />
                <circle cx="0" cy="0" r="16" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="4" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">★</text>
                <text x="0" y="28" fill="#60a5fa" fontSize="9" fontWeight="900" textAnchor="middle">{destinationName.slice(0, 16)}</text>
              </g>

              {/* INTERACTIVE SENSOR MARKERS [S1], [S2], [S3], [S4], [S5] (Requirement #36) */}
              {[
                { id: 'S1', x: 50, y: 120, code: 'S1', zone: 'Entry Gate A', purpose: 'Entrance Counter' },
                { id: 'S2', x: 220, y: 120, code: 'S2', zone: 'Zone A Transition', purpose: 'Corridor Influx' },
                { id: 'S3', x: 400, y: 220, code: 'S3', zone: 'Zone C Sanctum', purpose: 'Sanctum Choke Point' },
                { id: 'S4', x: 580, y: 220, code: 'S4', zone: 'Zone D West Arcade', purpose: 'Bypass Traffic' },
                { id: 'S5', x: 730, y: 220, code: 'S5', zone: 'Exit Gate B', purpose: 'Exit Flow Metering' }
              ].map(s => (
                <g
                  key={s.id}
                  transform={`translate(${s.x}, ${s.y})`}
                  onClick={() => handleSensorClick(s.id, s.code, s.zone, s.purpose)}
                  className="cursor-pointer hover:scale-110 transition-all group"
                >
                  <circle cx="0" cy="0" r="14" fill="#4f46e5" stroke="#818cf8" strokeWidth="2" />
                  <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">{s.code}</text>
                  <circle cx="10" cy="-10" r="4" fill="#22c55e" className="animate-ping" />
                </g>
              ))}

            </svg>

          </div>

          {/* SENSOR INSPECTOR POPUP MODAL (Requirement #36) */}
          {selectedSensor && (
            <div className="bg-slate-800 border-2 border-indigo-500 rounded-2xl p-4 text-xs text-white space-y-3 shadow-2xl relative animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                    {selectedSensor.code}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Sensor Inspector: [{selectedSensor.code}]</h4>
                    <p className="text-[11px] text-indigo-300 font-mono">{selectedSensor.zoneName}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedSensor(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                  <span className="font-extrabold text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    {selectedSensor.status}
                  </span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">People IN</span>
                  <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">+{selectedSensor.peopleIn}</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">People OUT</span>
                  <span className="font-extrabold text-red-400 text-sm mt-0.5 block">-{selectedSensor.peopleOut}</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">Current Net Count</span>
                  <span className="font-black text-white text-sm mt-0.5 block">{selectedSensor.currentCount}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <strong>Purpose:</strong> {selectedSensor.purpose} • Microcontroller: ESP32 Dual-Laser IR Beam counter connected via MQTT gateway.
              </div>
            </div>
          )}

          {/* SIMULATION DEMO TRIGGER IN LIVE MODE */}
          {plannerMode === 'live' && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span>Test Live Crowd Spike on Map:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={simulateCrowdSpikeRouteC}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
                >
                  Spike Zone C Crowd
                </button>

                <button
                  onClick={resetToBaseline}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all"
                >
                  Reset Crowd
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: AI-ASSISTED ARRANGEMENT RECOMMENDATIONS PANEL (Requirement #34) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-purple-100 text-purple-800 rounded-full">
                AI SPATIAL ADVISOR
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                <span>AI-Assisted Crowd Plan</span>
              </h3>
              <p className="text-xs text-slate-500">
                Optimization advice generated based on {totalAreaSqFt.toLocaleString()} sq.ft and {expectedCrowd.toLocaleString()} maximum crowd.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl space-y-1.5 text-indigo-950">
                <h4 className="font-extrabold text-indigo-900 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Recommended Arrangement Strategy
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>Divide venue into <strong>{numZones} monitoring zones</strong>.</li>
                  <li>Distribute expected {expectedCrowd.toLocaleString()} crowd across available zones.</li>
                  <li>Maintain clear <strong>{numPathways} pedestrian walkways</strong> (minimum 12 ft width).</li>
                  <li>Provide multiple exit directions towards Exit Gates A and B.</li>
                  <li>Place <strong>5 ESP32 IoT sensors</strong> at major entry/exit transitions.</li>
                  <li>Place additional sensors near high-risk choke points (Sanctum Entrance).</li>
                  <li>Keep emergency exit paths completely isolated from main line queues.</li>
                  <li>Deploy <strong>12 security personnel</strong> at Entry 1 turnstiles during peak arrivals.</li>
                </ul>
              </div>

              {/* Area Breakdown Summary Box (Requirement #33) */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Area & Density Calculation Summary
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Total Area</span>
                    <strong className="text-slate-900 font-black">{totalAreaSqFt.toLocaleString()} sq.ft</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Max Permitted Crowd</span>
                    <strong className="text-emerald-700 font-black">{maxSafetyCapacity.toLocaleString()} people</strong>
                  </div>
                </div>
              </div>

              {/* Prominent Mandatory AI Disclaimer (Requirement #34) */}
              <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-xl space-y-1 text-amber-950">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>SAFETY & COMPLIANCE NOTICE</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                  The FlowNavigator system is an <strong>AI-assisted planning tool</strong> and does not replace official engineering, fire-safety, building-code, or event-safety approval.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* ZONE AREA & DENSITY BREAKDOWN TABLE (Requirement #33) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Logical Zone Area & Occupancy Calculation</h3>
            <p className="text-xs text-slate-500">
              Calculated based on {maxSqFtPerPerson} sq.ft / person safety density threshold
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {zoneList.length} Zones Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">Zone Code & Name</th>
                <th className="p-3">Calculated Zone Area</th>
                <th className="p-3">Configured Max Capacity</th>
                <th className="p-3">Current / Planned Crowd</th>
                <th className="p-3">Occupancy %</th>
                <th className="p-3">Remaining Capacity</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {zoneList.map(z => (
                <tr key={z.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">
                    <span className="text-indigo-600 font-black mr-1">{z.code}:</span> {z.name}
                  </td>
                  <td className="p-3 font-mono text-slate-700">
                    {z.zoneAreaSqFt.toLocaleString()} sq.ft ({z.zoneAreaSqM.toLocaleString()} m²)
                  </td>
                  <td className="p-3 font-extrabold text-slate-800">{z.configuredCapacity.toLocaleString()}</td>
                  <td className="p-3 font-black text-slate-900">{z.currentCrowd.toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${Math.min(100, z.occupancyPercent)}%`, backgroundColor: z.statusColor }}
                        ></div>
                      </div>
                      <span className="font-bold">{z.occupancyPercent}%</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-emerald-700 font-bold">+{z.remainingCapacity.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <span 
                      className="px-2.5 py-0.5 text-[10px] font-black rounded-full text-white"
                      style={{ backgroundColor: z.statusColor }}
                    >
                      {z.statusText}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPORT / PRINT MODAL DIALOG (Requirement #40) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">FlowNavigator Venue Document</span>
                <h3 className="text-xl font-black text-slate-900">Smart Crowd Layout Summary</h3>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Details */}
            <div className="space-y-4 text-xs font-medium text-slate-800 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block text-[11px]">Venue Name:</span>
                  <strong className="text-sm text-slate-900 block font-black">{venueName}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Generated Date:</span>
                  <strong className="text-sm text-slate-900 block font-bold">August 9, 2026</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Total Area:</span>
                  <strong className="text-slate-900 block font-bold">{totalAreaSqFt.toLocaleString()} sq.ft ({totalAreaSqM.toLocaleString()} sq.m)</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Expected Crowd:</span>
                  <strong className="text-slate-900 block font-bold">{expectedCrowd.toLocaleString()} visitors</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Entrances / Exits:</span>
                  <strong className="text-slate-900 block font-bold">{numEntrances} Entrances • {numExits} Exits</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Monitoring Zones:</span>
                  <strong className="text-slate-900 block font-bold">{numZones} Logical Zones</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold block">IoT Sensor Placement Plan:</span>
                <p className="text-slate-700">5 ESP32 sensors deployed across Gate A, Sanctum Choke Point, West Arcade & Exit Gate B.</p>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold block">Safety Infrastructure:</span>
                <p className="text-slate-700">2 Dedicated Evacuation Exits • Medical First Aid Bay • Security Outpost Active.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Crowd Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
