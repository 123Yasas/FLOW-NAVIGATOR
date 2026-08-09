import React, { useState } from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { SchematicVenueMap } from '../map/SchematicVenueMap';
import { 
  Users, 
  MapPin, 
  Navigation, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bell, 
  Flame, 
  ArrowRight, 
  Compass, 
  Zap,
  Info,
  ChevronRight,
  Accessibility
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const CitizenView: React.FC = () => {
  const { 
    citizenTab, 
    setCitizenTab, 
    selectedLocation, 
    locations, 
    setSelectedLocation, 
    routes, 
    zones,
    notifications, 
    emergencyMode,
    selectedDestinationZone,
    setSelectedDestinationZone,
    getBestRouteForDestination,
    simpleAccessibilityMode,
    setSimpleAccessibilityMode
  } = useCrowd();

  const [voiceGuidanceActive, setVoiceGuidanceActive] = useState(false);
  const [activeNavigationRouteId, setActiveNavigationRouteId] = useState<string | null>(null);

  // Get dynamic route advice
  const { recommended, alternatives, avoid } = getBestRouteForDestination(selectedDestinationZone);

  // Simulated AI forecast line data
  const forecastData = [
    { time: 'Now', routeB: 68, routeC: 34, routeA: 92 },
    { time: '+5m', routeB: 74, routeC: 36, routeA: 94 },
    { time: '+10m', routeB: 81, routeC: 38, routeA: 96 },
    { time: '+15m', routeB: 88, routeC: 41, routeA: 98 },
    { time: '+20m', routeB: 92, routeC: 45, routeA: 99 },
  ];

  // Helper speech synthesizer for voice guidance
  const speakGuidance = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartNavigation = (routeId: string, routeName: string) => {
    setActiveNavigationRouteId(routeId);
    const text = `Navigation started for ${routeName}. Take Route C through the South Express Bypass for the lowest 6 minute wait time.`;
    if (voiceGuidanceActive) {
      speakGuidance(text);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-20">
      
      {/* Top Mobile Header & Location Picker */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              LIVE CITIZEN APP
            </span>
            <span className="text-xs font-medium text-slate-500">Public Guidance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <span>{selectedLocation.name}</span>
          </h2>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{selectedLocation.city} • IoT Sensor Network Active</span>
          </p>
        </div>

        {/* Location Dropdown Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <select
            value={selectedLocation.id}
            onChange={(e) => {
              const loc = locations.find(l => l.id === e.target.value);
              if (loc) setSelectedLocation(loc);
            }}
            className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden cursor-pointer"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Emergency Mode Alert Banner */}
      {emergencyMode && (
        <div className="bg-red-600 text-white rounded-2xl p-5 shadow-xl border-2 border-red-500 animate-pulse space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">🚨 EMERGENCY EVACUATION MODE</h3>
              <p className="text-sm text-red-100 mt-0.5">
                Please avoid Zone C and North Shrine corridors. Follow staff instructions and proceed calmly to the safest evacuation route.
              </p>
            </div>
          </div>

          <div className="bg-white/10 p-3 rounded-xl border border-white/20 flex items-center justify-between text-xs sm:text-sm font-bold">
            <span>RECOMMENDED EVACUATION ROUTE: Route D (South Bypass)</span>
            <button 
              onClick={() => handleStartNavigation('route-d', 'Emergency Route D')}
              className="bg-white text-red-700 px-3 py-1.5 rounded-lg font-extrabold shadow-sm hover:bg-red-50"
            >
              Evacuate via Route D
            </button>
          </div>
        </div>
      )}

      {/* Overall Crowd Status Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Overall Crowd</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-lg font-extrabold text-slate-900">Moderate</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Safe venue capacity</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total People</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-extrabold text-slate-900">12,450</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all 8 zones</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Zones</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg font-extrabold text-slate-900">8 / 8</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">18 sensors online</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Optimal Route</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg font-extrabold text-emerald-600">Route C</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">6 min wait (34%)</p>
        </div>
      </div>

      {/* Citizen Navigation Tab Strip */}
      <div className="flex items-center bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80 text-xs sm:text-sm font-bold gap-1">
        <button
          onClick={() => setCitizenTab('live_crowd')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            citizenTab === 'live_crowd'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Live Crowd Map</span>
        </button>

        <button
          onClick={() => setCitizenTab('route_finder')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            citizenTab === 'route_finder'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Smart Routes</span>
        </button>

        <button
          onClick={() => setCitizenTab('notifications')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
            citizenTab === 'notifications'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts</span>
          {notifications.some(n => !n.read) && (
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          )}
        </button>
      </div>

      {/* Voice & Accessibility Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setVoiceGuidanceActive(!voiceGuidanceActive)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              voiceGuidanceActive 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {voiceGuidanceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{voiceGuidanceActive ? 'Voice Guidance ON' : 'Enable Voice Audio'}</span>
          </button>

          <span className="text-slate-600 hidden sm:inline">Spoken directions for elderly / visually impaired</span>
        </div>

        <button
          onClick={() => setSimpleAccessibilityMode(!simpleAccessibilityMode)}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
            simpleAccessibilityMode
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Accessibility className="w-4 h-4" />
          <span>{simpleAccessibilityMode ? 'Senior Mode Active' : 'Senior / Simple Mode'}</span>
        </button>
      </div>

      {/* SENIOR / ELDERLY SIMPLE ACCESSIBILITY OVERLAY MODE */}
      {simpleAccessibilityMode && (
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="bg-amber-200 text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Senior Citizens & Accessibility View
            </span>
            <button 
              onClick={() => setSimpleAccessibilityMode(false)}
              className="text-xs text-amber-800 underline font-bold"
            >
              Exit Simple View
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-emerald-700 uppercase">Best & Safest Way</span>
              <h3 className="text-3xl font-black text-emerald-800">USE ROUTE C</h3>
              <p className="text-lg font-bold text-slate-800">Shortest Wait: 6 Minutes</p>
              <p className="text-sm font-semibold text-slate-600">Follow the GREEN signs along South Express Walkway.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs space-y-2">
              <span className="text-xs font-extrabold text-red-700 uppercase">DO NOT USE</span>
              <h3 className="text-2xl font-black text-red-800">AVOID ROUTE A</h3>
              <p className="text-base font-bold text-slate-800">Long Wait: 28 Minutes (Crowded)</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: LIVE CROWD MAP & ROUTE OVERVIEW */}
      {citizenTab === 'live_crowd' && (
        <div className="space-y-6">
          {/* Interactive Schematic Venue Map Component */}
          <SchematicVenueMap />

          {/* HIGHLIGHTED RECOMMENDED ROUTE CARD (Requirement #5) */}
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white rounded-2xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-extrabold bg-white text-emerald-800 rounded-full uppercase tracking-wider shadow-xs">
                    ★ RECOMMENDED ROUTE
                  </span>
                  <span className="text-xs text-emerald-100 font-semibold">Lowest Crowd + Shortest Wait</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Route C - North Express Queue</h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                  Lowest crowd level (34% occupied) with fast-moving turnstiles. Estimated wait time is only 6 minutes.
                </p>
              </div>

              <div className="shrink-0 flex sm:flex-col items-center justify-between sm:justify-center gap-2 bg-white/15 p-3.5 rounded-xl backdrop-blur-xs border border-white/20">
                <div className="text-center">
                  <span className="text-xs text-emerald-100 font-semibold block">Wait Time</span>
                  <span className="text-2xl font-black">6 MIN</span>
                </div>
                <button
                  onClick={() => handleStartNavigation('route-c', 'Route C - North Express')}
                  className="px-5 py-2.5 bg-white text-emerald-800 font-black rounded-xl text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Navigation className="w-4 h-4 fill-emerald-800" />
                  <span>Navigate Me</span>
                </button>
              </div>
            </div>
          </div>

          {/* ALL LIVE ROUTES DISPLAY CARDS (Requirement #5) */}
          <div className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <span>All Available Venue Routes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {routes.map(route => {
                const isRecommended = route.tag === 'RECOMMENDED';
                const isAvoid = route.tag === 'AVOID';

                return (
                  <div 
                    key={route.id}
                    className={`bg-white rounded-2xl p-5 border-2 transition-all relative shadow-xs flex flex-col justify-between ${
                      isRecommended 
                        ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10' 
                        : isAvoid 
                          ? 'border-red-300 bg-red-50/20' 
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-slate-900 text-base">{route.name}</span>
                        <span 
                          className="px-2.5 py-0.5 text-xs font-bold rounded-full text-white shadow-2xs"
                          style={{ backgroundColor: route.color }}
                        >
                          {route.tag.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-4">{route.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block">Occupancy</span>
                        <span className="font-extrabold text-slate-900 text-sm">{route.occupancyPercentage}% Occupied</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block">Est. Wait</span>
                        <span className="font-extrabold text-slate-900 text-sm">{route.estimatedWaitMinutes} min</span>
                      </div>

                      <button
                        onClick={() => handleStartNavigation(route.id, route.name)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                          isAvoid 
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                        }`}
                        disabled={isAvoid}
                      >
                        {isAvoid ? 'Avoid' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI CONGESTION PREDICTION FORECAST CARD (Requirement #9) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">AI Crowd Forecast & Congestion Prediction</h3>
                </div>
                <p className="text-xs text-slate-500">Predictive analysis based on current entry velocity</p>
              </div>

              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
                Demo Sensor Data
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">
                  "Route B is currently at 68% capacity and predicted to reach HIGH congestion in approximately 12 minutes."
                </p>
                <p className="text-amber-800">
                  <span className="font-bold">AI Recommendation:</span> Divert to Route C now to bypass the upcoming queue build-up.
                </p>
              </div>
            </div>

            {/* Sparkline Chart */}
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="routeA" name="Route A" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="routeB" name="Route B" stroke="#eab308" strokeWidth={2} />
                  <Line type="monotone" dataKey="routeC" name="Route C" stroke="#22c55e" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* WAITING TIME DYNAMIC CALCULATION EXPLAINER CARD (Requirement #8) */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>How Waiting Time is Estimated</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Waiting time is calculated dynamically in real-time using:
              <span className="font-bold text-slate-800"> Current Crowd Level</span>, 
              <span className="font-bold text-slate-800"> Sensor Entry Rate (+people/min)</span>, and 
              <span className="font-bold text-slate-800"> Sensor Exit Rate (-people/min)</span>. 
              Dual-laser ESP32 counters at turnstiles feed flow velocity into our decision engine every 2 seconds.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: SMART ROUTE RECOMMENDATION ENGINE (Requirement #7) */}
      {citizenTab === 'route_finder' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <span>Smart Route Finder</span>
              </h3>
              <p className="text-xs text-slate-500">
                Select your intended destination inside the venue for instant crowd-optimized routing.
              </p>
            </div>

            {/* Destination Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Where do you want to go?</label>
              <select
                value={selectedDestinationZone}
                onChange={(e) => setSelectedDestinationZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="zone-c">Main Shrine / Inner Sanctum</option>
                <option value="zone-e">Food Court & Annadhanam Hall</option>
                <option value="zone-f">Parking Lot & Bus Terminal</option>
                <option value="zone-g">Medical Center & First Aid Bay</option>
                <option value="zone-h">Ropeway & Hilltop Staircase</option>
              </select>
            </div>

            {/* Calculated Results Box */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              
              {/* Recommended Route Card */}
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-xs font-black bg-emerald-600 text-white rounded-full uppercase tracking-wider">
                    RECOMMENDED ROUTE
                  </span>
                  <span className="text-xs font-bold text-emerald-800">{recommended.occupancyPercentage}% Capacity</span>
                </div>

                <h4 className="text-xl font-extrabold text-emerald-900">{recommended.name}</h4>
                
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1.5 text-slate-700">
                  <p className="font-bold text-emerald-800">Why this route?</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Lowest overall crowd density</li>
                    <li>Shortest estimated wait time ({recommended.estimatedWaitMinutes} minutes)</li>
                    <li>Safe capacity available along all intermediate zones</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-800">
                    <span>Est. Walk: {recommended.estimatedWalkMinutes} mins</span>
                    <span>Est. Wait: {recommended.estimatedWaitMinutes} mins</span>
                  </div>

                  <button
                    onClick={() => handleStartNavigation(recommended.id, recommended.name)}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    Start Navigation
                  </button>
                </div>
              </div>

              {/* Alternative Routes */}
              {alternatives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Alternative Routes</h4>
                  {alternatives.map(alt => (
                    <div key={alt.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{alt.name}</span>
                        <span className="text-slate-500">Wait: {alt.estimatedWaitMinutes} mins • {alt.occupancyPercentage}% full</span>
                      </div>
                      <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                        Moderate
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Routes to Avoid */}
              {avoid.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-red-700 uppercase tracking-wider">Routes to Avoid</h4>
                  {avoid.map(av => (
                    <div key={av.id} className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-red-900 block">{av.name}</span>
                        <span className="text-red-700">Congested: {av.occupancyPercentage}% full ({av.estimatedWaitMinutes} min queue)</span>
                      </div>
                      <span className="font-bold text-red-700 bg-white border border-red-300 px-2.5 py-1 rounded-lg">
                        HEAVY TRAFFIC
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS CENTER (Requirement #10) */}
      {citizenTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <span>Live Alert Center</span>
            </h3>
            <span className="text-xs text-slate-500">{notifications.length} alerts received</span>
          </div>

          <div className="space-y-3">
            {notifications.map(n => {
              const getBorder = () => {
                if (n.severity === 'emergency' || n.severity === 'critical') return 'border-red-400 bg-red-50/50';
                if (n.severity === 'warning') return 'border-amber-300 bg-amber-50/50';
                return 'border-slate-200 bg-white';
              };

              return (
                <div key={n.id} className={`p-4 rounded-2xl border-2 transition-all shadow-xs ${getBorder()}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    <span className="text-[11px] font-semibold text-slate-500">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700">{n.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
