import React, { useState } from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { CrowdService } from '../../../services/crowdService';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  Lock, 
  Unlock,
  Wifi,
  WifiOff,
  Flame,
  Layers
} from 'lucide-react';

export const LiveMonitorTab: React.FC = () => {
  const { 
    zones, 
    sensors, 
    toggleZoneAccess, 
    emergencyMode,
    isOfflineMode,
    bufferedTelemetryCount
  } = useCrowd();

  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  const metrics = CrowdService.getVenueOverallMetrics(zones);
  const criticalCount = metrics.criticalCount;
  const highRiskCount = metrics.highCount;
  const safeCount = metrics.safeCount;

  // Live status from ESP32-01
  const esp32Sample = sensors[0] || {
    id: 'ESP32-01',
    zoneName: 'Zone A',
    lastUpdated: '3 seconds ago',
    status: 'ONLINE',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
        return { 
          bg: 'bg-emerald-500', 
          lightBg: 'bg-emerald-50', 
          text: 'text-emerald-800', 
          border: 'border-emerald-300',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: 'LOW'
        };
      case 'MODERATE':
        return { 
          bg: 'bg-amber-500', 
          lightBg: 'bg-amber-50', 
          text: 'text-amber-800', 
          border: 'border-amber-300',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          label: 'MODERATE'
        };
      case 'HIGH':
        return { 
          bg: 'bg-orange-500', 
          lightBg: 'bg-orange-50', 
          text: 'text-orange-800', 
          border: 'border-orange-300',
          badge: 'bg-orange-100 text-orange-900 border-orange-300',
          label: 'HIGH'
        };
      case 'CRITICAL':
        return { 
          bg: 'bg-red-600', 
          lightBg: 'bg-red-50', 
          text: 'text-red-800', 
          border: 'border-red-400',
          badge: 'bg-red-600 text-white border-red-500 animate-pulse',
          label: 'CRITICAL'
        };
      default:
        return { 
          bg: 'bg-slate-500', 
          lightBg: 'bg-slate-50', 
          text: 'text-slate-800', 
          border: 'border-slate-300',
          badge: 'bg-slate-100 text-slate-800',
          label: 'NORMAL'
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* TOP STATS: LARGE ANIMATED LIVE COUNTERS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Visitors */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Visitors
          </span>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {metrics.totalCurrent.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-emerald-600 font-bold">+34 in last 60s</p>
        </div>

        {/* Currently Inside */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Currently Inside
          </span>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-600" />
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {Math.round(metrics.totalCurrent * 0.92).toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Net in-venue count</p>
        </div>

        {/* Venue Occupancy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Venue Occupancy
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-xl sm:text-2xl font-black ${metrics.avgOccupancy > 80 ? 'text-red-600' : 'text-slate-900'}`}>
              {metrics.avgOccupancy}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.avgOccupancy > 80 ? 'bg-red-600' : metrics.avgOccupancy > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, metrics.avgOccupancy)}%` }}
            ></div>
          </div>
        </div>

        {/* Safe Zones */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Safe Zones
          </span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              {safeCount}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">&lt;60% density</p>
        </div>

        {/* High Risk Zones */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            High Risk Zones
          </span>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${highRiskCount > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
            <span className={`text-xl sm:text-2xl font-black ${highRiskCount > 0 ? 'text-orange-600' : 'text-slate-900'}`}>
              {highRiskCount}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">80-90% density</p>
        </div>

        {/* Critical Alerts */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          criticalCount > 0 ? 'bg-red-50 border-red-300 ring-2 ring-red-400/40' : 'bg-white border-slate-200/90'
        }`}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Critical Alerts
          </span>
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-600 animate-bounce' : 'text-slate-400'}`} />
            <span className={`text-xl sm:text-2xl font-black ${criticalCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {criticalCount}
            </span>
          </div>
          <p className="text-[10px] text-red-600 font-bold">
            {criticalCount > 0 ? 'Action required' : 'All clear'}
          </p>
        </div>

      </div>

      {/* LIVE DIGITAL VENUE MAP (MAIN FOCUS) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-lg font-black text-slate-900">
                Live Digital Venue Twin Map
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                ESP32 Telemetry Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive schematic representation of venue corridors with colour-coded crowd density.
            </p>
          </div>

          {/* Map Status Legend */}
          <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>🟢 Low (&lt;60%)</span>
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>🟡 Moderate (60-80%)</span>
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>🟠 High (80-90%)</span>
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-300 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <span>🔴 Critical (&gt;90%)</span>
            </span>
          </div>
        </div>

        {/* Emergency Banner on Map if Active */}
        {emergencyMode && (
          <div className="bg-red-600 text-white rounded-2xl p-4 shadow-md flex items-center justify-between text-xs sm:text-sm font-black animate-pulse">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 animate-bounce" />
              <span>EMERGENCY EVACUATION PROTOCOL ACTIVE: All turnstiles open for South Bypass Route D</span>
            </div>
            <span className="bg-white text-red-700 px-3 py-1 rounded-lg text-xs font-black">
              Route D Safe Exit Active
            </span>
          </div>
        )}

        {/* GRID OF DIGITAL TWIN ZONES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone) => {
            const occ = Math.round((zone.currentCount / zone.capacity) * 100);
            const style = getStatusColor(zone.status);
            const isCrit = zone.status === 'CRITICAL';
            const isHigh = zone.status === 'HIGH';

            return (
              <div
                key={zone.id}
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() => setHoveredZoneId(null)}
                className={`rounded-2xl p-4 border-2 transition-all relative cursor-pointer space-y-3 ${
                  isCrit
                    ? 'border-red-400 bg-red-50/70 shadow-lg ring-4 ring-red-400/30'
                    : isHigh
                    ? 'border-orange-300 bg-orange-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md'
                }`}
              >
                {/* Top card header */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-black text-slate-800 shadow-2xs">
                    {zone.code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${style.badge}`}>
                    {style.label}
                  </span>
                </div>

                {/* Zone Name & Description */}
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{zone.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{zone.description}</p>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Occupancy</span>
                    <span className={`text-sm ${isCrit ? 'text-red-600 font-black' : 'text-slate-900'}`}>{occ}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${style.bg}`}
                      style={{ width: `${Math.min(100, occ)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5 font-medium">
                    <span>{zone.currentCount} / {zone.capacity}</span>
                    <span className="font-mono">+{zone.entryRate} / -{zone.exitRate} /min</span>
                  </div>
                </div>

                {/* Simulated Crowd Dots */}
                <div className="flex items-center gap-1.5 pt-1 overflow-hidden">
                  {Array.from({ length: Math.min(10, Math.ceil(occ / 10)) }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${isCrit ? 'bg-red-600 animate-pulse' : style.bg}`}
                    ></span>
                  ))}
                </div>

                {/* Physical Gate Barrier Status / Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">
                    {zone.accessRestricted ? 'Barrier: Closed' : 'Barrier: Open'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleZoneAccess(zone.id, !zone.accessRestricted);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer ${
                      zone.accessRestricted
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
                    }`}
                  >
                    {zone.accessRestricted ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{zone.accessRestricted ? 'Open Barrier' : 'Lock Barrier'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* IOT DATA SOURCE PIPELINE PANEL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block">
              IoT Sensor Data Telemetry Pipeline
            </span>
            <h4 className="text-lg font-black text-white mt-0.5">
              Live Hardware Heartbeat & Influx Routing
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>🟢 {esp32Sample.id} Online</span>
            </span>
            <span className="text-xs text-slate-400">
              Last update: {esp32Sample.lastUpdated} (Zone: {esp32Sample.zoneName})
            </span>
          </div>
        </div>

        {/* Visual Pipeline Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-center text-xs">
          {[
            { step: '1. IoT Sensor', desc: 'Dual-Laser IR / ToF LiDAR Beam Counter' },
            { step: '2. ESP32', desc: 'Edge Microcontroller Pulse Packet' },
            { step: '3. Local Processing', desc: 'Debounce & Directional Velocity Filter' },
            { step: '4. Cloud / ThingSpeak', desc: 'Secure MQTT / HTTP Influx Telemetry' },
            { step: '5. FlowNavigator', desc: 'AI Decision Engine & Dynamic Rerouting' },
          ].map((s, idx) => (
            <div key={idx} className="bg-white/10 rounded-2xl p-3 border border-white/15 space-y-1 relative">
              <span className="text-cyan-300 font-black text-xs block">{s.step}</span>
              <p className="text-[11px] text-slate-300 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
