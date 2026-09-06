import React from 'react';
import { useCrowd } from '../context/CrowdContext';
import { 
  Compass, 
  User, 
  ShieldCheck, 
  Tv, 
  Flame, 
  Sparkles,
  MapPin,
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
    simpleAccessibilityMode,
    setSimpleAccessibilityMode
  } = useCrowd();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      {/* Top Emergency Mode Bar if active */}
      {emergencyMode && (
        <div className="bg-red-600 text-white py-2 px-4 text-center font-black text-xs sm:text-sm animate-pulse flex items-center justify-center gap-2 shadow-md">
          <Flame className="w-4 h-4 animate-bounce" />
          <span>🚨 EMERGENCY EVACUATION MODE IS ACTIVE ON VENUE GROUNDS 🚨</span>
          <button 
            onClick={() => toggleEmergencyMode(false)} 
            className="ml-3 px-2.5 py-0.5 bg-white text-red-700 text-xs font-black rounded-md hover:bg-red-50 transition-colors cursor-pointer"
          >
            Clear Emergency
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setRole('landing')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-slate-900">
                  FLOW<span className="text-blue-600">NAVIGATOR</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded-full uppercase">
                  AI + IoT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">Intelligent Crowd Guidance System</p>
            </div>
          </div>

          {/* Active Venue Selector (When in Citizen or Admin view) */}
          {role !== 'landing' && (
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select 
                value={selectedLocation.id}
                onChange={(e) => {
                  const loc = locations.find(l => l.id === e.target.value);
                  if (loc) setSelectedLocation(loc);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.city})</option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Navigation & Jury Actions */}
          <div className="flex items-center gap-2">
            {/* Elderly / Accessibility mode toggle in Visitor view */}
            {role === 'visitor' && (
              <button
                onClick={() => setSimpleAccessibilityMode(!simpleAccessibilityMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  simpleAccessibilityMode
                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Toggle Simple Spoken Guidance for Senior Citizens"
              >
                <Accessibility className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">{simpleAccessibilityMode ? 'Senior Mode Active' : 'Senior Mode'}</span>
              </button>
            )}

            {/* Quick Role Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setRole('landing')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  role === 'landing'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => setRole('admin')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                onClick={() => setRole('visitor')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  role === 'visitor'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Citizen</span>
              </button>

              <button
                onClick={() => setRole('public_kiosk')}
                className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  role === 'public_kiosk'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Kiosk</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
