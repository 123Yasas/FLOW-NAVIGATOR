import React, { useState } from 'react';
import { 
  Cpu, 
  Server, 
  Database, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Layers, 
  Users, 
  Navigation, 
  CheckCircle2, 
  Info,
  Zap,
  HardDrive
} from 'lucide-react';

export const SystemStatusTab: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<number>(1);

  const layers = [
    {
      step: 1,
      title: 'PEOPLE MOVEMENT',
      icon: Users,
      short: 'Crowd enters venue pathways & gates',
      details: 'Physical crowd movement through access gates, walkways, bottlenecks, and concourses.',
      techSpec: 'No cameras, no facial recognition, no personal identification tracked.'
    },
    {
      step: 2,
      title: 'PHYSICAL COUNTING SENSORS',
      icon: Cpu,
      short: 'Dual-Laser IR, ToF LiDAR, mmWave Radar',
      details: 'Direct optical beam break and Time-of-Flight sensors that register directional count pulses (IN / OUT).',
      techSpec: '100% visitor privacy guaranteed. Functional in complete darkness, fog, and rain.'
    },
    {
      step: 3,
      title: 'ESP32 EDGE CONTROLLER',
      icon: Server,
      short: 'Sub-second edge debounce & packet dispatch',
      details: 'Low-power ESP32 microcontroller aggregates counting pulses, runs local debounce, and manages flash ring-buffer.',
      techSpec: 'Dual-core 240MHz, ultra-low power consumption (<80mA), hardware GPIO interrupts.'
    },
    {
      step: 4,
      title: 'EDGE BUFFER & NETWORK FAILOVER',
      icon: HardDrive,
      short: 'Automatic offline buffering when internet fails',
      details: 'If Wi-Fi drops, telemetry is saved to localized non-volatile flash. Basic risk heuristics continue on venue LAN.',
      techSpec: 'Zero data loss. Automatic batched cloud synchronization upon network restoration.'
    },
    {
      step: 5,
      title: 'FLOWNAVIGATOR BACKEND & AI',
      icon: Database,
      short: 'Explainable risk evaluation & route solver',
      details: 'Ingests real-time sensor packets, computes live density percentages, models queue wait times, and evaluates stampede choke points.',
      techSpec: 'Sub-50ms rule calculation engine with automated barrier actuator relays.'
    },
    {
      step: 6,
      title: 'ADMIN + CITIZEN DISPATCH',
      icon: Navigation,
      short: 'Authority command center & public guidance',
      details: 'Simultaneous distribution: Administrators receive barrier controls & staff deployment recommendations; Citizens receive simplified route guidance.',
      techSpec: 'Mobile-first PWA, responsive public kiosk displays, spoken accessibility guidance.'
    }
  ];

  const current = layers.find(l => l.step === activeLayer) || layers[0];

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <Layers className="w-5 h-5" />
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            System Architecture & IoT Engineering Pipeline
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Click each architectural tier to inspect technical guarantees, edge failover mechanics, and privacy design.
        </p>
      </div>

      {/* INTERACTIVE ARCHITECTURAL PIPELINE DIAGRAM */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {layers.map((layer) => {
            const Icon = layer.icon;
            const isSelected = activeLayer === layer.step;

            return (
              <button
                key={layer.step}
                onClick={() => setActiveLayer(layer.step)}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 ring-4 ring-blue-300/40 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {layer.step}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-tight">{layer.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{layer.short}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ACTIVE LAYER DEEP INSPECTION CARD */}
        <div className="bg-slate-50 border-2 border-blue-200/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-700 uppercase tracking-wider">
              LAYER {current.step} OF 6 DETAILS
            </span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700">
              {current.title}
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-black text-slate-900">{current.details}</h4>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
              <strong className="text-slate-900 block font-bold mb-1">Technical Specification:</strong>
              {current.techSpec}
            </div>
          </div>
        </div>

        {/* PRIVACY & NO-CCTV GUARANTEE CALLOUT */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-2 text-emerald-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-sm text-emerald-900">
              Why FlowNavigator Replaces CCTV Cameras with Physical Pulse Sensors:
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-emerald-900 font-medium">
            Unlike vision-based AI that suffers from camera blind spots, high bandwidth costs, latency, and severe privacy backlash in public gatherings, FlowNavigator relies on <strong>direct optical and radar beam interruption counters</strong>. This guarantees 100% anonymity, sub-second telemetry over standard ESP32 Wi-Fi, and continuous reliability through rain, smoke, and nighttime conditions.
          </p>
        </div>
      </div>

    </div>
  );
};
