import React, { useState } from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { SchematicVenueMap } from '../map/SchematicVenueMap';
import { SmartVenuePlanner } from '../planner/SmartVenuePlanner';
import { 
  AdminTab, 
  PreEventPlannerInput, 
  PreEventPlanOutput 
} from '../../types';
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  BrainCircuit, 
  BarChart3, 
  Calendar, 
  Flame, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Lock, 
  Unlock, 
  Wifi, 
  WifiOff, 
  Battery, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Tv,
  Plus,
  Building2
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { HISTORICAL_ANALYTICS } from '../../data/mockData';

export const AdminDashboard: React.FC = () => {
  const { 
    adminTab, 
    setAdminTab, 
    zones, 
    routes, 
    sensors, 
    aiRecommendations, 
    emergencyMode, 
    toggleEmergencyMode,
    simulateCrowdSpikeRouteC,
    simulateCrowdDecreaseRouteC,
    simulateSensorOffline,
    resetToBaseline,
    toggleZoneAccess,
    generateEventPlan,
    isGeneratingPlan
  } = useCrowd();

  // State for Pre-event planner form
  const [plannerInput, setPlannerInput] = useState<PreEventPlannerInput>({
    eventName: 'Maha Festival Pilgrimage 2026',
    venueName: 'Palani Gathering Complex',
    expectedCrowd: 35000,
    zonesCount: 8,
    avgZoneCapacity: 1000,
    entrancesCount: 4,
    exitsCount: 6,
    startTime: '06:00 AM',
    endTime: '10:00 PM',
    specialNotes: 'High likelihood of VIP arrivals around 6:00 PM'
  });

  const [aiPlanResult, setAiPlanResult] = useState<PreEventPlanOutput | null>(null);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await generateEventPlan(plannerInput);
    setAiPlanResult(result);
  };

  // Analytics helper stats
  const totalVisitors = zones.reduce((sum, z) => sum + z.currentCount, 0);
  const criticalZonesCount = zones.filter(z => z.status === 'CRITICAL').length;
  const onlineSensorsCount = sensors.filter(s => s.status === 'ONLINE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      
      {/* Top Admin Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-extrabold bg-blue-100 text-blue-800 rounded-full flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
              ADMIN CONTROL CENTER
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Gateway Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">FlowNavigator Crowd Command Engine</h1>
          <p className="text-xs text-slate-500">Real-time IoT sensor telemetry, access barrier controls & AI crowd guidance</p>
        </div>

        {/* Emergency Mode Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleEmergencyMode(!emergencyMode)}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 ${
              emergencyMode 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{emergencyMode ? 'CLEAR EMERGENCY MODE' : '🚨 TRIGGER EMERGENCY MODE'}</span>
          </button>
        </div>
      </div>

      {/* DEMO SIMULATION CONTROLLER FLOATING BAR (Requirement #23) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-lg border border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
              Simulation Control Panel (Hackathon Mode)
            </span>
            <span className="text-xs text-slate-300">Trigger live crowd events to test AI decision & mobile rerouting</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={simulateCrowdSpikeRouteC}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-200 font-bold rounded-xl hover:bg-red-500/30 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            <span>Spike Route C Crowd</span>
          </button>

          <button
            onClick={simulateCrowdDecreaseRouteC}
            className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-bold rounded-xl hover:bg-emerald-500/30 transition-all"
          >
            Clear Route C
          </button>

          <button
            onClick={() => simulateSensorOffline()}
            className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold rounded-xl hover:bg-amber-500/30 transition-all"
          >
            Simulate Sensor Offline
          </button>

          <button
            onClick={resetToBaseline}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* TOP ADMIN COUNTER METRICS (Requirement #13) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Visitors</span>
          <div className="flex items-center gap-2 mt-1">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xl font-black text-slate-900">{totalVisitors.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">+240 in last 5m</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Zones</span>
          <div className="flex items-center gap-2 mt-1">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span className="text-xl font-black text-slate-900">{zones.length} / {zones.length}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">100% telemetry coverage</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Critical Zones</span>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className={`w-5 h-5 ${criticalZonesCount > 0 ? 'text-red-600 animate-bounce' : 'text-slate-400'}`} />
            <span className={`text-xl font-black ${criticalZonesCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {criticalZonesCount}
            </span>
          </div>
          <p className="text-[11px] text-red-600 font-medium mt-1">{criticalZonesCount > 0 ? 'Action required' : 'All clear'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Waiting Time</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-black text-slate-900">12 min</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">-3 min vs last hour</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sensor Status</span>
          <div className="flex items-center gap-2 mt-1">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <span className="text-xl font-black text-slate-900">{onlineSensorsCount} / {sensors.length} Online</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">ESP32 microcontrollers</p>
        </div>
      </div>

      {/* ADMIN MAIN NAVIGATION TABS */}
      <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto gap-1 text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Live Zones', icon: Activity },
          { id: 'venue_planner', label: 'Venue Layout Planner', icon: Building2 },
          { id: 'sensors', label: 'IoT Sensors', icon: Cpu },
          { id: 'access_control', label: 'Access Control', icon: Lock },
          { id: 'ai_recommendations', label: 'AI Insights', icon: BrainCircuit },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'event_planner', label: 'Pre-Event AI Planner', icon: Calendar },
          { id: 'architecture', label: 'System Architecture', icon: Layers },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: SMART VENUE LAYOUT PLANNER (Requirement #31-#40) */}
      {adminTab === 'venue_planner' && (
        <SmartVenuePlanner />
      )}

      {/* TAB 1: LIVE ZONES MONITORING (Requirement #14) */}
      {adminTab === 'dashboard' && (
        <div className="space-y-6">
          <SchematicVenueMap />

          {/* Zones Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">Live Zone Telemetry & Capacity</h3>
              <span className="text-xs text-slate-500">Auto-refreshing via ESP32 heartbeat</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3">Zone</th>
                    <th className="p-3">Current Crowd</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Density %</th>
                    <th className="p-3">In / Out Rate</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Access Barrier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {zones.map(z => {
                    const occ = Math.round((z.currentCount / z.capacity) * 100);
                    return (
                      <tr key={z.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">
                          <div>{z.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{z.code}</div>
                        </td>
                        <td className="p-3 font-extrabold text-slate-800">{z.currentCount}</td>
                        <td className="p-3 text-slate-600">{z.capacity}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  occ > 90 ? 'bg-red-600' : occ > 80 ? 'bg-orange-500' : occ > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.min(100, occ)}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-slate-800">{occ}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">
                          +{z.entryRate} / -{z.exitRate} per min
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            z.status === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse' :
                            z.status === 'HIGH' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                            z.status === 'MODERATE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {z.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => toggleZoneAccess(z.id, !z.accessRestricted)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              z.accessRestricted
                                ? 'bg-red-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {z.accessRestricted ? 'Restricted' : 'Allowed'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IOT SENSOR MONITORING (Requirement #15) */}
      {adminTab === 'sensors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">ESP32 IoT Sensor Fleet Management</h3>
              <p className="text-xs text-slate-500">Live hardware telemetry from entrance turnstiles & queue corridors</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {onlineSensorsCount} / {sensors.length} Hardware Online
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Sensor ID</th>
                  <th className="p-3">Zone Location</th>
                  <th className="p-3">Hardware Type</th>
                  <th className="p-3">People IN</th>
                  <th className="p-3">People OUT</th>
                  <th className="p-3">Net Count</th>
                  <th className="p-3">Battery & Signal</th>
                  <th className="p-3">Connection</th>
                  <th className="p-3">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sensors.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-700">{s.id}</td>
                    <td className="p-3 font-bold text-slate-800">{s.zoneName}</td>
                    <td className="p-3 text-slate-600">{s.hardwareType}</td>
                    <td className="p-3 font-extrabold text-emerald-700">+{s.peopleIn}</td>
                    <td className="p-3 font-extrabold text-red-600">-{s.peopleOut}</td>
                    <td className="p-3 font-black text-slate-900">{s.currentCount}</td>
                    <td className="p-3 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-bold">{s.batteryPercentage}%</span>
                        <span className="text-slate-400">{s.signalStrengthDbm} dBm</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                        s.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-mono">{s.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATED ACCESS CONTROL PROTOTYPE (Requirement #16) */}
      {adminTab === 'access_control' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded-full">
                AUTOMATED GATE HARDWARE
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">Physical Access Control & Gate Actuators</h3>
              <p className="text-xs text-slate-500">
                Automated barrier management. Prepared for direct ESP32 relay/servo integration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {zones.map(z => (
                <div 
                  key={z.id} 
                  className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
                    z.accessRestricted 
                      ? 'border-red-400 bg-red-50/40' 
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-base">{z.name}</span>
                      <p className="text-xs text-slate-500">{z.code} • Capacity {z.capacity}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      z.accessRestricted ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {z.accessRestricted ? 'RESTRICTED' : 'ALLOWED'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p className="font-bold text-slate-800">
                      Current Occupancy: {z.currentCount} / {z.capacity} ({Math.round((z.currentCount / z.capacity) * 100)}%)
                    </p>
                    {z.status === 'CRITICAL' && (
                      <p className="text-red-700 font-bold">
                        ⚠️ Zone has reached critical capacity! Further entry should be restricted to prevent stampede risks.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-mono">ESP32 Relay Signal: GPIO-14</span>
                    <button
                      onClick={() => toggleZoneAccess(z.id, !z.accessRestricted)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        z.accessRestricted
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {z.accessRestricted ? 'Allow Access' : 'Restrict Access'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI MANAGEMENT RECOMMENDATIONS (Requirement #17) */}
      {adminTab === 'ai_recommendations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              <span>AI Management & Decision Engine</span>
            </h3>
            <p className="text-xs text-slate-500">
              Prioritized actionable suggestions generated continuously by FlowNavigator AI
            </p>
          </div>

          <div className="space-y-3">
            {aiRecommendations.map(rec => {
              const getPriorityBadge = () => {
                switch (rec.priority) {
                  case 'CRITICAL':
                    return 'bg-red-600 text-white';
                  case 'HIGH':
                    return 'bg-orange-500 text-white';
                  case 'MEDIUM':
                    return 'bg-amber-500 text-white';
                  default:
                    return 'bg-blue-600 text-white';
                }
              };

              return (
                <div key={rec.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${getPriorityBadge()}`}>
                      {rec.priority} PRIORITY
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{rec.timestamp}</span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base">{rec.title}</h4>
                  <p className="text-xs text-slate-700 font-medium">{rec.actionMessage}</p>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Target Impact: <strong className="text-slate-800">{rec.impactEstimate}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS (Requirement #18) */}
      {adminTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">Peak Crowd</span>
              <span className="text-lg font-black text-slate-900">18,420</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">Peak Hour</span>
              <span className="text-lg font-black text-slate-900">6:30 PM</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">Most Used Route</span>
              <span className="text-lg font-black text-amber-600">Route B</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">Least Crowded Route</span>
              <span className="text-lg font-black text-emerald-600">Route D</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
              <span className="text-xs text-slate-500 font-bold block">Avg Wait Time</span>
              <span className="text-lg font-black text-slate-900">11 min</span>
            </div>
          </div>

          {/* Crowd Count Over Time Area Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base">Crowd Count over Time (24h Trend)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HISTORICAL_ANALYTICS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="totalCrowd" name="Total Crowd" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Entry vs Exit Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base">Entry vs Exit Flow Velocity</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HISTORICAL_ANALYTICS}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="entries" name="People In" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exits" name="People Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PRE-EVENT CROWD PLANNER MODULE (Requirement #19) */}
      {adminTab === 'event_planner' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div>
              <span className="px-2.5 py-0.5 text-xs font-extrabold bg-indigo-100 text-indigo-800 rounded-full">
                AI PRE-EVENT SIMULATION
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">Pre-Event Crowd Planner</h3>
              <p className="text-xs text-slate-500">
                Input expected gathering metrics to generate bottleneck forecasts, sensor placements & staff deployment plans.
              </p>
            </div>

            <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="space-y-1 col-span-2">
                <label className="text-slate-700">Event Name</label>
                <input
                  type="text"
                  value={plannerInput.eventName}
                  onChange={e => setPlannerInput({ ...plannerInput, eventName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-slate-700">Venue Location</label>
                <input
                  type="text"
                  value={plannerInput.venueName}
                  onChange={e => setPlannerInput({ ...plannerInput, venueName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700">Expected Crowd</label>
                <input
                  type="number"
                  value={plannerInput.expectedCrowd}
                  onChange={e => setPlannerInput({ ...plannerInput, expectedCrowd: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700">Number of Zones</label>
                <input
                  type="number"
                  value={plannerInput.zonesCount}
                  onChange={e => setPlannerInput({ ...plannerInput, zonesCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700">Entrances Count</label>
                <input
                  type="number"
                  value={plannerInput.entrancesCount}
                  onChange={e => setPlannerInput({ ...plannerInput, entrancesCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700">Exits Count</label>
                <input
                  type="number"
                  value={plannerInput.exitsCount}
                  onChange={e => setPlannerInput({ ...plannerInput, exitsCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 md:col-span-4 pt-2">
                <button
                  type="submit"
                  disabled={isGeneratingPlan}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{isGeneratingPlan ? 'Generating AI Plan...' : 'Generate AI-Assisted Crowd Plan'}</span>
                </button>
              </div>
            </form>

            {/* Generated AI Plan Result */}
            {aiPlanResult && (
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-slate-900">
                    AI Crowd Plan: {aiPlanResult.eventName}
                  </h4>
                  <span className="px-3 py-1 bg-blue-100 text-blue-900 text-xs font-bold rounded-full">
                    AI-Assisted Planning Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Risk Assessment */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <span className="font-extrabold text-amber-900 uppercase">Risk Assessment</span>
                    <p className="text-slate-800">{aiPlanResult.riskAssessment.summary}</p>
                    <div className="font-bold text-amber-900 pt-1">
                      High Risk Zones: {aiPlanResult.riskAssessment.highRiskZones.join(', ')}
                    </div>
                  </div>

                  {/* Sensor Placement Suggestions */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                    <span className="font-extrabold text-indigo-900 uppercase">
                      Recommended IoT Sensors ({aiPlanResult.recommendedSensorsCount} units)
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-800">
                      {aiPlanResult.sensorPlacements.map((s, idx) => (
                        <li key={idx}><strong className="text-indigo-950">{s.location}:</strong> {s.reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Staff Deployment & Bottlenecks */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                  <h5 className="font-extrabold text-slate-900 text-sm">Suggested Staff Deployment</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {aiPlanResult.staffDeploymentAreas.map((st, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block">{st.area}</span>
                        <span className="text-blue-700 font-extrabold block">{st.personnelNeeded} Volunteers / Guards</span>
                        <p className="text-slate-600 text-[11px]">{st.primaryTask}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM ARCHITECTURE & DATA FLOW (Requirement #21) */}
      {adminTab === 'architecture' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">System Architecture & IoT Pipeline</h3>
            <p className="text-xs text-slate-500">Visual representation of hardware counters, microcontrollers & AI decision engine</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-semibold">
            {[
              { step: '1', title: 'PEOPLE', desc: 'Crowd movement through venue pathways & turnstiles' },
              { step: '2', title: 'IoT SENSORS', desc: 'Dual-Laser IR, ToF LiDAR & mmWave Radar counters' },
              { step: '3', title: 'ESP32 & Wi-Fi', desc: 'ESP32 microcontrollers send counter packets every 2s' },
              { step: '4', title: 'AI DECISION ENGINE', desc: 'Calculates density %, wait times & congestion prediction' },
              { step: '5', title: 'CITIZEN & DISPLAYS', desc: 'Real-time route guidance on mobile & venue LED kiosks' },
            ].map((s, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-center relative">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">{s.title}</h4>
                <p className="text-slate-600 text-[11px]">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-950 space-y-2">
            <h4 className="font-bold text-sm text-blue-900">Key Architectural Guarantee</h4>
            <p className="leading-relaxed">
              FlowNavigator uses <strong>direct physical people-counting sensors (IR/LiDAR/mmWave)</strong> instead of CCTV video feeds. This ensures complete 100% visitor privacy, ultra-low power consumption, high reliability in low-light night conditions, and sub-second sensor telemetry without privacy compliance barriers.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
