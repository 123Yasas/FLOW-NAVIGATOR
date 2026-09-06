import React from 'react';
import { useCrowd } from '../context/CrowdContext';
import { 
  ShieldCheck, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Activity, 
  Cpu, 
  Navigation, 
  AlertTriangle,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Tv
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setRole, setAdminTab, locations, selectedLocation, setSelectedLocation } = useCrowd();

  const workflowPillars = [
    { name: 'PLAN', desc: 'Pre-event capacity & venue layout generator', icon: Layers, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { name: 'MONITOR', desc: 'Real-time ESP32 IoT sensor telemetry', icon: Activity, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { name: 'PREDICT', desc: 'Explainable AI bottleneck & surge forecasting', icon: Cpu, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { name: 'GUIDE', desc: 'Live mobile route recalculation for visitors', icon: Navigation, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { name: 'MANAGE', desc: 'Automated barrier triggers & incident command', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">
      
      {/* Animated Visual Background Representing Sensor Signals & Crowd Flow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-100/60 blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl"></div>
        
        {/* Schematic background circuit grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_20%,#000_60%,transparent_100%)]"></div>

        {/* Floating animated crowd nodes */}
        <div className="absolute top-24 left-[15%] w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
        <div className="absolute top-48 right-[20%] w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <div className="absolute bottom-40 left-[25%] w-3 h-3 rounded-full bg-cyan-500 animate-ping"></div>
        <div className="absolute top-72 left-[60%] w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10 space-y-12">

        {/* Top Floating Badge Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 text-blue-800 text-xs font-bold shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Intelligent IoT & AI Crowd Management Platform</span>
            <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-md font-extrabold uppercase">
              100% Privacy • No CCTV
            </span>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={() => {
              setRole('admin');
              setAdminTab('smart_plan');
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Launch Smart Planner</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto pt-2 sm:pt-6">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">
              FLOW<span className="text-blue-600">NAVIGATOR</span>
            </h1>
            <p className="text-xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
              Plan. Monitor. Predict. Guide. Manage.
            </p>
          </div>

          <p className="text-base sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            An intelligent IoT and AI-powered platform for safer crowd movement and smarter venue management.
          </p>

          {/* 5-Phase Architecture Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-4 text-left">
            {workflowPillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${p.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 tracking-wide">{p.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* TWO LARGE INTERACTIVE ROLE SELECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto pt-4">
          
          {/* Card 1: ADMINISTRATOR */}
          <div 
            onClick={() => setRole('admin')}
            className="group cursor-pointer bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 hover:border-blue-500 shadow-md hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100/60 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    AUTHORITY / VENUE COMMAND
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mt-2">🛡️ ADMINISTRATOR</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Plan and manage the venue, monitor crowd conditions and receive intelligent recommendations.
                </p>
              </div>

              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Interactive Smart Layout generation & capacity limits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time ESP32 sensor fleet telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated gate barrier triggers & incident command</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Offline edge buffering when network disconnects</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button 
                onClick={(e) => { e.stopPropagation(); setRole('admin'); }}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 group-hover:bg-blue-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-500/25 cursor-pointer"
              >
                <span>Open Control Center</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2: VISITOR / CITIZEN */}
          <div 
            onClick={() => setRole('visitor')}
            className="group cursor-pointer bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 hover:border-cyan-500 shadow-md hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-100/60 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <Compass className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-full">
                    PUBLIC MOBILE EXPERIENCE
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mt-2">🧭 VISITOR</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  View live crowd conditions and receive safer route guidance.
                </p>
              </div>

              <ul className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Minimal, mobile-first design without technical jargon</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Color-coded live crowd map (Low, Moderate, High, Avoid)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Smart destination route finder with "Why this route?"</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>One-touch Emergency Mode with exit & medical routing</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button 
                onClick={(e) => { e.stopPropagation(); setRole('visitor'); }}
                className="w-full py-3.5 px-6 rounded-2xl bg-cyan-700 group-hover:bg-cyan-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-cyan-500/25 cursor-pointer"
              >
                <span>Explore Venue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Public Kiosk / Display Link Option */}
        <div className="text-center pt-2">
          <button
            onClick={() => setRole('public_kiosk')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50 px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <Tv className="w-4 h-4 text-indigo-600" />
            <span>Switch to Public LED Kiosk Display Mode</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Venue Selector */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 max-w-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Demonstration Venue:</span>
          </div>
          <select
            value={selectedLocation.id}
            onChange={(e) => {
              const loc = locations.find(l => l.id === e.target.value);
              if (loc) setSelectedLocation(loc);
            }}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 cursor-pointer focus:outline-hidden"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.city})
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
};
