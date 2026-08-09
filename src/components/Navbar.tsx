import React from 'react';
import { useCrowd } from '../context/CrowdContext';
import { 
  Compass, 
  User, 
  ShieldAlert, 
  Tv, 
  Flame, 
  Volume2, 
  RotateCcw, 
  Sparkles,
  Layers,
  MapPin,
  HelpCircle,
  Accessibility
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    role, 
    setRole, 
    emergencyMode, 
    toggleEmergencyMode,
    locations,
    selectedLocation,
    setSelectedLocation,
    resetToBaseline,
    hackathonDemoStep,
    nextHackathonStep,
    simpleAccessibilityMode,
    setSimpleAccessibilityMode
  } = useCrowd();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Emergency Mode Bar if active */}
      {emergencyMode && (
        <div className="bg-red-600 text-white py-2 px-4 text-center font-bold text-sm sm:text-base animate-pulse flex items-center justify-center gap-2 shadow-md">
          <Flame className="w-5 h-5 animate-bounce" />
          <span>🚨 EMERGENCY EVACUATION MODE IS ACTIVE ON VENUE GROUNDS 🚨</span>
          <button 
            onClick={() => toggleEmergencyMode(false)} 
            className="ml-4 px-3 py-0.5 bg-white text-red-700 text-xs font-semibold rounded-md hover:bg-red-50 transition-colors shadow-xs"
          >
            Clear Emergency
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRole('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">FLOW<span className="text-blue-600">NAVIGATOR</span></span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 rounded-full uppercase">
                  AI + IoT
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">Intelligent Crowd Guidance System</p>
            </div>
          </div>

          {/* Location Picker (When in Citizen / Admin view) */}
          {role !== 'landing' && (
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <select 
                value={selectedLocation.id}
                onChange={(e) => {
                  const loc = locations.find(l => l.id === e.target.value);
                  if (loc) setSelectedLocation(loc);
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.city})</option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Navigation & Actions */}
          <div className="flex items-center gap-2">
            {/* Elderly / Accessibility mode toggle */}
            {role === 'visitor' && (
              <button
                onClick={() => setSimpleAccessibilityMode(!simpleAccessibilityMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  simpleAccessibilityMode
                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Toggle Extra Large Font & Simple Guidance for Elderly Users"
              >
                <Accessibility className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">{simpleAccessibilityMode ? 'Simple View ON' : 'Senior Mode'}</span>
              </button>
            )}

            {/* Quick Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setRole('visitor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  role === 'visitor'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Visitor</span>
              </button>

              <button
                onClick={() => setRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  role === 'admin'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                onClick={() => setRole('public_kiosk')}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  role === 'public_kiosk'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Public Display</span>
              </button>
            </div>

            {/* Hackathon Demo Helper Button */}
            <button
              onClick={nextHackathonStep}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold rounded-xl shadow-sm hover:from-amber-600 hover:to-orange-700 transition-all hover:shadow-amber-500/20 active:scale-95"
              title="Step through the 14-step Hackathon Demo Flow"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Demo Step {hackathonDemoStep > 0 ? `#${hackathonDemoStep}` : 'Start'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
