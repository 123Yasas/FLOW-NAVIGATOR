import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Zone,
  Route,
  IoTSensor,
  AlertNotification,
  AIRecommendation,
  LocationVenue,
  UserRole,
  AdminTab,
  CitizenTab,
  PreEventPlannerInput,
  PreEventPlanOutput,
  ZoneStatus,
  RouteRecommendation
} from '../types';
import {
  INITIAL_LOCATIONS,
  INITIAL_ZONES,
  INITIAL_ROUTES,
  INITIAL_SENSORS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AI_RECOMMENDATIONS,
  HISTORICAL_ANALYTICS
} from '../data/mockData';

interface CrowdContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  citizenTab: CitizenTab;
  setCitizenTab: (tab: CitizenTab) => void;
  
  locations: LocationVenue[];
  selectedLocation: LocationVenue;
  setSelectedLocation: (loc: LocationVenue) => void;
  
  zones: Zone[];
  routes: Route[];
  sensors: IoTSensor[];
  notifications: AlertNotification[];
  aiRecommendations: AIRecommendation[];
  
  emergencyMode: boolean;
  simulationActive: boolean;
  setSimulationActive: (active: boolean) => void;
  
  hackathonDemoStep: number;
  setHackathonDemoStep: (step: number) => void;
  nextHackathonStep: () => void;
  prevHackathonStep: () => void;
  
  // Actions
  simulateCrowdSpikeRouteC: () => void;
  simulateCrowdDecreaseRouteC: () => void;
  simulateSensorOffline: (sensorId?: string) => void;
  toggleEmergencyMode: (enabled?: boolean) => void;
  toggleZoneAccess: (zoneId: string, restricted: boolean) => void;
  resetToBaseline: () => void;
  markNotificationRead: (id: string) => void;
  
  // Destination recalculation
  selectedDestinationZone: string;
  setSelectedDestinationZone: (zoneId: string) => void;
  getBestRouteForDestination: (destZoneId: string) => { recommended: Route; alternatives: Route[]; avoid: Route[] };
  
  // Pre-event planning AI
  generateEventPlan: (input: PreEventPlannerInput) => Promise<PreEventPlanOutput>;
  isGeneratingPlan: boolean;

  // Accessibility & Simple View for Elderly
  simpleAccessibilityMode: boolean;
  setSimpleAccessibilityMode: (enabled: boolean) => void;
}

const CrowdContext = createContext<CrowdContextType | undefined>(undefined);

export const CrowdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('landing');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [citizenTab, setCitizenTab] = useState<CitizenTab>('live_crowd');
  
  const [locations] = useState<LocationVenue[]>(INITIAL_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationVenue>(INITIAL_LOCATIONS[0]);
  
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [sensors, setSensors] = useState<IoTSensor[]>(INITIAL_SENSORS);
  const [notifications, setNotifications] = useState<AlertNotification[]>(INITIAL_NOTIFICATIONS);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>(INITIAL_AI_RECOMMENDATIONS);
  
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [simulationActive, setSimulationActive] = useState<boolean>(true);
  const [hackathonDemoStep, setHackathonDemoStep] = useState<number>(0);
  
  const [selectedDestinationZone, setSelectedDestinationZone] = useState<string>('zone-c');
  const [simpleAccessibilityMode, setSimpleAccessibilityMode] = useState<boolean>(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  // Auto recalculate zone status & routes based on current counts
  const updateDerivedState = (updatedZones: Zone[]) => {
    // 1. Recalculate status for each zone
    const recalculatedZones = updatedZones.map(z => {
      const occ = (z.currentCount / z.capacity) * 100;
      let status: ZoneStatus = 'SAFE';
      if (occ > 90) status = 'CRITICAL';
      else if (occ > 80) status = 'HIGH';
      else if (occ > 60) status = 'MODERATE';
      
      return { ...z, status };
    });

    // 2. Recalculate routes
    const zoneMap = new Map(recalculatedZones.map(z => [z.id, z]));
    
    const recalculatedRoutes = routes.map(r => {
      // Find average or peak occupancy along route path
      const pathZoneObjs = r.pathZones.map(id => zoneMap.get(id)).filter(Boolean) as Zone[];
      const maxOccupancy = Math.max(...pathZoneObjs.map(z => (z.currentCount / z.capacity) * 100));
      
      let status: ZoneStatus = 'SAFE';
      let tag: RouteRecommendation = 'RECOMMENDED';
      let color = '#22c55e'; // green
      let estWait = Math.round((r.estimatedWalkMinutes * 0.8) + (maxOccupancy > 80 ? (maxOccupancy - 50) * 0.5 : 2));

      if (maxOccupancy > 90) {
        status = 'CRITICAL';
        tag = 'AVOID';
        color = '#ef4444'; // red
        estWait = Math.max(estWait, 28);
      } else if (maxOccupancy > 80) {
        status = 'HIGH';
        tag = 'HEAVY_TRAFFIC';
        color = '#f97316'; // orange
        estWait = Math.max(estWait, 18);
      } else if (maxOccupancy > 60) {
        status = 'MODERATE';
        tag = 'MODERATE';
        color = '#eab308'; // yellow
        estWait = Math.max(estWait, 12);
      } else {
        status = 'SAFE';
        tag = 'RECOMMENDED';
        color = '#22c55e'; // green
        estWait = Math.min(estWait, 8);
      }

      if (emergencyMode) {
        if (r.id === 'route-d') {
          tag = 'EVACUATION_ROUTE';
          color = '#22c55e';
          status = 'SAFE';
        } else {
          tag = 'AVOID';
          color = '#ef4444';
          status = 'CRITICAL';
        }
      }

      return {
        ...r,
        occupancyPercentage: Math.round(maxOccupancy),
        estimatedWaitMinutes: Math.round(estWait),
        status,
        tag,
        color
      };
    });

    setZones(recalculatedZones);
    setRoutes(recalculatedRoutes);
  };

  // Live IoT sensor simulation ticker (Subtle live counts pulse)
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      setSensors(prevSensors => 
        prevSensors.map(s => {
          if (s.status === 'OFFLINE') return s;
          const deltaIn = Math.floor(Math.random() * 5);
          const deltaOut = Math.floor(Math.random() * 4);
          const newIn = s.peopleIn + deltaIn;
          const newOut = s.peopleOut + deltaOut;
          const newCount = Math.max(20, s.currentCount + (deltaIn - deltaOut));
          return {
            ...s,
            peopleIn: newIn,
            peopleOut: newOut,
            currentCount: newCount,
            lastUpdated: '1 sec ago'
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [simulationActive]);

  // Handle Hackathon Demo Scenario Step Trigger
  const runHackathonStep = (step: number) => {
    setHackathonDemoStep(step);
    
    switch (step) {
      case 1: // Reset to baseline
        resetToBaseline();
        setRole('visitor');
        setCitizenTab('live_crowd');
        break;
      case 2: // View Route C recommended
        setRole('visitor');
        setCitizenTab('route_finder');
        break;
      case 3: // Admin spikes crowd in Route C / Zone C
        setRole('admin');
        setAdminTab('dashboard');
        simulateCrowdSpikeRouteC();
        break;
      case 4: // Citizen app updates, showing Route C RED & Route D recommended
        setRole('visitor');
        setCitizenTab('route_finder');
        break;
      case 5: // Admin restricts access & activates emergency mode
        setRole('admin');
        setAdminTab('access_control');
        toggleZoneAccess('zone-c', true);
        break;
      case 6: // Emergency Evacuation Mode triggered
        toggleEmergencyMode(true);
        setRole('visitor');
        setCitizenTab('emergency');
        break;
      case 7: // Back to Normal Mode
        toggleEmergencyMode(false);
        resetToBaseline();
        setRole('admin');
        setAdminTab('dashboard');
        break;
      default:
        break;
    }
  };

  const nextHackathonStep = () => {
    const next = (hackathonDemoStep + 1) % 8;
    runHackathonStep(next);
  };

  const prevHackathonStep = () => {
    const prev = hackathonDemoStep === 0 ? 7 : hackathonDemoStep - 1;
    runHackathonStep(prev);
  };

  // Action implementations
  const simulateCrowdSpikeRouteC = () => {
    const updatedZones = zones.map(z => {
      if (z.id === 'zone-c') {
        return { ...z, currentCount: 790, status: 'CRITICAL' as ZoneStatus };
      }
      if (z.id === 'zone-b') {
        return { ...z, currentCount: 710, status: 'HIGH' as ZoneStatus };
      }
      return z;
    });

    const newNotification: AlertNotification = {
      id: `alert-${Date.now()}`,
      timestamp: 'Just now',
      title: '🚨 CRITICAL: Route C Congestion Spike',
      message: 'North Shrine Corridor capacity reached 98%! Route C is now CRITICAL. Recommending Route D.',
      severity: 'critical',
      zoneId: 'zone-c',
      read: false
    };

    const newRec: AIRecommendation = {
      id: `rec-${Date.now()}`,
      priority: 'CRITICAL',
      title: 'Reroute incoming traffic to Route D immediately',
      actionMessage: 'Zone C choke point detected. Close Gate A entry turnstiles for 15 minutes and direct crowd to South Bypass Lane.',
      zoneId: 'zone-c',
      impactEstimate: 'Prevents crowd stampede risk at Sanctum entrance',
      timestamp: 'Just now'
    };

    setNotifications(prev => [newNotification, ...prev]);
    setAiRecommendations(prev => [newRec, ...prev]);
    updateDerivedState(updatedZones);
  };

  const simulateCrowdDecreaseRouteC = () => {
    const updatedZones = zones.map(z => {
      if (z.id === 'zone-c') {
        return { ...z, currentCount: 320, status: 'SAFE' as ZoneStatus, accessRestricted: false };
      }
      return z;
    });

    const newNotification: AlertNotification = {
      id: `alert-${Date.now()}`,
      timestamp: 'Just now',
      title: 'Zone C Traffic Cleared',
      message: 'North Shrine Corridor occupancy has dropped to 40%. Route C is safe and recommended.',
      severity: 'info',
      zoneId: 'zone-c',
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    updateDerivedState(updatedZones);
  };

  const simulateSensorOffline = (sensorId = 'SENSOR-ESP32-004') => {
    setSensors(prev => 
      prev.map(s => s.id === sensorId ? { ...s, status: 'OFFLINE', lastUpdated: 'Disconnected' } : s)
    );

    const newNotification: AlertNotification = {
      id: `alert-${Date.now()}`,
      timestamp: 'Just now',
      title: 'IoT Sensor Offline Warning',
      message: `Sensor ${sensorId} lost Wi-Fi heartbeat connection. Backup LiDAR sensor activated automatically.`,
      severity: 'warning',
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const toggleEmergencyMode = (enabled?: boolean) => {
    const targetState = enabled !== undefined ? enabled : !emergencyMode;
    setEmergencyMode(targetState);

    const newNotification: AlertNotification = {
      id: `alert-${Date.now()}`,
      timestamp: 'Just now',
      title: targetState ? '🚨 EMERGENCY EVACUATION ACTIVATED' : 'Emergency Mode Deactivated',
      message: targetState 
        ? 'ALERT: Evacuation protocol active. Avoid Zone C and Zone B. Proceed calmly to South Evacuation Route D.'
        : 'Emergency mode cleared. Normal venue crowd guidance resumed.',
      severity: targetState ? 'emergency' : 'info',
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Recalculate routes with emergency flags
    const zoneMap = new Map(zones.map(z => [z.id, z]));
    setRoutes(prev => prev.map(r => {
      if (targetState) {
        if (r.id === 'route-d') {
          return { ...r, tag: 'EVACUATION_ROUTE', status: 'SAFE', color: '#22c55e', estimatedWaitMinutes: 3 };
        } else {
          return { ...r, tag: 'AVOID', status: 'CRITICAL', color: '#ef4444', estimatedWaitMinutes: 99 };
        }
      }
      return r;
    }));
  };

  const toggleZoneAccess = (zoneId: string, restricted: boolean) => {
    const updatedZones = zones.map(z => z.id === zoneId ? { ...z, accessRestricted: restricted } : z);
    setZones(updatedZones);

    const zoneName = zones.find(z => z.id === zoneId)?.name || zoneId;
    const newNotification: AlertNotification = {
      id: `alert-${Date.now()}`,
      timestamp: 'Just now',
      title: restricted ? `Gate Access RESTRICTED: ${zoneName}` : `Gate Access ALLOWED: ${zoneName}`,
      message: restricted 
        ? `Automated barrier deployed at ${zoneName}. Visitors redirected to alternative routes.`
        : `Access restored for ${zoneName}.`,
      severity: restricted ? 'warning' : 'info',
      zoneId,
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const resetToBaseline = () => {
    setZones(INITIAL_ZONES);
    setRoutes(INITIAL_ROUTES);
    setSensors(INITIAL_SENSORS);
    setEmergencyMode(false);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAiRecommendations(INITIAL_AI_RECOMMENDATIONS);
    setHackathonDemoStep(0);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getBestRouteForDestination = (destZoneId: string) => {
    // Filter routes matching destination
    const matching = routes.filter(r => r.destinationZoneId === destZoneId);
    
    // Fallback if no specific route
    const allSorted = [...(matching.length > 0 ? matching : routes)].sort((a, b) => a.estimatedWaitMinutes - b.estimatedWaitMinutes);

    const recommended = allSorted[0] || routes[0];
    const alternatives = allSorted.slice(1).filter(r => r.status !== 'CRITICAL');
    const avoid = allSorted.filter(r => r.status === 'CRITICAL');

    return { recommended, alternatives, avoid };
  };

  // AI Pre-Event Planner API integration
  const generateEventPlan = async (input: PreEventPlannerInput): Promise<PreEventPlanOutput> => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('/api/gemini/pre-event-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (res.ok) {
        const data = await res.json();
        setIsGeneratingPlan(false);
        return data;
      }
    } catch (e) {
      console.warn('API call failed, falling back to local intelligent AI generator:', e);
    }

    // Local fallback intelligent response generator
    await new Promise(r => setTimeout(r, 1800)); // realistic feel
    setIsGeneratingPlan(false);

    const totalExpected = input.expectedCrowd || 25000;
    const estSensorsNeeded = Math.ceil(input.zonesCount * 2.5);

    return {
      eventName: input.eventName || 'Palani Grand Festival',
      riskAssessment: {
        overallRiskLevel: totalExpected > 30000 ? 'HIGH' : 'MEDIUM',
        summary: `Analysis of ${totalExpected.toLocaleString()} expected attendees indicates high queue pressure around inner bottleneck corridors during peak hours (6:00 PM - 8:30 PM).`,
        highRiskZones: ['Inner Sanctum Gate', 'Food Court Corridor', 'Central Staircase Queue']
      },
      recommendedSensorsCount: estSensorsNeeded,
      sensorPlacements: [
        { location: 'Main Entrance Gates (Entrances 1-4)', reason: 'Real-time influx metering and entry vs exit rate monitoring.' },
        { location: 'Inner Sanctum Queue Bottleneck', reason: 'High-density mmWave radar sensor for instant stampede risk detection.' },
        { location: 'West Arcade Food Stall Intersection', reason: 'Detect crowd stagnation near dining areas.' },
        { location: 'South Evacuation Bypass Route', reason: 'Monitor capacity for rapid emergency rerouting.' }
      ],
      suggestedRouteDistribution: [
        { routeName: 'Route C (North Express)', allocationPercentage: 45, note: 'Primary recommended lane for 70% of main influx' },
        { routeName: 'Route B (West Arcade)', allocationPercentage: 35, note: 'Secondary lane for visitors visiting shops' },
        { routeName: 'Route D (South Bypass)', allocationPercentage: 20, note: 'Reserved for elderly, medical, and exit traffic' }
      ],
      peakTimeEstimate: '6:30 PM - 8:45 PM (Expected Influx Peak: 4,200 people/hour)',
      staffDeploymentAreas: [
        { area: 'Main Entrance Plaza', personnelNeeded: 12, primaryTask: 'Guide visitors to Route C and manage turnstile lines' },
        { area: 'Inner Sanctum Choke Point', personnelNeeded: 18, primaryTask: 'Enforce batch entry and monitor automated gates' },
        { area: 'South Evacuation Path', personnelNeeded: 8, primaryTask: 'Keep emergency lanes 100% clear at all times' }
      ],
      bottleneckPredictions: [
        'High risk of crowd buildup at Sanctum Entrance between 7:00 PM and 8:15 PM.',
        'Possible 20-minute waiting line at Food Court entrance around 1:00 PM.',
        'Staircase queue convergence with ropeway boarding line at 5:30 PM.'
      ]
    };
  };

  return (
    <CrowdContext.Provider
      value={{
        role,
        setRole,
        adminTab,
        setAdminTab,
        citizenTab,
        setCitizenTab,
        locations,
        selectedLocation,
        setSelectedLocation,
        zones,
        routes,
        sensors,
        notifications,
        aiRecommendations,
        emergencyMode,
        simulationActive,
        setSimulationActive,
        hackathonDemoStep,
        setHackathonDemoStep,
        nextHackathonStep,
        prevHackathonStep,
        simulateCrowdSpikeRouteC,
        simulateCrowdDecreaseRouteC,
        simulateSensorOffline,
        toggleEmergencyMode,
        toggleZoneAccess,
        resetToBaseline,
        markNotificationRead,
        selectedDestinationZone,
        setSelectedDestinationZone,
        getBestRouteForDestination,
        generateEventPlan,
        isGeneratingPlan,
        simpleAccessibilityMode,
        setSimpleAccessibilityMode
      }}
    >
      {children}
    </CrowdContext.Provider>
  );
};

export const useCrowd = () => {
  const context = useContext(CrowdContext);
  if (!context) {
    throw new Error('useCrowd must be used within a CrowdProvider');
  }
  return context;
};
