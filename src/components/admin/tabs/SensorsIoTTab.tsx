import React from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { Cpu, Battery } from 'lucide-react';

export const SensorsIoTTab: React.FC = () => {
  const { 
    sensors, 
    isOfflineMode 
  } = useCrowd();

  const onlineCount = sensors.filter(s => s.status === 'ONLINE').length;
  const warningCount = sensors.filter(s => s.status === 'WARNING').length;
  const offlineCount = sensors.filter(s => s.status === 'OFFLINE').length;

  return (
    <div className="space-y-6 pb-16">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              IoT Sensor Fleet Deployment
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Physical optical beam break and radar counters deployed across gates and corridors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{onlineCount} / {sensors.length} Nodes Operational</span>
          </span>
          {warningCount > 0 && (
            <span className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-black">
              ⚠️ {warningCount} Warning
            </span>
          )}
          {offlineCount > 0 && (
            <span className="px-3.5 py-1.5 bg-red-50 text-red-800 border border-red-200 rounded-full text-xs font-black">
              🛑 {offlineCount} Offline
            </span>
          )}
        </div>
      </div>

      {/* SENSOR FLEET HARDWARE CARDS (CONNECTED COMPONENTS INSTEAD OF BORING TABLE) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-black text-slate-900">ESP32 IoT Sensor Fleet Deployment</h4>
            <p className="text-xs text-slate-500">Physical optical and radar sensors deployed across access gates and choke corridors</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black">
            {onlineCount} / {sensors.length} Nodes Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => {
            const isOnline = sensor.status === 'ONLINE';
            const isOffline = sensor.status === 'OFFLINE' || isOfflineMode;

            return (
              <div
                key={sensor.id}
                className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-blue-700">{sensor.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isOfflineMode ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    isOnline ? 'bg-emerald-100 text-emerald-800' :
                    sensor.status === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {isOfflineMode ? 'EDGE BUFFERED' : sensor.status}
                  </span>
                </div>

                {/* Location & Hardware */}
                <div>
                  <h5 className="font-black text-slate-900 text-sm">{sensor.zoneName}</h5>
                  <p className="text-[11px] text-slate-500">{sensor.hardwareType}</p>
                </div>

                {/* In/Out Counters */}
                <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">IN</span>
                    <strong className="text-emerald-700 font-extrabold">+{sensor.peopleIn}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">OUT</span>
                    <strong className="text-red-600 font-extrabold">-{sensor.peopleOut}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">NET</span>
                    <strong className="text-slate-900 font-black">{sensor.currentCount}</strong>
                  </div>
                </div>

                {/* Telemetry Footer: Battery, Signal, Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                  <span className="flex items-center gap-1 font-mono">
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sensor.batteryPercentage}%</span>
                  </span>
                  <span className="font-mono">{sensor.signalStrengthDbm} dBm</span>
                  <span>{sensor.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
