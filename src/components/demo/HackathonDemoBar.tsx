import React, { useState } from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  X,
  Zap,
  HelpCircle
} from 'lucide-react';

export const HackathonDemoBar: React.FC = () => {
  const { 
    hackathonDemoStep, 
    nextHackathonStep, 
    prevHackathonStep, 
    resetToBaseline,
    setHackathonDemoStep
  } = useCrowd();

  const [expanded, setExpanded] = useState(false);

  const demoSteps = [
    { num: 0, label: 'Overview', desc: 'Baseline state. Route C is GREEN and recommended.' },
    { num: 1, label: '1. Citizen App', desc: 'Open Citizen App showing overall crowd level & venue routes.' },
    { num: 2, label: '2. Route C Optimal', desc: 'Route C recommended with lowest crowd (34%) & 6 min wait time.' },
    { num: 3, label: '3. Crowd Spike', desc: 'Admin spikes crowd in Route C (Zone C reaches 98%).' },
    { num: 4, label: '4. Route C RED', desc: 'Route C turns RED. AI predicts congestion & recommends Route D.' },
    { num: 5, label: '5. Access Restricted', desc: 'Admin receives critical alert & restricts entry at Zone C barrier.' },
    { num: 6, label: '6. Emergency Mode', desc: 'Admin triggers emergency evacuation. App switches to Route D evacuation.' },
    { num: 7, label: '7. Return Normal', desc: 'Emergency cleared and normal crowd guidance restored.' }
  ];

  const current = demoSteps[hackathonDemoStep] || demoSteps[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto">
      {expanded ? (
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-extrabold text-xs text-amber-400 uppercase tracking-wider">
                Guided Hackathon Demo Controller
              </span>
            </div>
            <button 
              onClick={() => setExpanded(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Scenario Step {current.num} / 7</span>
              <span className="text-blue-400">{current.label}</span>
            </div>
            <p className="text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
              {current.desc}
            </p>
          </div>

          {/* Quick Step Buttons */}
          <div className="grid grid-cols-4 gap-1 pt-1 text-[11px] font-bold">
            {demoSteps.slice(0, 8).map(s => (
              <button
                key={s.num}
                onClick={() => setHackathonDemoStep(s.num)}
                className={`py-1.5 rounded-lg border transition-all ${
                  hackathonDemoStep === s.num
                    ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Step {s.num}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <button
              onClick={prevHackathonStep}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex items-center gap-1 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            <button
              onClick={resetToBaseline}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white text-[11px] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>

            <button
              onClick={nextHackathonStep}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-md"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl border border-slate-700/90 shadow-xl flex items-center justify-between sm:justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 text-xs font-bold"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Hackathon Demo Guide</span>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded-full">
              Step {current.num}/7
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      )}
    </div>
  );
};
