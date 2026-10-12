import React from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { 
  Navigation, 
  ArrowRight, 
  Clock, 
  Footprints, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Sparkles,
  Zap
} from 'lucide-react';

export const RouteManagementTab: React.FC = () => {
  const { 
    zones, 
    routes, 
    selectedStartZone, 
    setSelectedStartZone, 
    selectedDestinationZone, 
    setSelectedDestinationZone,
    simulateCongestionEvent,
    simulateRecovery,
    emergencyMode
  } = useCrowd();

  // Find routes matching current start/destination
  const filteredRoutes = routes.filter(r => r.startZoneId === selectedStartZone || r.destinationZoneId === selectedDestinationZone);
  const displayRoutes = filteredRoutes.length > 0 ? filteredRoutes : routes;

  const startZoneObj = zones.find(z => z.id === selectedStartZone);
  const destZoneObj = zones.find(z => z.id === selectedDestinationZone);

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER WITH CONTROLS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
                <Navigation className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Dynamic Route Engine & Intelligent Rerouting
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Evaluates real-time bottleneck friction, queue depths, and suggests optimal multi-lane alternatives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={simulateCongestionEvent}
              className="px-3 py-1.5 bg-red-50 text-red-800 border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors cursor-pointer"
            >
              Trigger Congestion
            </button>
            <button
              onClick={simulateRecovery}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Clear Route
            </button>
          </div>
        </div>

        {/* Starting & Destination Zone Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Starting Zone / Entrance</label>
            <select
              value={selectedStartZone}
              onChange={(e) => setSelectedStartZone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 cursor-pointer focus:outline-hidden"
            >
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Destination Area / Stage</label>
            <select
              value={selectedDestinationZone}
              onChange={(e) => setSelectedDestinationZone(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 cursor-pointer focus:outline-hidden"
            >
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ROUTE COMPARISON CARDS: ROUTE A (AVOID) VS ROUTE B (RECOMMENDED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayRoutes.slice(0, 2).map((route, idx) => {
          const isRecommended = route.tag === 'RECOMMENDED' || route.tag === 'EVACUATION_ROUTE';
          const isAvoid = route.tag === 'AVOID';

          return (
            <div
              key={route.id}
              className={`rounded-3xl p-6 border-2 transition-all space-y-4 relative ${
                isRecommended
                  ? 'bg-emerald-50/40 border-emerald-400 shadow-lg ring-4 ring-emerald-400/20'
                  : isAvoid
                  ? 'bg-red-50/40 border-red-300 shadow-sm'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Route Option 0{idx + 1}</span>
                  <h4 className="font-black text-lg text-slate-900">{route.name}</h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black shadow-2xs ${
                  isRecommended ? 'bg-emerald-600 text-white' :
                  isAvoid ? 'bg-red-600 text-white animate-pulse' :
                  'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {isRecommended ? '✓ RECOMMENDED' : isAvoid ? '⚠️ AVOID / BOTTLENECK' : 'MODERATE'}
                </span>
              </div>

              {/* Path Visual Diagram */}
              <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                  <span className="px-2 py-1 bg-slate-100 rounded-lg">{startZoneObj?.code || 'ZONE A'}</span>
                  <ArrowRight className={`w-4 h-4 ${isRecommended ? 'text-emerald-600 animate-pulse' : 'text-red-500'}`} />
                  <span className="px-2 py-1 bg-slate-100 rounded-lg">Intermediate Corridors</span>
                  <ArrowRight className={`w-4 h-4 ${isRecommended ? 'text-emerald-600 animate-pulse' : 'text-red-500'}`} />
                  <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded-lg font-black">{destZoneObj?.code || 'DEST'}</span>
                </div>

                {/* Animated Flow Line Indicator */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full ${isRecommended ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${route.occupancyPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Metrics Grid: Distance, Crowd %, Estimated Wait */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Distance</span>
                  <span className="text-base font-black text-slate-900">
                    {idx === 0 ? '300 m' : '420 m'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Crowd Density</span>
                  <span className={`text-base font-black ${isAvoid ? 'text-red-600' : 'text-emerald-600'}`}>
                    {route.occupancyPercentage}%
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Est. Wait</span>
                  <span className="text-base font-black text-slate-900">
                    {route.estimatedWaitMinutes} min
                  </span>
                </div>
              </div>

              {/* Explainable Why This Route Card */}
              <div className={`p-3 rounded-2xl text-xs space-y-1 border ${
                isRecommended ? 'bg-emerald-100/60 border-emerald-300 text-emerald-950' : 'bg-red-100/60 border-red-300 text-red-950'
              }`}>
                <span className="font-extrabold uppercase text-[10px]">Route Rationale:</span>
                <p className="font-medium leading-snug">
                  {route.explainableReason || (isRecommended 
                    ? 'This route currently has lower crowd density and avoids Zone C bottleneck corridors.' 
                    : 'Heavy queue pressure detected at inner sanctum gate. High risk of crush congestion.')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
