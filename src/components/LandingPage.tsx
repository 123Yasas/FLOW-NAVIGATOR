import React from 'react';
import { useCrowd } from '../context/CrowdContext';
import { 
  Compass, 
  Users, 
  Sparkles, 
  Navigation, 
  Clock, 
  Flame, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  Tv, 
  Activity, 
  CheckCircle2, 
  EyeOff,
  Zap,
  MapPin,
  TrendingUp,
  Layers
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setRole, locations, selectedLocation, setSelectedLocation } = useCrowd();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Soft Background Grid Patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          
          {/* Hackathon Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>HACKATHON READY • AI + IoT CROWD GUIDANCE PLATFORM</span>
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-md text-[10px] font-black uppercase">NO CCTV</span>
          </div>

          {/* Hero Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              FLOWNAVIGATOR
            </h1>
            <p className="text-2xl sm:text-4xl font-extrabold text-blue-600 tracking-tight">
              "Know the Crowd. Choose the Right Path."
            </p>
            <p className="text-base sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Real-time crowd intelligence that helps people move safely through crowded public spaces, pilgrimages, stadiums, and transit hubs.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setRole('visitor')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-black text-base rounded-2xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5 fill-white" />
              <span>View Live Crowd</span>
            </button>

            <button
              onClick={() => setRole('admin')}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-black text-base rounded-2xl shadow-md hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Explore Admin System</span>
            </button>

            <button
              onClick={() => setRole('public_kiosk')}
              className="w-full sm:w-auto px-6 py-4 bg-white text-slate-800 font-extrabold text-base rounded-2xl border border-slate-300 shadow-xs hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Tv className="w-5 h-5 text-indigo-600" />
              <span>Public Kiosk Display</span>
            </button>
          </div>

          {/* Venue Selector Bar */}
          <div className="pt-6 max-w-xl mx-auto">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-4 h-4 text-blue-600" /> Active Venue:
              </span>
              <select
                value={selectedLocation.id}
                onChange={(e) => {
                  const loc = locations.find(l => l.id === e.target.value);
                  if (loc) setSelectedLocation(loc);
                }}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-extrabold cursor-pointer focus:outline-hidden"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </section>

      {/* SYSTEM PIPELINE EXPLANATION SECTION: SENSE -> ANALYZE -> PREDICT -> GUIDE -> MANAGE */}
      <section className="py-16 bg-slate-100 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black text-blue-700 uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full">
              CORE WORKFLOW PIPELINE
            </span>
            <h2 className="text-3xl font-black text-slate-900">How FlowNavigator Operates</h2>
            <p className="text-sm text-slate-600 font-medium">
              We don't just count the crowd. We understand the crowd, predict its movement, and guide people to safer routes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                title: 'SENSE',
                desc: 'IoT people-counting sensors (Dual-Laser IR / LiDAR / mmWave) count entries and exits in real-time.',
                color: 'bg-blue-600 text-white'
              },
              {
                step: '02',
                title: 'ANALYZE',
                desc: 'The backend system calculates density percentage and flow velocity across all venue corridors.',
                color: 'bg-indigo-600 text-white'
              },
              {
                step: '03',
                title: 'PREDICT',
                desc: 'AI algorithms project queue build-up and predict congestion 10-15 minutes before choke points occur.',
                color: 'bg-purple-600 text-white'
              },
              {
                step: '04',
                title: 'GUIDE',
                desc: 'Visitors receive optimal route advice with exact waiting times on their mobile phones or venue displays.',
                color: 'bg-emerald-600 text-white'
              },
              {
                step: '05',
                title: 'MANAGE',
                desc: 'Admins receive automated alerts, activate access barriers, and deploy volunteers to clear high-risk zones.',
                color: 'bg-slate-900 text-white'
              }
            ].map((p, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3 relative flex flex-col justify-between hover:shadow-md transition-all">
                <div className="space-y-2">
                  <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${p.color}`}>
                    {p.step}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{p.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Advantage Badge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                <EyeOff className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">NO CCTV FOOTAGE REQUIRED</h4>
                <p className="text-xs text-slate-600 max-w-xl">
                  Unlike traditional cameras requiring heavy video AI processing and facial privacy risks, FlowNavigator operates entirely on privacy-first ESP32 beam-break sensors.
                </p>
              </div>
            </div>

            <span className="px-4 py-2 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200">
              100% Visitor Privacy Guaranteed
            </span>
          </div>

        </div>
      </section>

      {/* FEATURE CARDS SECTION */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900">Key System Capabilities</h2>
            <p className="text-sm text-slate-600 font-medium">
              Built specifically for high-density public gatherings, temple festivals, and transit hubs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Real-Time Crowd Monitoring',
                desc: 'Continuous real-time density tracking across multiple zones with instant color-coded capacity badges.',
                icon: Activity,
                color: 'text-blue-600 bg-blue-50'
              },
              {
                title: 'AI Congestion Prediction',
                desc: 'Predicts choke points 12 minutes in advance so visitors avoid crowds before queue stagnation occurs.',
                icon: Sparkles,
                color: 'text-purple-600 bg-purple-50'
              },
              {
                title: 'Smart Route Guidance',
                desc: 'Recommends lowest crowd + shortest wait routes based on selected venue destination.',
                icon: Navigation,
                color: 'text-emerald-600 bg-emerald-50'
              },
              {
                title: 'Waiting-Time Estimation',
                desc: 'Dynamic formula factoring current capacity, entry rates, and exit rates per minute.',
                icon: Clock,
                color: 'text-amber-600 bg-amber-50'
              },
              {
                title: 'Emergency Evacuation Guidance',
                desc: 'Instant emergency mode overriding normal guidance to lead visitors safely along cleared bypass exits.',
                icon: Flame,
                color: 'text-red-600 bg-red-50'
              },
              {
                title: 'IoT-Powered Sensor Network',
                desc: 'ESP32 microcontrollers connected via Wi-Fi/MQTT sending live people counts reliably night and day.',
                icon: Cpu,
                color: 'text-indigo-600 bg-indigo-50'
              }
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-all">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{f.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Compass className="w-6 h-6 text-blue-500" />
            <span className="font-extrabold text-xl tracking-tight">FLOWNAVIGATOR</span>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Intelligent Crowd Guidance System for public safety, pilgrim management, and smart city infrastructure.
          </p>
          <p className="text-[11px] text-slate-500">
            Hackathon Ready Prototype • React + TypeScript + Express + Gemini AI + ESP32 IoT
          </p>
        </div>
      </footer>

    </div>
  );
};
