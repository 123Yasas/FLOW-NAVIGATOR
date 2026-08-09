import React, { useState } from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { Zone, Route } from '../../types';
import { Users, AlertTriangle, ArrowRight, Shield, Zap, Lock, Unlock, Compass } from 'lucide-react';

interface SchematicVenueMapProps {
  onZoneSelect?: (zoneId: string) => void;
  selectedZoneId?: string;
  showFullDetails?: boolean;
}

export const SchematicVenueMap: React.FC<SchematicVenueMapProps> = ({ 
  onZoneSelect,
  selectedZoneId,
  showFullDetails = true 
}) => {
  const { zones, routes, emergencyMode, toggleZoneAccess } = useCrowd();
  const [activeHoverZone, setActiveHoverZone] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
        return { bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', fill: '#10b981' };
      case 'MODERATE':
        return { bg: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', fill: '#f59e0b' };
      case 'HIGH':
        return { bg: 'bg-orange-500', lightBg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', fill: '#f97316' };
      case 'CRITICAL':
        return { bg: 'bg-red-600', lightBg: 'bg-red-50', text: 'text-red-700', border: 'border-red-400', fill: '#ef4444' };
      default:
        return { bg: 'bg-slate-500', lightBg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300', fill: '#64748b' };
    }
  };

  const getZoneById = (id: string) => zones.find(z => z.id === id);

  const zoneA = getZoneById('zone-a') || zones[0];
  const zoneB = getZoneById('zone-b') || zones[1];
  const zoneC = getZoneById('zone-c') || zones[2];
  const zoneD = getZoneById('zone-d') || zones[3];
  const zoneE = getZoneById('zone-e') || zones[4];
  const zoneF = getZoneById('zone-f') || zones[5];
  const zoneH = getZoneById('zone-h') || zones[7];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-4 sm:p-6 overflow-hidden relative">
      {/* Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <span>Schematic Live Venue Map</span>
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
              IoT Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive people density map updated directly by ESP32 sensors
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold flex-wrap">
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Low (&lt;60%)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70 text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Moderate (61-80%)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/70 text-orange-800">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>High (81-90%)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200/70 text-red-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span>Critical (&gt;90%)</span>
          </div>
        </div>
      </div>

      {/* Emergency Mode Banner on Map */}
      {emergencyMode && (
        <div className="mb-4 bg-red-600 text-white rounded-xl p-3 text-xs sm:text-sm font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-bounce shrink-0" />
            <span>EMERGENCY EVACUATION MAP: Follow GREEN Route D to Emergency Exits!</span>
          </div>
          <span className="hidden sm:inline bg-white/20 px-2 py-0.5 rounded-md text-xs">Route D Active</span>
        </div>
      )}

      {/* Visual Venue Diagram Canvas */}
      <div className="relative w-full bg-slate-50/80 rounded-xl p-4 sm:p-6 border border-slate-200 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between">
        
        {/* Entrance Gate Banner */}
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
              IN
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">MAIN ENTRANCE PLAZA (ZONE A)</span>
              <p className="text-[11px] text-slate-500">Dual-Laser ESP32 Sensor Gate 1 & 2</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusColor(zoneA.status).lightBg} ${getStatusColor(zoneA.status).text} border ${getStatusColor(zoneA.status).border}`}>
              {zoneA.currentCount} / {zoneA.capacity} People
            </span>
          </div>
        </div>

        {/* Central Schematic Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
          
          {/* LEFT PATHWAY: ZONE B (West Arcade) */}
          <div 
            onClick={() => onZoneSelect?.('zone-b')}
            onMouseEnter={() => setActiveHoverZone('zone-b')}
            onMouseLeave={() => setActiveHoverZone(null)}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${getStatusColor(zoneB.status).lightBg} ${getStatusColor(zoneB.status).border} ${
              selectedZoneId === 'zone-b' || activeHoverZone === 'zone-b' ? 'ring-4 ring-blue-400/40 shadow-lg scale-[1.02]' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                {zoneB.code}
              </span>
              <span className={`w-3 h-3 rounded-full ${getStatusColor(zoneB.status).bg} ${zoneB.status === 'CRITICAL' ? 'animate-ping' : ''}`}></span>
            </div>

            <h4 className="font-bold text-slate-900 text-sm mb-1">{zoneB.name}</h4>
            <p className="text-[11px] text-slate-600 mb-3">{zoneB.description}</p>

            {/* Capacity Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Occupancy</span>
                <span>{Math.round((zoneB.currentCount / zoneB.capacity) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getStatusColor(zoneB.status).bg}`} 
                  style={{ width: `${Math.min(100, (zoneB.currentCount / zoneB.capacity) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>{zoneB.currentCount} / {zoneB.capacity}</span>
                <span className="text-amber-700 font-semibold">Route B Lane</span>
              </div>
            </div>

            {/* Access Restriction Indicator if toggled */}
            {zoneB.accessRestricted && (
              <div className="mt-2 bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center justify-between">
                <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Entry Restricted</span>
              </div>
            )}
          </div>

          {/* CENTER PATHWAY: ZONE C (North Shrine Corridor - Primary Choke Point) */}
          <div 
            onClick={() => onZoneSelect?.('zone-c')}
            onMouseEnter={() => setActiveHoverZone('zone-c')}
            onMouseLeave={() => setActiveHoverZone(null)}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${getStatusColor(zoneC.status).lightBg} ${getStatusColor(zoneC.status).border} ${
              selectedZoneId === 'zone-c' || activeHoverZone === 'zone-c' ? 'ring-4 ring-red-400/50 shadow-lg scale-[1.02]' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                {zoneC.code}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${getStatusColor(zoneC.status).bg} ${zoneC.status === 'CRITICAL' ? 'animate-pulse' : ''}`}>
                {zoneC.status}
              </span>
            </div>

            <h4 className="font-bold text-slate-900 text-sm mb-1">{zoneC.name}</h4>
            <p className="text-[11px] text-slate-600 mb-3">{zoneC.description}</p>

            {/* Capacity Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Inner Queue</span>
                <span className={zoneC.status === 'CRITICAL' ? 'text-red-700 font-extrabold' : ''}>
                  {Math.round((zoneC.currentCount / zoneC.capacity) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getStatusColor(zoneC.status).bg}`} 
                  style={{ width: `${Math.min(100, (zoneC.currentCount / zoneC.capacity) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>{zoneC.currentCount} / {zoneC.capacity}</span>
                <span className="text-red-600 font-bold">Main Shrine Choke</span>
              </div>
            </div>

            {/* Gate restriction status */}
            {zoneC.accessRestricted ? (
              <div className="mt-2.5 bg-red-100 border border-red-300 text-red-900 text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center justify-between shadow-2xs">
                <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-red-600" /> Barrier Closed</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleZoneAccess('zone-c', false); }} 
                  className="text-[10px] bg-white border border-red-300 text-red-700 px-2 py-0.5 rounded-md hover:bg-red-50"
                >
                  Unlock
                </button>
              </div>
            ) : (
              <div className="mt-2.5 bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center justify-between">
                <span>Gate Status: Open</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleZoneAccess('zone-c', true); }} 
                  className="text-[10px] bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-200"
                >
                  Restrict Entry
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PATHWAY: ZONE D (South Express Bypass - Recommended) */}
          <div 
            onClick={() => onZoneSelect?.('zone-d')}
            onMouseEnter={() => setActiveHoverZone('zone-d')}
            onMouseLeave={() => setActiveHoverZone(null)}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all relative ${getStatusColor(zoneD.status).lightBg} ${getStatusColor(zoneD.status).border} ${
              selectedZoneId === 'zone-d' || activeHoverZone === 'zone-d' ? 'ring-4 ring-emerald-400/50 shadow-lg scale-[1.02]' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                {zoneD.code}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white shadow-2xs">
                RECOMMENDED
              </span>
            </div>

            <h4 className="font-bold text-slate-900 text-sm mb-1">{zoneD.name}</h4>
            <p className="text-[11px] text-slate-600 mb-3">{zoneD.description}</p>

            {/* Capacity Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Bypass Load</span>
                <span className="text-emerald-700 font-bold">{Math.round((zoneD.currentCount / zoneD.capacity) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getStatusColor(zoneD.status).bg}`} 
                  style={{ width: `${Math.min(100, (zoneD.currentCount / zoneD.capacity) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
                <span>{zoneD.currentCount} / {zoneD.capacity}</span>
                <span className="text-emerald-700 font-bold">Fastest Flow (6m)</span>
              </div>
            </div>

            <div className="mt-2.5 bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-bold px-2 py-1 rounded-lg flex items-center justify-between">
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-emerald-600" /> Fast Moving Queue</span>
            </div>
          </div>

        </div>

        {/* Exit & Destination Plaza */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
              OUT
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">MAIN DESTINATION / SANCTUM & EXITS</span>
              <p className="text-[11px] text-slate-500">Zone F (Parking) & Zone E (Food Pavilion) Direct Outlets</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500">Connecting Sensors:</span>
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
              SENSOR-ESP32-005 & 008
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
