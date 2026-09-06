import React from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { HISTORICAL_ANALYTICS } from '../../../data/mockData';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Flame,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export const AnalyticsTab: React.FC = () => {
  const { zones } = useCrowd();

  // Zone Comparison Data
  const zoneComparisonData = zones.map(z => ({
    name: z.code,
    occupancy: Math.round((z.currentCount / z.capacity) * 100),
    count: z.currentCount,
    capacity: z.capacity,
  }));

  // Peak Hours Heatmap mock matrix (Hours vs Days or Time Intervals)
  const peakHours = [
    { hour: '06 AM', crowd: 'LOW', value: 20 },
    { hour: '08 AM', crowd: 'MODERATE', value: 45 },
    { hour: '10 AM', crowd: 'HIGH', value: 80 },
    { hour: '12 PM', crowd: 'HIGH', value: 88 },
    { hour: '02 PM', crowd: 'MODERATE', value: 65 },
    { hour: '04 PM', crowd: 'HIGH', value: 82 },
    { hour: '06 PM', crowd: 'PEAK CRITICAL', value: 96 },
    { hour: '08 PM', crowd: 'HIGH', value: 78 },
    { hour: '10 PM', crowd: 'LOW', value: 35 },
  ];

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <BarChart3 className="w-5 h-5" />
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Crowd Analytics & Flow Intelligence
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Historical trends, zone capacity distributions, hourly surge patterns, and gate velocity metrics.
        </p>
      </div>

      {/* TOP SUMMARY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Peak Crowd Recorded</span>
          <span className="text-2xl font-black text-slate-900 block">18,420</span>
          <span className="text-[10px] text-emerald-600 font-bold">Today at 6:30 PM</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Clearance Rate</span>
          <span className="text-2xl font-black text-blue-600 block">1,850/hr</span>
          <span className="text-[10px] text-slate-500">Through main exit lanes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Most Used Route</span>
          <span className="text-2xl font-black text-amber-600 block">Route B</span>
          <span className="text-[10px] text-slate-500">West Arcade lane (44%)</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Least Congested Route</span>
          <span className="text-2xl font-black text-emerald-600 block">Route D</span>
          <span className="text-[10px] text-emerald-700 font-bold">South Express Bypass</span>
        </div>
      </div>

      {/* CHART 1: CROWD OVER TIME (LINE CHART) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-black text-slate-900">1. Crowd Count Over Time (24h Trajectory)</h4>
            <p className="text-xs text-slate-500">Continuous telemetry tracking arrival influx vs departure clearance</p>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full border border-blue-200">
            Total Crowd Curve
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HISTORICAL_ANALYTICS}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="totalCrowd" name="Total Crowd" stroke="#2563eb" fill="#dbeafe" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2 COLUMN CHARTS: ZONE COMPARISON & ENTRY VS EXIT VELOCITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 2: ZONE COMPARISON (BAR CHART) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h4 className="text-base font-black text-slate-900">2. Zone Capacity & Occupancy Comparison</h4>
            <p className="text-xs text-slate-500">Current crowd volume per individual venue sector</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="count" name="Current Count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacity" name="Max Capacity" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: ENTRY VS EXIT FLOW VELOCITY */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h4 className="text-base font-black text-slate-900">3. Influx vs Outflow Flow Velocity</h4>
            <p className="text-xs text-slate-500">People entering through gates vs exiting to transit hubs</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HISTORICAL_ANALYTICS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="entries" name="People In (+)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exits" name="People Out (-)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CHART 4: PEAK HOURS HEATMAP & TIMELINE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div>
          <h4 className="text-base font-black text-slate-900">4. Peak Hours Density Heatmap</h4>
          <p className="text-xs text-slate-500">Hourly density surge distribution throughout the festival schedule</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {peakHours.map((h, i) => {
            const isPeak = h.value > 85;
            const isHigh = h.value > 70;
            const isMod = h.value > 40;

            return (
              <div 
                key={i} 
                className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                  isPeak ? 'bg-red-100/80 border-red-300 text-red-950 font-black ring-2 ring-red-400/30' :
                  isHigh ? 'bg-orange-100/70 border-orange-300 text-orange-950 font-extrabold' :
                  isMod ? 'bg-amber-50 border-amber-200 text-amber-950 font-bold' :
                  'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider block opacity-70">{h.hour}</span>
                <span className="text-base block">{h.value}%</span>
                <span className="text-[9px] uppercase tracking-wider block font-bold truncate">{h.crowd}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
