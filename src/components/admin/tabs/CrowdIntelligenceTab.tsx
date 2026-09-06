import React, { useState } from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { 
  BrainCircuit, 
  Cpu, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  Layers, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Activity,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const CrowdIntelligenceTab: React.FC = () => {
  const { zones, aiRecommendations } = useCrowd();

  // Pick Zone C as primary focus for crowd intelligence demonstration
  const focusZone = zones.find(z => z.id === 'zone-c') || zones[0];
  const occupancyPercentage = Math.round((focusZone.currentCount / focusZone.capacity) * 100);

  // Trend line chart data: 60% -> 67% -> 75% -> 84%
  const trendData = [
    { time: '10:15 AM', density: 60 },
    { time: '10:20 AM', density: 67 },
    { time: '10:25 AM', density: 75 },
    { time: '10:30 AM', density: occupancyPercentage },
  ];

  const pipelineStages = [
    'SENSOR DATA',
    'DATA PROCESSING',
    'DENSITY CALCULATION',
    'TREND ANALYSIS',
    'RISK PREDICTION',
    'DECISION ENGINE'
  ];

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER WITH ANIMATED 6-STAGE PIPELINE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Explainable Crowd Intelligence & Decision Engine
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            How raw sensor data is transformed into explainable crowd predictions without black-box opacity.
          </p>
        </div>

        {/* Animated Pipeline Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {pipelineStages.map((stage, idx) => (
            <div 
              key={idx}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center space-y-1 relative group hover:bg-blue-50/60 hover:border-blue-300 transition-all"
            >
              <span className="text-[10px] font-mono font-bold text-blue-600 block">STEP 0{idx + 1}</span>
              <h5 className="font-black text-xs text-slate-900 leading-tight">{stage}</h5>
              {idx < pipelineStages.length - 1 && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 font-black text-xs">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5 INTERACTIVE CARDS DEMONSTRATING EXPLAINABLE PREDICTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: SENSOR DATA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              1. SENSOR DATA
            </span>
            <span className="text-[11px] font-mono text-slate-400">ESP32 Telemetry</span>
          </div>

          <div>
            <h4 className="font-black text-lg text-slate-900">{focusZone.name}</h4>
            <p className="text-xs text-slate-500">Live hardware gate counts from beam break sensors</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500">Entry Count</span>
              <span className="text-xl font-black text-emerald-600 block">740</span>
              <span className="text-[10px] text-slate-400">+65 / min velocity</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500">Exit Count</span>
              <span className="text-xl font-black text-red-500 block">260</span>
              <span className="text-[10px] text-slate-400">-25 / min throughput</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs flex items-center justify-between text-blue-950 font-bold">
            <span>Net Present Occupancy:</span>
            <span className="text-base font-black text-blue-700">480 people</span>
          </div>
        </div>

        {/* CARD 2: DENSITY CALCULATION */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              2. DENSITY CALCULATION
            </span>
            <span className="text-[11px] font-mono text-slate-400">Standard Formula</span>
          </div>

          <div>
            <h4 className="font-black text-lg text-slate-900">Occupancy vs Capacity</h4>
            <p className="text-xs text-slate-500">Instantaneous ratio computation for safety compliance</p>
          </div>

          {/* Formula Display */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="text-xs font-mono font-bold text-slate-700">
              <div className="inline-block border-b-2 border-slate-400 px-3 pb-0.5">Current Occupancy (480)</div>
              <div className="pt-0.5">Zone Capacity (600)</div>
            </div>
            <div className="text-xs font-black text-slate-500">× 100</div>
            <div className="text-2xl font-black text-indigo-600">= 80%</div>
          </div>

          {/* Circular Progress Ring Representation */}
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="font-bold text-slate-600">Density Threshold:</span>
            <span className="font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              HIGH DENSITY (80%)
            </span>
          </div>
        </div>

        {/* CARD 3: TREND ANALYSIS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              3. TREND ANALYSIS
            </span>
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Rapid Growth
            </span>
          </div>

          <div>
            <h4 className="font-black text-lg text-slate-900">Moving Influx Velocity</h4>
            <p className="text-xs text-slate-500">Rate of change across rolling 5-minute sampling windows</p>
          </div>

          {/* Animated trend chart */}
          <div className="h-36 w-full bg-slate-50 rounded-2xl p-2 border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="density" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center text-xs font-black text-amber-900">
            <span>60% → 67% → 75% → 84%: Rapid crowd growth detected</span>
          </div>
        </div>

        {/* CARD 4: AI RISK PREDICTION (EXPLAINABLE MODEL) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              4. AI RISK PREDICTION (EXPLAINABLE)
            </span>
            <span className="text-xs font-bold text-slate-400">Rule-based Machine Reasoning</span>
          </div>

          <div>
            <h4 className="font-black text-lg text-slate-900">Predictive Congestion & Time-to-Critical</h4>
            <p className="text-xs text-slate-500">No unexplained AI "magic". Transparent evaluation of input telemetry.</p>
          </div>

          {/* Visual Risk Meter */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-emerald-600">LOW</span>
              <span className="text-amber-500">MODERATE</span>
              <span className="text-orange-500 font-extrabold">HIGH</span>
              <span className="text-red-600">CRITICAL</span>
            </div>

            {/* Visual Risk Bar with Cursor */}
            <div className="relative w-full h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-600 rounded-full">
              {/* Pointer indicator positioned at High (approx 78%) */}
              <div className="absolute top-1/2 -translate-y-1/2 left-[78%] -translate-x-1/2 w-5 h-5 bg-white border-2 border-slate-900 rounded-full shadow-md flex items-center justify-center text-[8px] font-black text-slate-900">
                ▲
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span className="text-slate-700">Predicted Congestion: <strong className="text-orange-600 font-black">HIGH RISK</strong></span>
              <span className="text-red-600 font-black">Est. Time to Critical: 8 Minutes</span>
            </div>
          </div>

          {/* Explainable Factor Breakdown */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Influencing Factors Analyzed:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Current Occupancy</span>
                <strong className="text-slate-800">480 / 600 (80%)</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Entry Rate</span>
                <strong className="text-emerald-700">+65 people/min</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Exit Rate</span>
                <strong className="text-slate-700">-25 people/min</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Occupancy Trend</span>
                <strong className="text-amber-600">+14% in 15 mins</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Corridor Capacity</span>
                <strong className="text-slate-800">600 Max Standing</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Net Influx Drift</span>
                <strong className="text-red-600">+40 net crowd/min</strong>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 5: WAITING TIME ESTIMATOR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              5. WAITING TIME
            </span>
            <div className="relative">
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Explain formula"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-6 w-60 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-20 space-y-1">
                  <span className="font-black text-cyan-300 block">Queue Formula:</span>
                  <p className="text-slate-300">
                    Estimated using the number of people ahead and the observed movement / service rate (480 people ÷ 40 service/min = 12 mins).
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-black text-lg text-slate-900">Estimated Queue Delay</h4>
            <p className="text-xs text-slate-500">Real-time throughput clearance calculation</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-5 text-center space-y-1">
            <Clock className="w-8 h-8 text-cyan-600 mx-auto animate-pulse" />
            <span className="text-3xl font-black text-slate-900 block mt-1">⏱️ 12 Minutes</span>
            <p className="text-xs text-cyan-800 font-bold">Estimated Queue Waiting Time</p>
          </div>

          <p className="text-[11px] text-slate-500 leading-snug">
            Calculated dynamically: <strong className="text-slate-700">480 people in queue ÷ 40 people/min service rate = 12 minutes delay</strong>.
          </p>
        </div>

      </div>

    </div>
  );
};
