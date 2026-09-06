import React from 'react';
import { useCrowd } from '../../../context/CrowdContext';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Battery, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Database, 
  Layers, 
  HardDrive,
  Activity,
  ArrowRight
} from 'lucide-react';

export const SensorsIoTTab: React.FC = () => {
  const { 
    sensors, 
    isOfflineMode, 
    toggleOfflineMode, 
    isSyncingData, 
    offlineSyncProgress, 
    bufferedTelemetryCount,
    syncBufferedData 
  } = useCrowd();

  const onlineCount = sensors.filter(s => s.status === 'ONLINE').length;
  const warningCount = sensors.filter(s => s.status === 'WARNING').length;
  const offlineCount = sensors.filter(s => s.status === 'OFFLINE').length;

  return (
    <div className="space-y-6 pb-16">
      
      {/* ⭐ NETWORK FAILURE / OFFLINE EDGE MODE INTERACTIVE DEMO (JUROR QUESTION SHOWCASE) */}
      <div className={`rounded-3xl p-6 border-2 transition-all shadow-md ${
        isOfflineMode 
          ? 'bg-amber-50/70 border-amber-400 ring-4 ring-amber-400/20' 
          : 'bg-white border-slate-200/90'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                ⭐ EDGE RESILIENCE & OFFLINE FAILOVER
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Addresses jury question on network outage continuity
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {isOfflineMode ? '⚠️ Offline Edge Mode Activated' : '🌐 Cloud & Edge Synchronization Status'}
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl">
              When venue internet fails, FlowNavigator transitions to localized ESP32 edge ring-buffering. Crowd counting and basic risk predictions continue uninterrupted on the local venue network.
            </p>
          </div>

          {/* Interactive Toggle for Demonstration */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleOfflineMode()}
              disabled={isSyncingData}
              className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                isOfflineMode
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/25 animate-pulse'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isOfflineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span>{isOfflineMode ? 'Restore Internet Uplink' : 'Simulate Network Disconnection'}</span>
            </button>
          </div>
        </div>

        {/* ANIMATED ARCHITECTURE FLOW (CHANGES BASED ON NETWORK STATUS) */}
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Dynamic Telemetry Pipeline:</span>
            <span className={isOfflineMode ? 'text-amber-700 font-black' : 'text-emerald-700 font-black'}>
              {isOfflineMode ? '⚠️ Operating via Local Edge Buffer' : '🟢 Operating via Direct Cloud Sync'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            {/* Stage 1: Sensor */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-2xs">
              <Cpu className="w-5 h-5 text-blue-600 mx-auto" />
              <strong className="text-slate-900 block font-black">1. Zone Sensor</strong>
              <p className="text-[10px] text-slate-500">Dual-Beam IR / LiDAR</p>
            </div>

            {/* Stage 2: ESP32 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-2xs">
              <Server className="w-5 h-5 text-indigo-600 mx-auto" />
              <strong className="text-slate-900 block font-black">2. ESP32 Node</strong>
              <p className="text-[10px] text-slate-500">Microcontroller GPIO</p>
            </div>

            {/* Stage 3: Edge Buffer */}
            <div className={`p-4 rounded-2xl border text-center space-y-1 transition-all ${
              isOfflineMode 
                ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400 text-amber-950 font-bold' 
                : 'bg-white border-slate-200'
            }`}>
              <HardDrive className={`w-5 h-5 mx-auto ${isOfflineMode ? 'text-amber-700 animate-pulse' : 'text-slate-500'}`} />
              <strong className="block font-black">3. Edge Buffer</strong>
              <p className="text-[10px] text-slate-500">
                {isOfflineMode ? `${bufferedTelemetryCount} Packets Buffered` : 'Passthrough Mode'}
              </p>
            </div>

            {/* Stage 4: Processing Mode */}
            <div className={`p-4 rounded-2xl border text-center space-y-1 transition-all ${
              isOfflineMode ? 'bg-amber-50 border-amber-300' : 'bg-blue-50 border-blue-200'
            }`}>
              <Activity className={`w-5 h-5 mx-auto ${isOfflineMode ? 'text-amber-700' : 'text-blue-600'}`} />
              <strong className="block font-black">
                {isOfflineMode ? '4. Edge Gateway' : '4. Internet Cloud'}
              </strong>
              <p className="text-[10px] text-slate-500">
                {isOfflineMode ? 'Local Venue LAN' : 'ThingSpeak / Backend'}
              </p>
            </div>

            {/* Stage 5: Output */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
              <strong className="text-slate-900 block font-black">5. FlowNavigator</strong>
              <p className="text-[10px] text-slate-500">Continuous Risk Analysis</p>
            </div>
          </div>

          {/* Offline Mode Information Banner */}
          {isOfflineMode && (
            <div className="bg-amber-100/80 border border-amber-300 rounded-2xl p-4 text-xs space-y-2 text-amber-950">
              <div className="flex items-center gap-2 font-black">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Offline Continuity Guarantees:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-amber-900">
                <li>Crowd counting continues uninterrupted locally via ESP32 flash memory ring-buffer.</li>
                <li>Data is temporarily buffered ({bufferedTelemetryCount} sensor packets logged with timestamps).</li>
                <li>Basic crowd risk analysis remains active across the local venue mesh network.</li>
              </ul>
            </div>
          )}

          {/* Synchronizing Progress Animation */}
          {isSyncingData && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs space-y-2 text-blue-950">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Synchronising buffered data to cloud...</span>
                </span>
                <span className="font-mono text-blue-700 font-black">{offlineSyncProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${offlineSyncProgress}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500">Flushing edge ring-buffer and restoring cloud telemetry.</p>
            </div>
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
