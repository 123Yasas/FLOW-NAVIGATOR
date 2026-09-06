import React, { useState } from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  Clock, 
  Footprints, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  ArrowRight, 
  Crosshair, 
  LifeBuoy, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export const CitizenView: React.FC = () => {
  const { 
    zones, 
    routes, 
    selectedLocation, 
    emergencyMode, 
    toggleEmergencyMode,
    selectedStartZone,
    setSelectedStartZone,
    selectedDestinationZone,
    setSelectedDestinationZone,
    getBestRouteForDestination,
    notifications,
    setRole
  } = useCrowd();

  const [hasCalculatedRoute, setHasCalculatedRoute] = useState<boolean>(true);
  const [voiceSpoken, setVoiceSpoken] = useState<boolean>(false);

  // Determine overall venue status
  const totalOccupancy = Math.round(
    (zones.reduce((sum, z) => sum + z.currentCount, 0) / Math.max(1, zones.reduce((sum, z) => sum + z.capacity, 0))) * 100
  );

  const overallStatusText = totalOccupancy > 80 
    ? 'HIGH CROWD' 
    : totalOccupancy > 55 
    ? 'MODERATE CROWD' 
    : 'LOW CROWD';

  const overallStatusColor = totalOccupancy > 80 
    ? 'bg-red-100 text-red-800 border-red-300' 
    : totalOccupancy > 55 
    ? 'bg-amber-100 text-amber-900 border-amber-300' 
    : 'bg-emerald-100 text-emerald-800 border-emerald-300';

  // Dynamic route recommendations
  const { recommended, alternatives, avoid } = getBestRouteForDestination(selectedDestinationZone);

  // Destination and Start objects
  const startZoneObj = zones.find(z => z.id === selectedStartZone) || zones[0];
  const destZoneObj = zones.find(z => z.id === selectedDestinationZone) || zones[2];

  // Text to speech for accessibility
  const handleVoiceGuidance = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `Recommended path: Take ${recommended.name}. Walking distance is 400 meters with an estimated waiting time of ${recommended.estimatedWaitMinutes} minutes. Zone C is congested.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      setVoiceSpoken(true);
      setTimeout(() => setVoiceSpoken(false), 4000);
    }
  };

  // Helper for citizen zone badge
  const getCitizenZoneBadge = (status: string) => {
    switch (status) {
      case 'SAFE':
        return { label: '🟢 Low Crowd', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'MODERATE':
        return { label: '🟡 Moderate Crowd', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'HIGH':
        return { label: '🟠 High Crowd', color: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'CRITICAL':
        return { label: '🔴 Avoid / Heavy', color: 'bg-red-50 text-red-800 border-red-300 animate-pulse' };
      default:
        return { label: '🟢 Normal', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // =========================================================================
  // 🚨 SPECIAL EMERGENCY MODE SCREEN (INSTANT RADICAL SIMPLIFICATION)
  // =========================================================================
  if (emergencyMode) {
    return (
      <div className="min-h-[85vh] bg-red-600 text-white p-4 sm:p-8 flex flex-col justify-between max-w-xl mx-auto rounded-3xl my-6 shadow-2xl space-y-6">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/20 text-white flex items-center justify-center mx-auto animate-bounce">
            <Flame className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">
            🚨 EMERGENCY EVACUATION ACTIVE
          </h2>
          <p className="text-sm text-red-100 font-medium">
            Please remain calm. Avoid Zone C and the North corridor. Follow staff directions to the nearest clear exit.
          </p>
        </div>

        {/* Highlighted Recommended Evacuation Path */}
        <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              ✓ SAFEST EVACUATION PATH
            </span>
            <span className="text-xs font-black text-slate-500">Wait: 2 mins</span>
          </div>

          <h3 className="text-xl font-black text-slate-900">
            South Evacuation Bypass (Route D)
          </h3>
          <p className="text-xs text-slate-600">
            Proceed straight through the South Bypass Walkway towards Parking Lot Gates 5 & 6.
          </p>

          <div className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-sm text-center shadow-md flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4 fill-white" />
            <span>Follow Green Evacuation Path</span>
          </div>
        </div>

        {/* 3 LARGE EMERGENCY TOUCH BUTTONS */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => alert('Nearest Safe Exit: South Exit Gate 4 (120 meters straight ahead).')}
            className="p-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-center space-y-1 font-bold text-xs cursor-pointer"
          >
            <ArrowRight className="w-6 h-6 mx-auto mb-1" />
            <span className="block">Nearest Safe Exit</span>
          </button>

          <button 
            onClick={() => alert('Medical Bay alerted! Emergency responders dispatched to your sector.')}
            className="p-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-center space-y-1 font-bold text-xs cursor-pointer"
          >
            <Crosshair className="w-6 h-6 mx-auto mb-1" />
            <span className="block">Medical Help</span>
          </button>

          <button 
            onClick={() => alert('Emergency Assistance: Call 108 or report to Security Post near Gate 2.')}
            className="p-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-center space-y-1 font-bold text-xs cursor-pointer"
          >
            <LifeBuoy className="w-6 h-6 mx-auto mb-1" />
            <span className="block">Help Point</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => toggleEmergencyMode(false)}
            className="text-xs text-white/80 hover:text-white underline cursor-pointer"
          >
            (Authority testing: Clear Emergency Mode)
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // NORMAL CITIZEN / VISITOR VIEW
  // =========================================================================
  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 pb-24 font-sans">
      
      {/* 1. CITIZEN HOME: OVERALL VENUE STATUS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {selectedLocation.name}
            </span>
          </div>

          <button
            onClick={handleVoiceGuidance}
            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="Spoken route instructions"
          >
            {voiceSpoken ? <Volume2 className="w-3.5 h-3.5 text-blue-600 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voiceSpoken ? 'Speaking...' : 'Audio Voice'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs text-slate-400 font-bold block">Current Venue Status:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${overallStatusColor}`}>
                {overallStatusText}
              </span>
              <span className="text-sm font-black text-slate-800">
                {totalOccupancy}% Occupancy
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold block">Active Routes:</span>
            <span className="text-xs font-black text-emerald-600">3 Lanes Clear</span>
          </div>
        </div>
      </div>

      {/* 2. CITIZEN ALERTS (IF ANY BOTTLENECK ACTIVE) */}
      {avoid.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>🔴 High crowd detected near {avoid[0].name.replace('Route', 'Zone')}</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md">
              Safer Lane Available
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium">
            🧭 Safer alternative route recommended below to bypass inner queue delays.
          </p>
        </div>
      )}

      {/* 3. SIMPLIFIED LIVE CROWD MAP */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Live Crowd Map</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-bold">Updated live</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {zones.slice(0, 4).map((zone) => {
            const badge = getCitizenZoneBadge(zone.status);

            return (
              <div 
                key={zone.id}
                className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase">{zone.code}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 truncate">{zone.name}</h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. WHERE DO YOU WANT TO GO? (PROMINENT DESTINATION SELECTOR) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900">
            Where do you want to go?
          </h3>
          <p className="text-xs text-slate-500">
            Select your starting point and destination to find the fastest, safest route.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Current Location</span>
            </label>
            <select
              value={selectedStartZone}
              onChange={(e) => setSelectedStartZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:outline-hidden"
            >
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-600" />
              <span>Destination Area</span>
            </label>
            <select
              value={selectedDestinationZone}
              onChange={(e) => setSelectedDestinationZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:outline-hidden"
            >
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setHasCalculatedRoute(true)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4 fill-white" />
            <span>🧭 Find Safer Route</span>
          </button>
        </div>
      </div>

      {/* 5. ROUTE RESULT WITH "WHY THIS ROUTE?" EXPLAINABLE JUSTIFICATION */}
      {hasCalculatedRoute && recommended && (
        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white rounded-3xl p-5 border-2 border-emerald-300 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-black shadow-2xs">
              ✓ RECOMMENDED ROUTE
            </span>
            <span className="text-xs font-bold text-emerald-800">
              🟢 Optimal Flow
            </span>
          </div>

          <div>
            <h4 className="text-xl font-black text-slate-900">{recommended.name}</h4>
            
            {/* Simple Step-by-Step Path */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-2 flex-wrap">
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg">{startZoneObj.name}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg">South Bypass Lane</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              <span className="px-2 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-black">{destZoneObj.name}</span>
            </div>
          </div>

          {/* Quick Metrics Bar: Walking Distance, Est Wait Time, Crowd */}
          <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-200/90 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Walking Distance</span>
              <strong className="text-slate-900 text-sm font-black">400 m</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Est. Wait</span>
              <strong className="text-slate-900 text-sm font-black">{recommended.estimatedWaitMinutes} min</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Crowd Condition</span>
              <strong className="text-emerald-600 text-sm font-black">Clear (34%)</strong>
            </div>
          </div>

          {/* Explainable AI: "Why this route?" */}
          <div className="bg-emerald-100/70 border border-emerald-200 rounded-2xl p-3.5 text-xs space-y-1 text-emerald-950">
            <span className="font-black text-emerald-900 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-700" />
              <span>Why this route?</span>
            </span>
            <p className="font-medium text-emerald-900 leading-snug">
              This route currently has lower crowd density and avoids Zone C, which is experiencing high congestion.
            </p>
          </div>
        </div>
      )}

      {/* Emergency Mode Quick Entry */}
      <div className="pt-2 text-center">
        <button
          onClick={() => toggleEmergencyMode(true)}
          className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl border border-red-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Flame className="w-4 h-4 text-red-600" />
          <span>Test Emergency Mode Screen</span>
        </button>
      </div>

    </div>
  );
};
