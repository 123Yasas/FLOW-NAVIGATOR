import React from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { CrowdService } from '../../../services/crowdService';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Navigation, 
  ArrowRight, 
  Sparkles, 
  Flame,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const OverviewTab: React.FC = () => {
  const { 
    zones, 
    sensors, 
    notifications, 
    setAdminTab, 
    startJuryDemo, 
    emergencyMode,
    isOfflineMode,
    bufferedTelemetryCount
  } = useCrowd();

  const metrics = CrowdService.getVenueOverallMetrics(zones);
  const onlineSensors = sensors.filter(s => s.status === 'ONLINE').length;
  const criticalZones = zones.filter(z => z.status === 'CRITICAL');
  const activeAlerts = notifications.filter(n => !n.resolved);

  const pillars = [
    { title: 'PLAN', label: 'Venue Layout', desc: 'Pre-event safety density & zone boundaries', tab: 'smart_plan' as const, color: 'border-blue-300 bg-blue-50 text-blue-700' },
    { title: 'MONITOR', label: 'IoT Telemetry', desc: 'Sub-second ESP32 people counting sensors', tab: 'live_monitor' as const, color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
    { title: 'PREDICT', label: 'AI Forecasting', desc: 'Explainable bottleneck & stampede risk estimation', tab: 'crowd_intelligence' as const, color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
    { title: 'GUIDE', label: 'Dynamic Reroute', desc: 'Real-time alternative pathfinding for visitors', tab: 'route_management' as const, color: 'border-cyan-300 bg-cyan-50 text-cyan-700' },
    { title: 'MANAGE', label: 'Automated Control', desc: 'Gate barriers, staff dispatch & emergency evacuation', tab: 'alerts' as const, color: 'border-amber-300 bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* 5-PILLAR WORKFLOW HIGHLIGHT */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black tracking-wider text-blue-600 uppercase">
              Core Architectural Pipeline
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              PLAN → MONITOR → PREDICT → GUIDE → MANAGE
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              FlowNavigator completes the full end-to-end lifecycle of modern crowd safety.
            </p>
          </div>

          <button
            onClick={startJuryDemo}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Launch Jury Walkthrough</span>
          </button>
        </div>

        {/* 5 Interactive Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {pillars.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setAdminTab(p.tab)}
              className="text-left p-3.5 rounded-2xl border bg-white hover:shadow-md hover:border-blue-400 transition-all group cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${p.color}`}>
                  {p.title}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                {p.label}
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                {p.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* TOP SUMMARY KPI STATS (Light theme, rounded cards, soft shadows) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Visitors */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Current Visitors
          </span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              {metrics.totalCurrent.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold">
            {metrics.avgOccupancy}% of {metrics.totalCapacity.toLocaleString()} max
          </p>
        </div>

        {/* Metric 2: Safe vs High Risk */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Safe Zones
          </span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              {metrics.safeCount} / {zones.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {metrics.highCount + metrics.criticalCount > 0 ? `${metrics.highCount + metrics.criticalCount} requiring caution` : 'All corridors safe'}
          </p>
        </div>

        {/* Metric 3: Critical Bottlenecks */}
        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 ${
          criticalZones.length > 0 ? 'bg-red-50/70 border-red-200 ring-2 ring-red-400/30' : 'bg-white border-slate-200/90'
        }`}>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Critical Alerts
          </span>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              criticalZones.length > 0 ? 'bg-red-600 text-white animate-bounce' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className={`text-2xl font-black ${criticalZones.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {criticalZones.length}
            </span>
          </div>
          <p className="text-[11px] font-bold text-red-600">
            {criticalZones.length > 0 ? `${criticalZones[0].name} choked` : 'Zero choke points'}
          </p>
        </div>

        {/* Metric 4: Avg Queue Delay */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Avg Wait Time
          </span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              11 min
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold">
            -4m vs historical peak
          </p>
        </div>

        {/* Metric 5: IoT Hardware Fleet */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Hardware Fleet
          </span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              {onlineSensors} / {sensors.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isOfflineMode ? `Edge buffered: ${bufferedTelemetryCount}` : 'Sub-second ESP32 telemetry'}
          </p>
        </div>

      </div>

      {/* TWO COLUMN SUMMARY: LIVE VENUE SNAPSHOT & RECENT ACTIONABLE ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Zone Status Grid */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-black text-slate-900">Zone Telemetry & Dynamic Occupancy</h4>
              <p className="text-xs text-slate-500">Updated continuously by physical ESP32 infrared & LiDAR counters</p>
            </div>
            <button
              onClick={() => setAdminTab('live_monitor')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View Live Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zones.map(z => {
              const occ = Math.round((z.currentCount / z.capacity) * 100);
              const isCrit = z.status === 'CRITICAL';
              const isHigh = z.status === 'HIGH';

              return (
                <div 
                  key={z.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    isCrit 
                      ? 'border-red-300 bg-red-50/50 ring-2 ring-red-300/30' 
                      : isHigh 
                      ? 'border-orange-200 bg-orange-50/40' 
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block">{z.code}</span>
                      <h5 className="font-extrabold text-sm text-slate-900">{z.name}</h5>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      isCrit ? 'bg-red-600 text-white animate-pulse' :
                      isHigh ? 'bg-orange-500 text-white' :
                      z.status === 'MODERATE' ? 'bg-amber-100 text-amber-900' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {z.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{z.currentCount} / {z.capacity} people</span>
                      <span className={isCrit ? 'text-red-600 font-black' : ''}>{occ}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCrit ? 'bg-red-600' : isHigh ? 'bg-orange-500' : occ > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occ)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Flow: +{z.entryRate} / -{z.exitRate} per min</span>
                    {z.accessRestricted && (
                      <span className="text-red-600 font-extrabold text-[10px] uppercase">Barrier Engaged</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Urgent Safety Alerts & Actions */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900">Urgent Advisories</h4>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                {activeAlerts.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {activeAlerts.slice(0, 3).map(alert => (
                <div 
                  key={alert.id}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    alert.severity === 'critical' || alert.severity === 'emergency'
                      ? 'bg-red-50 border-red-300 text-red-950'
                      : alert.severity === 'warning' || alert.severity === 'high'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-blue-50 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold uppercase text-[10px] tracking-wider">
                      {alert.severity} • {alert.timestamp}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">{alert.title}</h5>
                  <p className="text-[11px] text-slate-600 leading-snug">{alert.message}</p>
                  {alert.recommendedAction && (
                    <p className="text-[10px] font-bold text-blue-800 pt-1">
                      Action: {alert.recommendedAction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setAdminTab('alerts')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Alert Incident Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
