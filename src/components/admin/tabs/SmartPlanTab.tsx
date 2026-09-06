import React, { useState, useEffect } from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { VenuePlanInput, EventType } from '../../../types';
import { EventCrowdManagementLayoutPlan } from '../../layout/EventCrowdManagementLayoutPlan';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Shield, 
  Flame, 
  Crosshair, 
  Droplets, 
  Bath, 
  Cpu, 
  Eye, 
  EyeOff, 
  Compass, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  Users
} from 'lucide-react';

export const SmartPlanTab: React.FC = () => {
  const { 
    venuePlanInput, 
    setVenuePlanInput, 
    generatedLayout, 
    generateSmartLayout, 
    isGeneratingLayout, 
    layoutGenerationStep,
    isCrowdFlowSimulating,
    toggleCrowdFlowSimulation
  } = useCrowd();

  // Local UI filters for digital twin
  const [showFacilities, setShowFacilities] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showPathways, setShowPathways] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Dynamic simulation numbers for crowd flow demo
  const [simStep, setSimStep] = useState<number>(0);
  const [zoneAOccupancy, setZoneAOccupancy] = useState<number>(20);
  const [zoneCOccupancy, setZoneCOccupancy] = useState<number>(60);
  const [aiRecommendationTriggered, setAiRecommendationTriggered] = useState<boolean>(false);

  // Unit conversion helper
  const rawArea = venuePlanInput.length * venuePlanInput.width;
  const totalAreaSqFt = venuePlanInput.unit === 'sqft' ? rawArea : Math.round(rawArea * 10.7639);
  const totalAreaSqM = venuePlanInput.unit === 'sqm' ? rawArea : Math.round(rawArea / 10.7639);

  // Handle unit toggle with metric conversion
  const handleUnitToggle = (newUnit: 'sqft' | 'sqm') => {
    if (newUnit === venuePlanInput.unit) return;
    if (newUnit === 'sqm') {
      setVenuePlanInput(prev => ({
        ...prev,
        unit: 'sqm',
        length: Math.round(prev.length * 0.3048),
        width: Math.round(prev.width * 0.3048),
      }));
    } else {
      setVenuePlanInput(prev => ({
        ...prev,
        unit: 'sqft',
        length: Math.round(prev.length * 3.28084),
        width: Math.round(prev.width * 3.28084),
      }));
    }
  };

  // Handle area change from slider or presets inside EventCrowdManagementLayoutPlan
  const handleAreaChange = (newSqFt: number) => {
    const ratio = (venuePlanInput.length > 0 && venuePlanInput.width > 0)
      ? (venuePlanInput.length / venuePlanInput.width)
      : 2;

    const newWidthFt = Math.max(20, Math.round(Math.sqrt(newSqFt / ratio)));
    const newLengthFt = Math.max(20, Math.round(newWidthFt * ratio));

    setVenuePlanInput(prev => ({
      ...prev,
      length: prev.unit === 'sqft' ? newLengthFt : Math.round(newLengthFt * 0.3048),
      width: prev.unit === 'sqft' ? newWidthFt : Math.round(newWidthFt * 0.3048),
    }));
  };

  // Crowd flow simulation animation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCrowdFlowSimulating) {
      setSimStep(1);
      setZoneAOccupancy(20);
      setZoneCOccupancy(60);
      setAiRecommendationTriggered(false);

      timer = setTimeout(() => {
        setSimStep(2);
        setZoneAOccupancy(35);
        setZoneCOccupancy(75);

        timer = setTimeout(() => {
          setSimStep(3);
          setZoneAOccupancy(48);
          setZoneCOccupancy(89);
          setAiRecommendationTriggered(true);
        }, 2200);
      }, 1800);
    } else {
      setSimStep(0);
      setZoneAOccupancy(25);
      setZoneCOccupancy(40);
      setAiRecommendationTriggered(false);
    }
    return () => clearTimeout(timer);
  }, [isCrowdFlowSimulating]);

  const selectedZone = generatedLayout.zones.find(z => z.id === selectedZoneId);

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER EXPLANATION BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>⭐ MOST IMPORTANT FEATURE: SMART VENUE PLANNER</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white">
            Intelligent Pre-Event Layout & Crowd Capacity Engine
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Eliminate manual guesswork before large gatherings. Input dimensions and crowd criteria to generate an optimal zoning layout with calibrated sensor locations and crowd flow simulations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => generateSmartLayout()}
            disabled={isGeneratingLayout}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>{isGeneratingLayout ? 'Generating Plan...' : '✨ Generate Intelligent Layout'}</span>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: VENUE INPUT PANEL (4 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Venue Parameters & Configuration</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tailor dimensions, access points, and crowd constraints.
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                generateSmartLayout();
              }} 
              className="space-y-4 text-xs font-semibold"
            >
              {/* Section 1: Basic Information */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  1. Basic Information
                </span>

                <div className="space-y-1">
                  <label className="text-slate-700">Venue Name</label>
                  <input
                    type="text"
                    value={venuePlanInput.venueName}
                    onChange={(e) => setVenuePlanInput({ ...venuePlanInput, venueName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700">Event Name</label>
                  <input
                    type="text"
                    value={venuePlanInput.eventName}
                    onChange={(e) => setVenuePlanInput({ ...venuePlanInput, eventName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700">Event Type</label>
                  <select
                    value={venuePlanInput.eventType}
                    onChange={(e) => setVenuePlanInput({ ...venuePlanInput, eventType: e.target.value as EventType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold cursor-pointer focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="Pilgrimage & Religious Gathering">Pilgrimage & Religious Gathering</option>
                    <option value="Music Concert & Festival">Music Concert & Festival</option>
                    <option value="Sports Tournament">Sports Tournament</option>
                    <option value="Transit & Rail Terminal">Transit & Rail Terminal</option>
                    <option value="Exhibition & Trade Fair">Exhibition & Trade Fair</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Venue Dimensions & Unit Selector */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    2. Venue Dimensions
                  </span>
                  
                  {/* Unit Selector Toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleUnitToggle('sqft')}
                      className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all ${
                        venuePlanInput.unit === 'sqft' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Sq. Ft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnitToggle('sqm')}
                      className={`px-2 py-0.5 text-[10px] font-black rounded-md transition-all ${
                        venuePlanInput.unit === 'sqm' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Sq. Metres
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-slate-600 text-[11px]">Length ({venuePlanInput.unit})</label>
                    <input
                      type="number"
                      value={venuePlanInput.length}
                      onChange={(e) => setVenuePlanInput({ ...venuePlanInput, length: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 text-[11px]">Width ({venuePlanInput.unit})</label>
                    <input
                      type="number"
                      value={venuePlanInput.width}
                      onChange={(e) => setVenuePlanInput({ ...venuePlanInput, width: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-blue-900">
                  <span className="font-bold">Computed Total Area:</span>
                  <span className="font-black text-blue-700">{rawArea.toLocaleString()} {venuePlanInput.unit === 'sqft' ? 'sq.ft' : 'sq.m'}</span>
                </div>
              </div>

              {/* Section 3: Crowd Information */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  3. Crowd Information
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-slate-600 text-[11px]">Expected Crowd</label>
                    <input
                      type="number"
                      value={venuePlanInput.expectedCrowd}
                      onChange={(e) => setVenuePlanInput({ ...venuePlanInput, expectedCrowd: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 text-[11px]">Duration (Hours)</label>
                    <input
                      type="number"
                      value={venuePlanInput.eventDurationHours}
                      onChange={(e) => setVenuePlanInput({ ...venuePlanInput, eventDurationHours: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Venue Access & Configuration Terminology */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  4. Access & Facility Requirements
                </span>

                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">Number of Major Access Points</label>
                  <input
                    type="number"
                    value={venuePlanInput.accessPointsCount}
                    onChange={(e) => setVenuePlanInput({ ...venuePlanInput, accessPointsCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                    min="1"
                    max="12"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 text-[11px]">Primary Movement Destination</label>
                  <input
                    type="text"
                    value={venuePlanInput.destinationAreaName}
                    onChange={(e) => setVenuePlanInput({ ...venuePlanInput, destinationAreaName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-bold"
                  />
                </div>

                {/* Facilities Checklist */}
                <div className="space-y-2 pt-1">
                  {[
                    { key: 'hasEmergencyAccess', label: 'Emergency Access & Evacuation Routes' },
                    { key: 'hasMedicalPoint', label: 'First Aid & Medical Triage Points' },
                    { key: 'hasWaterPoint', label: 'Drinking Water Stations' },
                    { key: 'hasToilet', label: 'Public Sanitation / Toilets' },
                    { key: 'hasSecurityPoint', label: 'Security & Rapid Response Post' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={venuePlanInput[item.key as keyof VenuePlanInput] as boolean}
                        onChange={(e) => setVenuePlanInput({ ...venuePlanInput, [item.key]: e.target.checked })}
                        className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isGeneratingLayout}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{isGeneratingLayout ? 'Analysing & Generating Layout...' : '✨ Generate Intelligent Crowd Layout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ISOMETRIC EVENT CROWD MANAGEMENT LAYOUT PLAN (8 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Animated 6-Step Generation Overlay when generating */}
          {isGeneratingLayout && (
            <div className="w-full bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[280px]">
              {layoutGenerationStep === 1 && (
                <div className="w-full max-w-md bg-slate-900 rounded-2xl relative overflow-hidden border border-blue-500/40 p-5 flex flex-col justify-between space-y-4">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan shadow-[0_0_15px_#22d3ee]"></div>
                  <span className="text-xs font-mono text-cyan-400">STAGE 1/6 • SCANNING CANVAS</span>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto animate-pulse">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-black text-white">Analysing venue dimensions...</h4>
                    <p className="text-xs text-slate-400">Calibrating perimeter {venuePlanInput.length} × {venuePlanInput.width} {venuePlanInput.unit}</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-500 h-full w-1/6 transition-all duration-300"></div>
                  </div>
                </div>
              )}

              {layoutGenerationStep === 2 && (
                <div className="w-full max-w-md bg-slate-900 rounded-2xl relative overflow-hidden border border-blue-500/40 p-5 flex flex-col justify-between space-y-4">
                  <span className="text-xs font-mono text-blue-400">STAGE 2/6 • CROWD DENSITY</span>
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-400 animate-ping"></span>
                      <span className="w-4 h-4 rounded-full bg-indigo-400 animate-bounce"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    </div>
                    <h4 className="text-lg font-black text-white">Calculating expected crowd distribution...</h4>
                    <p className="text-xs text-slate-400">Simulating {venuePlanInput.expectedCrowd.toLocaleString()} attendees</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full w-2/6 transition-all duration-300"></div>
                  </div>
                </div>
              )}

              {layoutGenerationStep === 3 && (
                <div className="w-full max-w-md bg-slate-900 rounded-2xl relative overflow-hidden border border-indigo-500/40 p-5 flex flex-col justify-between space-y-4">
                  <span className="text-xs font-mono text-indigo-400">STAGE 3/6 • ZONING CALIBRATION</span>
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-400 border-dashed rounded-lg animate-spin"></div>
                    </div>
                    <h4 className="text-lg font-black text-white">Identifying optimal crowd zones...</h4>
                    <p className="text-xs text-slate-400">Dividing concourse into balanced capacity partitions</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full w-3/6 transition-all duration-300"></div>
                  </div>
                </div>
              )}

              {layoutGenerationStep === 4 && (
                <div className="w-full max-w-md bg-slate-900 rounded-2xl relative overflow-hidden border border-emerald-500/40 p-5 flex flex-col justify-between space-y-4">
                  <span className="text-xs font-mono text-emerald-400">STAGE 4/6 • PATHWAY ROUTING</span>
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3 text-emerald-400">
                      <ArrowRight className="w-5 h-5 animate-pulse" />
                      <ArrowRight className="w-6 h-6 animate-bounce" />
                      <ArrowRight className="w-5 h-5 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-black text-white">Optimising movement concourses...</h4>
                    <p className="text-xs text-slate-400">Synthesizing directional bypass corridors & access routes</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-4/6 transition-all duration-300"></div>
                  </div>
                </div>
              )}

              {layoutGenerationStep === 5 && (
                <div className="w-full max-w-md bg-slate-900 rounded-2xl relative overflow-hidden border border-amber-500/40 p-5 flex flex-col justify-between space-y-4">
                  <span className="text-xs font-mono text-amber-400">STAGE 5/6 • SAFETY PLACEMENT</span>
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <Flame className="w-5 h-5 text-red-400 animate-bounce" />
                      <Droplets className="w-5 h-5 text-blue-400 animate-pulse" />
                      <Cpu className="w-5 h-5 text-emerald-400 animate-bounce" />
                      <Shield className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-black text-white">Positioning safety and facility points...</h4>
                    <p className="text-xs text-slate-400">Placing emergency exits, medical bays & IoT sensors</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full w-5/6 transition-all duration-300"></div>
                  </div>
                </div>
              )}

              {layoutGenerationStep === 6 && (
                <div className="w-full max-w-md bg-slate-900 rounded-2xl relative overflow-hidden border border-emerald-500 p-5 flex flex-col justify-between text-center space-y-4">
                  <span className="text-xs font-mono text-emerald-400">STAGE 6/6 • COMPLETE</span>
                  <div className="space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                    <h4 className="text-xl font-black text-white">Crowd layout ready ✓</h4>
                    <p className="text-xs text-slate-300">Rendering high-fidelity architectural layout plan</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-full"></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ISOMETRIC EVENT CROWD MANAGEMENT LAYOUT PLAN (Dynamically scaled by square footage) */}
          <EventCrowdManagementLayoutPlan
            areaSqFt={totalAreaSqFt}
            onAreaChange={handleAreaChange}
            venueName={venuePlanInput.venueName}
            eventName={venuePlanInput.eventName}
            expectedCrowd={venuePlanInput.expectedCrowd}
            isSimulating={isCrowdFlowSimulating}
            onToggleSimulate={toggleCrowdFlowSimulation}
          />

          {/* CROWD MOVEMENT SIMULATION CONTROLLER */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>Interactive Concourse Flow Simulation Engine</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Simulates dynamic visitor influx through pathways, detects bottleneck choke points, and recalculates safe routing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleCrowdFlowSimulation}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
                  isCrowdFlowSimulating
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCrowdFlowSimulating ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Stop Simulation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>▶ Simulate Crowd Flow</span>
                  </>
                )}
              </button>
              </div>
            </div>

            {/* AI Recommendation Alert when Simulation Reaches Choke Point */}
            {aiRecommendationTriggered && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2 animate-bounce">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>AI Recommendation Generated Dynamically</span>
                  </span>
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-md">
                    ZONE C CHOKED AT 89%
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium">
                  <strong>Action:</strong> Automated bottleneck detected at Central Corridor. Green alternative route via <strong>Zone B West Bypass Lane</strong> highlighted for incoming visitors.
                </p>
              </div>
            )}

            {/* Selected Zone Inspector Drawer if user clicked a zone */}
            {selectedZone && (
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-black text-blue-800 uppercase block">{selectedZone.code} INSPECTION</span>
                  <h5 className="font-black text-slate-900 text-sm">{selectedZone.name}</h5>
                  <p className="text-slate-600">Capacity: {selectedZone.capacity} | Expected Influx: {selectedZone.expectedCrowd}</p>
                </div>
                <button
                  onClick={() => setSelectedZoneId(null)}
                  className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 self-start sm:self-auto"
                >
                  Close Inspector
                </button>
              </div>
            )}

        </div>

      </div>

    </div>
  );
};
