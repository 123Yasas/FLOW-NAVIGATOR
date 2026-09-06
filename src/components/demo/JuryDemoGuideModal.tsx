import React from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Play, 
  RotateCcw,
  Zap,
  Flame,
  ShieldCheck
} from 'lucide-react';

export const JuryDemoGuideModal: React.FC = () => {
  const { 
    juryDemoActive, 
    closeJuryDemo, 
    juryDemoStep, 
    nextJuryStep, 
    prevJuryStep, 
    setJuryDemoStep,
    resetToBaseline 
  } = useCrowd();

  if (!juryDemoActive) return null;

  const steps = [
    {
      num: 1,
      title: '1. Enter Venue Details',
      desc: 'Set up venue dimensions (length × width), crowd size (12,000 attendees), and access gate requirements in the Smart Plan panel.',
      view: 'Admin > Smart Plan',
    },
    {
      num: 2,
      title: '2. Generate Intelligent Layout',
      desc: 'Click "✨ Generate Intelligent Crowd Layout" to observe the 6-step animated layout generation sequence on the digital twin canvas.',
      view: 'Admin > Smart Plan Animation',
    },
    {
      num: 3,
      title: '3. IoT Sensor Fleet Monitoring',
      desc: 'Observe sub-second people-counting telemetry arriving from ESP32 infrared & LiDAR sensors across active venue zones.',
      view: 'Admin > Live Monitor',
    },
    {
      num: 4,
      title: '4. Trigger Crowd Surge',
      desc: 'Simulate high influx at the main concourse (+85/min). Watch the system capture the velocity spike.',
      view: 'Admin > Live Monitor Surge',
    },
    {
      num: 5,
      title: '5. Explainable AI Risk Prediction',
      desc: 'Inspect the Crowd Intelligence card breakdown: Current Occupancy, Net Influx Drift, and 8-minute time-to-critical warning.',
      view: 'Admin > Crowd Intelligence',
    },
    {
      num: 6,
      title: '6. Generate Safer Route',
      desc: 'Route engine identifies Zone C choke point and computes alternative Route B & D recommendations to bypass congestion.',
      view: 'Admin > Route Management',
    },
    {
      num: 7,
      title: '7. Citizen Receives Recommendation',
      desc: 'Switch to the mobile-first Citizen App. Notice the simplified live map and explainable "Why this route?" guidance.',
      view: 'Citizen > Smart Route Guidance',
    },
    {
      num: 8,
      title: '8. Simulate Network Failure',
      desc: 'Simulate internet uplink loss. Directly addresses the juror question on connectivity resilience in remote pilgrimages.',
      view: 'Admin > Sensors & IoT Offline',
    },
    {
      num: 9,
      title: '9. Offline Edge Mode Continues',
      desc: 'ESP32 flash ring-buffering activates. Crowd counting and local risk analysis remain 100% active on the venue network.',
      view: 'Admin > Sensors Edge Buffering',
    },
    {
      num: 10,
      title: '10. Restore Network & Synchronize',
      desc: 'Network is restored. Watch buffered sensor packets automatically synchronize to cloud with complete data integrity.',
      view: 'Admin > Cloud Sync Complete',
    },
  ];

  const current = steps[juryDemoStep - 1] || steps[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-lg w-[calc(100vw-3rem)]">
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-5 shadow-2xl border-2 border-amber-500/40 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                Guided Jury Presentation Mode
              </span>
              <span className="text-[10px] text-slate-400 font-medium">10-Step End-to-End Problem & Solution Narrative</span>
            </div>
          </div>

          <button
            onClick={closeJuryDemo}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close presentation guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Step Details */}
        <div className="space-y-1.5 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-400 font-black">Step {current.num} of 10</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-[10px]">
              {current.view}
            </span>
          </div>

          <h4 className="font-black text-sm text-white">{current.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">{current.desc}</p>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
            style={{ width: `${(juryDemoStep / 10) * 100}%` }}
          ></div>
        </div>

        {/* 10 Step Quick Dots */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setJuryDemoStep(s.num)}
              className={`flex-1 h-6 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                juryDemoStep === s.num
                  ? 'bg-amber-500 text-slate-900 shadow-sm'
                  : juryDemoStep > s.num
                  ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {s.num}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <button
            onClick={prevJuryStep}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <button
            onClick={resetToBaseline}
            className="px-2.5 py-1.5 text-slate-400 hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            onClick={nextJuryStep}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-black flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all"
          >
            <span>{juryDemoStep === 10 ? 'Restart (Step 1)' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
