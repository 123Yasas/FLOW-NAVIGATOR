import React from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { 
  Flame, 
  Sparkles, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  Sliders, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin,
  RefreshCw
} from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const {
    selectedLocation,
    locations,
    setSelectedLocation,
    emergencyMode,
    toggleEmergencyMode,
    isOfflineMode,
    toggleOfflineMode,
    isSyncingData,
    offlineSyncProgress,
    bufferedTelemetryCount,
    simulateNormalFlow,
    simulateCrowdSurge,
    simulateCongestionEvent,
    simulateRecovery,
    resetToBaseline
  } = useCrowd();

  return (
    <header className="bg-white border-b border-slate-200/90 shadow-2xs p-4 sm:px-6 flex flex-col gap-3">
      {/* Top row: Venue title, offline badge, emergency button & jury demo button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-black bg-blue-100 text-blue-800 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              FLOWNAVIGATOR COMMAND
            </span>

            {/* Offline status indicator */}
            {isOfflineMode ? (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1.5 animate-pulse">
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Offline Edge Mode ({bufferedTelemetryCount} buffered)</span>
              </span>
            ) : isSyncingData ? (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-full flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>Syncing Cloud Data {offlineSyncProgress}%</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Uplink Online</span>
              </span>
            )}

            {/* Active Venue Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={selectedLocation.id}
                onChange={(e) => {
                  const loc = locations.find(l => l.id === e.target.value);
                  if (loc) setSelectedLocation(loc);
                }}
                className="bg-transparent border-none font-extrabold text-slate-900 cursor-pointer focus:outline-hidden"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {selectedLocation.name}
          </h2>
          <p className="text-xs text-slate-500">
            Intelligent Crowd Management • IoT Sensor Network & Edge Gateway
          </p>
        </div>

        {/* Action CTA: Emergency Protocol */}
        <div className="flex items-center gap-2.5 flex-wrap">

          <button
            onClick={() => toggleEmergencyMode()}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer ${
              emergencyMode 
                ? 'bg-red-600 text-white ring-4 ring-red-300 animate-pulse' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{emergencyMode ? 'CLEAR EMERGENCY' : '🚨 EMERGENCY MODE'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Demo Simulation Bar */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Crowd Simulation Controls:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={simulateNormalFlow}
            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Normal Flow
          </button>

          <button
            onClick={simulateCrowdSurge}
            className="px-2.5 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg font-bold text-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ Crowd Surge</span>
          </button>

          <button
            onClick={simulateCongestionEvent}
            className="px-2.5 py-1.5 bg-red-50 border border-red-300 hover:bg-red-100 rounded-lg font-bold text-red-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>🚨 Congestion</span>
          </button>

          <button
            onClick={simulateRecovery}
            className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg font-bold text-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>✓ Recovery</span>
          </button>

          <button
            onClick={() => toggleOfflineMode()}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer border ${
              isOfflineMode
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="Toggle network failure to demonstrate edge buffering"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>{isOfflineMode ? 'Restore Network' : '🌐 Toggle Network Failure'}</span>
          </button>

          <button
            onClick={resetToBaseline}
            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer ml-1"
            title="Reset simulation to initial baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
