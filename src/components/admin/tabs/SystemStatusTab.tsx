import React from 'react';
import { 
  Server, 
  CheckCircle2, 
  Cpu, 
  Activity, 
  Database, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';
import { useCrowd } from '../../../context/CrowdContext';

export const SystemStatusTab: React.FC = () => {
  const { zones, sensors, routes } = useCrowd();

  const services = [
    {
      name: 'Express Web & API Server',
      desc: 'REST API, static assets, and local Vite dev server on port 3000',
      icon: Server,
      status: 'OPERATIONAL',
      latency: '3ms',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Gemini AI Safety Engine',
      desc: 'Automated crowd management planning & safety advisory model',
      icon: Sparkles,
      status: 'CONNECTED',
      latency: '180ms',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      name: 'IoT Telemetry Ingestion',
      desc: `Sub-second pulse stream from ${sensors.length} optical and radar sensor nodes`,
      icon: Radio,
      status: 'STREAMING',
      latency: '<50ms',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Dynamic Pathfinding Engine',
      desc: `Real-time alternative routing solver across ${routes.length} venue pathways`,
      icon: Zap,
      status: 'OPERATIONAL',
      latency: '12ms',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Hardware Barrier Actuators',
      desc: `Automated electronic gate locks across ${zones.length} venue zones`,
      icon: Lock,
      status: 'READY',
      latency: 'Instant',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Zone Occupancy Cache',
      desc: 'In-memory rolling buffer for real-time density calculations',
      icon: Database,
      status: 'HEALTHY',
      latency: '1ms',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              System Status & Infrastructure Health
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live operational health of core services, AI engines, and hardware controllers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-4 py-2 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-full text-xs font-black flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All Systems Operational (99.98%)</span>
          </span>
        </div>
      </div>

      {/* CORE SERVICES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv, idx) => {
          const Icon = srv.icon;
          return (
            <div 
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${srv.badge}`}>
                  {srv.status}
                </span>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm">{srv.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{srv.desc}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-medium">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Response Time:</span>
                </span>
                <span className="font-mono font-bold text-slate-700">{srv.latency}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SYSTEM OVERVIEW & PRIVACY SPECIFICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 space-y-2 lg:col-span-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-slate-900 text-sm">Privacy & Security Guarantees</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            FlowNavigator utilizes direct optical beam-break and radar pulses for count aggregation. No facial recognition, biometric data, or camera footage is captured or stored, ensuring complete privacy compliance.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Telemetry Uptime</span>
          </div>
          <span className="text-2xl font-black text-slate-900 block">99.98%</span>
          <p className="text-[11px] text-slate-400">Continuous hardware heartbeat sync</p>
        </div>
      </div>

    </div>
  );
};
