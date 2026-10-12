import React, { useState } from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { 
  Bell, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Info, 
  Check, 
  Eye, 
  Filter, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { AlertSeverity } from '../../../types';

export const AlertsTab: React.FC = () => {
  const { notifications, acknowledgeAlert, resolveAlert, setAdminTab } = useCrowd();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filtered = notifications.filter(n => {
    if (filterSeverity === 'all') return true;
    return n.severity === filterSeverity;
  });

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER WITH FILTER BAR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-50 text-red-700">
                <Bell className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Live Incident & Predictive Alert Center
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Active crowd risk notifications, queue escalation advisories, and recommended authority actions.
            </p>
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto flex-wrap">
            {['all', 'critical', 'high', 'warning', 'info'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  filterSeverity === sev
                    ? 'bg-white text-blue-700 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ALERT CARDS LIST */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const isCritical = alert.severity === 'critical' || alert.severity === 'emergency';
          const isHigh = alert.severity === 'high';
          const isWarning = alert.severity === 'warning';

          return (
            <div
              key={alert.id}
              className={`rounded-3xl p-5 border-2 transition-all space-y-3 ${
                alert.resolved
                  ? 'bg-slate-50/60 border-slate-200 opacity-60'
                  : isCritical
                  ? 'bg-red-50/60 border-red-300 shadow-md ring-2 ring-red-400/20'
                  : isHigh
                  ? 'bg-orange-50/60 border-orange-300 shadow-2xs'
                  : isWarning
                  ? 'bg-amber-50/60 border-amber-300 shadow-2xs'
                  : 'bg-white border-slate-200/90 shadow-2xs'
              }`}
            >
              {/* Card Header: Severity, Zone & Timestamp */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isCritical ? 'bg-red-600 text-white' :
                    isHigh ? 'bg-orange-500 text-white' :
                    isWarning ? 'bg-amber-100 text-amber-900' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity}
                  </span>

                  {alert.zoneId && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded font-bold uppercase">
                      {alert.zoneId}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono font-medium">{alert.timestamp}</span>
                  {alert.resolved && (
                    <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Message */}
              <div>
                <h4 className="font-black text-base text-slate-900">{alert.title}</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{alert.message}</p>
              </div>

              {/* Recommended Action Box */}
              {alert.recommendedAction && (
                <div className="bg-white/80 p-3 rounded-xl border border-slate-200 text-xs space-y-0.5">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                    Recommended Action:
                  </span>
                  <p className="font-semibold text-slate-800">{alert.recommendedAction}</p>
                </div>
              )}

              {/* Interactive Buttons: Acknowledge, Resolve, View Zone */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                <button
                  onClick={() => setAdminTab('live_monitor')}
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Zone on Live Map</span>
                </button>

                <div className="flex items-center gap-2">
                  {!alert.acknowledged && !alert.resolved && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
