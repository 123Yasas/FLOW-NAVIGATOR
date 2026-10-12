import React from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { Compass, Flame, ArrowRight, ShieldCheck, Clock, Users, Zap } from 'lucide-react';

export const PublicKioskDisplay: React.FC = () => {
  const { routes, selectedLocation, emergencyMode, setRole } = useCrowd();

  const routeA = routes.find(r => r.id === 'route-a') || routes[0];
  const routeB = routes.find(r => r.id === 'route-b') || routes[1];
  const routeC = routes.find(r => r.id === 'route-c') || routes[2];
  const routeD = routes.find(r => r.id === 'route-d') || routes[3];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 flex flex-col justify-between font-sans select-none">
      
      {/* Kiosk Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-full text-xs font-black uppercase tracking-widest">
                VENUE LED DISPLAY KIOSK
              </span>
              <span className="text-xs text-slate-400 font-bold">Gate 1 Screen</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
              {selectedLocation.name}
            </h1>
          </div>
        </div>

        <div className="text-right flex items-center justify-between sm:block gap-4">
          <button 
            onClick={() => setRole('visitor')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700"
          >
            Exit Kiosk Mode
          </button>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Live IoT Telemetry • Auto-Updating
          </div>
        </div>
      </div>

      {/* Emergency Mode Full Screen Overlay Banner if active */}
      {emergencyMode ? (
        <div className="my-auto bg-red-600 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-pulse border-4 border-red-500">
          <Flame className="w-20 h-20 text-white mx-auto animate-bounce" />
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight">🚨 EMERGENCY EVACUATION ACTIVE 🚨</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-100 max-w-4xl mx-auto">
            PLEASE AVOID ZONE C & MAIN SHRINE CORRIDOR.
          </p>
          <div className="bg-white text-red-900 rounded-2xl p-6 inline-block text-2xl sm:text-4xl font-black shadow-xl">
            USE ROUTE D FOR EMERGENCY EXIT (WAITING TIME: 3 MIN)
          </div>
        </div>
      ) : (
        /* Standard High-Contrast Guidance Layout */
        <div className="my-auto space-y-8 max-w-6xl mx-auto w-full">
          
          {/* Main Giant Recommendation Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-10 shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-400/40">
            <div className="space-y-2 text-center md:text-left">
              <span className="px-4 py-1.5 bg-white text-emerald-950 font-black rounded-full text-sm uppercase tracking-widest shadow-md">
                ★ RECOMMENDED OPTIMAL PATHWAY
              </span>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight">{routeC.name}</h2>
              <p className="text-xl text-emerald-100 font-bold max-w-2xl">
                Lowest crowd level ({routeC.occupancyPercentage}% full) • Clear & Fast Moving Queue
              </p>
            </div>

            <div className="bg-white/20 p-6 rounded-2xl backdrop-blur-md border border-white/30 text-center shrink-0 min-w-[220px]">
              <span className="text-sm font-extrabold text-emerald-100 block uppercase tracking-wider">WAITING TIME</span>
              <span className="text-5xl sm:text-6xl font-black tracking-tight">{routeC.estimatedWaitMinutes} MIN</span>
            </div>
          </div>

          {/* Route Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Route A */}
            <div className="bg-slate-900 rounded-3xl p-6 border-2 border-red-500/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-white">{routeA.name}</span>
                <span className="px-3 py-1 bg-red-600 text-white font-black text-xs rounded-full">HIGH CROWD</span>
              </div>
              <div className="flex justify-between items-baseline text-slate-300 font-bold text-sm">
                <span>Occupancy: {routeA.occupancyPercentage}%</span>
                <span className="text-red-400 text-lg font-black">{routeA.estimatedWaitMinutes} MIN WAIT</span>
              </div>
              <div className="bg-red-500/20 text-red-300 font-extrabold text-center py-2 rounded-xl text-sm border border-red-500/30">
                AVOID THIS ROUTE
              </div>
            </div>

            {/* Route B */}
            <div className="bg-slate-900 rounded-3xl p-6 border-2 border-amber-500/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-white">{routeB.name}</span>
                <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-full">MODERATE</span>
              </div>
              <div className="flex justify-between items-baseline text-slate-300 font-bold text-sm">
                <span>Occupancy: {routeB.occupancyPercentage}%</span>
                <span className="text-amber-400 text-lg font-black">{routeB.estimatedWaitMinutes} MIN WAIT</span>
              </div>
              <div className="bg-amber-500/20 text-amber-300 font-bold text-center py-2 rounded-xl text-sm border border-amber-500/30">
                MODERATE TRAFFIC
              </div>
            </div>

            {/* Route D */}
            <div className="bg-slate-900 rounded-3xl p-6 border-2 border-emerald-500/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-white">{routeD.name}</span>
                <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-full">LOW CROWD</span>
              </div>
              <div className="flex justify-between items-baseline text-slate-300 font-bold text-sm">
                <span>Occupancy: {routeD.occupancyPercentage}%</span>
                <span className="text-emerald-400 text-lg font-black">{routeD.estimatedWaitMinutes} MIN WAIT</span>
              </div>
              <div className="bg-emerald-500/20 text-emerald-300 font-extrabold text-center py-2 rounded-xl text-sm border border-emerald-500/30">
                CLEAR BYPASS LANE
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Kiosk Footer */}
      <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-bold gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>FlowNavigator IoT Infrastructure • Powered by ESP32 Sensors</span>
        </div>
        <div>
          <span>Emergency Services On Site • Follow Staff Instructions</span>
        </div>
      </div>

    </div>
  );
};
