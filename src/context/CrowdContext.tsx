import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  VenuePlanInput,
  GeneratedLayout,
  VenueGenerationStep,
  PreEventPlannerInput,
  PreEventPlanOutput
} from '../types';
import {
  INITIAL_LOCATIONS,
  INITIAL_ZONES,
  INITIAL_ROUTES,
  INITIAL_SENSORS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AI_RECOMMENDATIONS
} from '../data/mockData';
import { SensorService } from '../services/sensorService';
import { CrowdService } from '../services/crowdService';
import { RouteService } from '../services/routeService';
import { VenueService } from '../services/venueService';
import { AlertService } from '../services/alertService';
import { SimulationService } from '../services/simulationService';

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
  toggleEmergencyMode: (enabled?: boolean) => void;
  simulationActive: boolean;
  setSimulationActive: (active: boolean) => void;

  // Offline / Edge Network Resilience
  isOfflineMode: boolean;
  toggleOfflineMode: (offline?: boolean) => void;
  isSyncingData: boolean;
  offlineSyncProgress: number;
  bufferedTelemetryCount: number;
  syncBufferedData: () => Promise<void>;

  // Smart Plan Layout State
  venuePlanInput: VenuePlanInput;
  setVenuePlanInput: React.Dispatch<React.SetStateAction<VenuePlanInput>>;
  generatedLayout: GeneratedLayout;
  isGeneratingLayout: boolean;
  layoutGenerationStep: VenueGenerationStep;
  generateSmartLayout: (customInput?: VenuePlanInput) => Promise<void>;
  isCrowdFlowSimulating: boolean;
  toggleCrowdFlowSimulation: () => void;

  // 10-Step Jury Demo Guided Mode
  juryDemoActive: boolean;
  setJuryDemoActive: (active: boolean) => void;
  juryDemoStep: number;
  setJuryDemoStep: (step: number) => void;
  nextJuryStep: () => void;
  prevJuryStep: () => void;
  startJuryDemo: () => void;
  closeJuryDemo: () => void;

  // Route & Destination Selection
  selectedStartZone: string;
  setSelectedStartZone: (zoneId: string) => void;
  selectedDestinationZone: string;
  setSelectedDestinationZone: (zoneId: string) => void;
  getBestRouteForDestination: (destZoneId: string) => { recommended: Route; alternatives: Route[]; avoid: Route[] };

  // Quick Action Scenarios
  simulateNormalFlow: () => void;
  simulateCrowdSurge: () => void;
  simulateCongestionEvent: () => void;
  simulateRecovery: () => void;
  toggleZoneAccess: (zoneId: string, restricted: boolean) => void;
  resetToBaseline: () => void;

  // Alerts Management
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  markNotificationRead: (id: string) => void;

  // Accessibility
  simpleAccessibilityMode: boolean;
  setSimpleAccessibilityMode: (enabled: boolean) => void;

  // AI Pre-Event Planning (Gemini/Fallback)
  generateEventPlan: (input: PreEventPlannerInput) => Promise<PreEventPlanOutput>;
  isGeneratingPlan: boolean;
}

const CrowdContext = createContext<CrowdContextType | undefined>(undefined);

export const CrowdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('landing');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [citizenTab, setCitizenTab] = useState<CitizenTab>('live_crowd');

  const [locations] = useState<LocationVenue[]>(INITIAL_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationVenue>(INITIAL_LOCATIONS[0]);

  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [routes, setRoutes] = useState<Route[]>(() => RouteService.evaluateRoutes(INITIAL_ROUTES, INITIAL_ZONES, false));
  const [sensors, setSensors] = useState<IoTSensor[]>(INITIAL_SENSORS);
  const [notifications, setNotifications] = useState<AlertNotification[]>(INITIAL_NOTIFICATIONS);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>(INITIAL_AI_RECOMMENDATIONS);

  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [simulationActive, setSimulationActive] = useState<boolean>(true);

  // Offline resilience states
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isSyncingData, setIsSyncingData] = useState<boolean>(false);
  const [offlineSyncProgress, setOfflineSyncProgress] = useState<number>(0);
  const [bufferedTelemetryCount, setBufferedTelemetryCount] = useState<number>(0);

  // Smart Plan Generator states
  const [venuePlanInput, setVenuePlanInput] = useState<VenuePlanInput>(VenueService.getDefaultInput());
  const [generatedLayout, setGeneratedLayout] = useState<GeneratedLayout>(() => VenueService.generateLayout(VenueService.getDefaultInput()));
  const [isGeneratingLayout, setIsGeneratingLayout] = useState<boolean>(false);
  const [layoutGenerationStep, setLayoutGenerationStep] = useState<VenueGenerationStep>(0);
  const [isCrowdFlowSimulating, setIsCrowdFlowSimulating] = useState<boolean>(false);

  // Jury Demo Walkthrough states
  const [juryDemoActive, setJuryDemoActive] = useState<boolean>(false);
  const [juryDemoStep, setJuryDemoStep] = useState<number>(1);

  // Routing
  const [selectedStartZone, setSelectedStartZone] = useState<string>('zone-a');
  const [selectedDestinationZone, setSelectedDestinationZone] = useState<string>('zone-c');

  // Accessibility
  const [simpleAccessibilityMode, setSimpleAccessibilityMode] = useState<boolean>(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  // Internal updater to keep routes & statuses synced
  const updateDerivedState = useCallback((newZones: Zone[], isEmergency: boolean = emergencyMode) => {
    const recalculatedZones = newZones.map(z => ({
      ...z,
      status: CrowdService.calculateStatus(z.currentCount, z.capacity)
    }));
    const recalculatedRoutes = RouteService.evaluateRoutes(routes, recalculatedZones, isEmergency);

    setZones(recalculatedZones);
    setRoutes(recalculatedRoutes);
  }, [emergencyMode, routes]);

  // Live IoT sensor telemetry simulation ticker
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      setSensors(prevSensors => {
        const updated = SensorService.simulateSensorTick(prevSensors, isOfflineMode);
        if (isOfflineMode) {
          const totalBuf = updated.reduce((s, x) => s + (x.bufferedCount || 0), 0);
          setBufferedTelemetryCount(totalBuf);
        }
        return updated;
      });

      // Subtle fluctuation in non-critical zones to keep UI feeling alive
      if (!emergencyMode) {
        setZones(prevZones => {
          return prevZones.map(z => {
            if (z.status === 'CRITICAL' || z.accessRestricted) return z;
            const delta = Math.floor(Math.random() * 5) - 2;
            const newCount = Math.max(20, Math.min(z.capacity, z.currentCount + delta));
            return {
              ...z,
              currentCount: newCount,
              status: CrowdService.calculateStatus(newCount, z.capacity)
            };
          });
        });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [simulationActive, isOfflineMode, emergencyMode]);

  // Offline Mode Toggle
  const toggleOfflineMode = (offline?: boolean) => {
    const nextState = offline !== undefined ? offline : !isOfflineMode;
    setIsOfflineMode(nextState);

    if (nextState) {
      // Switched to offline
      const alert = AlertService.createAlert(
        '⚠️ Network Offline: Edge Mode Activated',
        'Cloud uplink unavailable. Sensors switched to ESP32 local ring-buffer. Basic risk analysis continues on local venue network.',
        'warning'
      );
      setNotifications(prev => [alert, ...prev]);
    } else {
      // Switched back to online -> trigger sync
      syncBufferedData();
    }
  };

  // Synchronize Buffered Data when connection returns
  const syncBufferedData = async () => {
    setIsSyncingData(true);
    setOfflineSyncProgress(10);

    for (let p = 20; p <= 100; p += 20) {
      await new Promise(r => setTimeout(r, 350));
      setOfflineSyncProgress(p);
    }

    // Reset buffer counters
    setSensors(prev => prev.map(s => ({ ...s, isEdgeBuffered: false, bufferedCount: 0, status: 'ONLINE', lastUpdated: 'Synchronized just now' })));
    setBufferedTelemetryCount(0);
    setIsSyncingData(false);
    setOfflineSyncProgress(0);

    const alert = AlertService.createAlert(
      '✓ Buffered Data Synchronized',
      'Local edge packets uploaded to cloud backend. All sensor logs and crowd timestamps synchronized successfully.',
      'info'
    );
    setNotifications(prev => [alert, ...prev]);
  };

  // Smart Plan Animated 6-step Layout Generator
  const generateSmartLayout = async (customInput?: VenuePlanInput) => {
    const input = customInput || venuePlanInput;
    setIsGeneratingLayout(true);
    setLayoutGenerationStep(1); // Step 1: Analysing venue dimensions

    await new Promise(r => setTimeout(r, 700));
    setLayoutGenerationStep(2); // Step 2: Calculating crowd distribution

    await new Promise(r => setTimeout(r, 800));
    setLayoutGenerationStep(3); // Step 3: Identifying optimal crowd zones

    await new Promise(r => setTimeout(r, 800));
    setLayoutGenerationStep(4); // Step 4: Optimising movement pathways

    await new Promise(r => setTimeout(r, 800));
    setLayoutGenerationStep(5); // Step 5: Positioning safety and facility points

    await new Promise(r => setTimeout(r, 800));
    setLayoutGenerationStep(6); // Step 6: Layout ready

    const newLayout = VenueService.generateLayout(input);
    setGeneratedLayout(newLayout);

    await new Promise(r => setTimeout(r, 600));
    setIsGeneratingLayout(false);

    const alert = AlertService.createAlert(
      '✨ Intelligent Crowd Layout Ready',
      `Optimized layout generated for ${input.eventName}. ${newLayout.zones.length} zones and ${newLayout.facilities.length} facility nodes placed.`,
      'info'
    );
    setNotifications(prev => [alert, ...prev]);
  };

  // Toggle crowd movement simulation on digital twin canvas
  const toggleCrowdFlowSimulation = () => {
    const next = !isCrowdFlowSimulating;
    setIsCrowdFlowSimulating(next);

    if (next) {
      // Simulate crowd accumulation in Zone C to trigger dynamic recommendation
      setTimeout(() => {
        setZones(prev => prev.map(z => z.id === 'zone-c' ? { ...z, currentCount: 780, status: 'CRITICAL' } : z));
        setRoutes(prev => RouteService.evaluateRoutes(prev, zones, false));
      }, 2500);
    }
  };

  // Quick Simulation Scenarios
  const simulateNormalFlow = () => {
    const updated = SimulationService.applyNormalFlow(zones);
    updateDerivedState(updated);
  };

  const simulateCrowdSurge = () => {
    const { zones: updated, alert, aiRec } = SimulationService.applyCrowdSurge(zones);
    setNotifications(prev => [alert, ...prev]);
    setAiRecommendations(prev => [aiRec, ...prev]);
    updateDerivedState(updated);
  };

  const simulateCongestionEvent = () => {
    const { zones: updated, alert, aiRec } = SimulationService.applyCongestion(zones);
    setNotifications(prev => [alert, ...prev]);
    setAiRecommendations(prev => [aiRec, ...prev]);
    updateDerivedState(updated);
  };

  const simulateRecovery = () => {
    const { zones: updated, alert } = SimulationService.applyRecovery(zones);
    setNotifications(prev => [alert, ...prev]);
    updateDerivedState(updated);
  };

  // Emergency Mode Toggle
  const toggleEmergencyMode = (enabled?: boolean) => {
    const targetState = enabled !== undefined ? enabled : !emergencyMode;
    setEmergencyMode(targetState);

    const alert = AlertService.createAlert(
      targetState ? '🚨 EMERGENCY EVACUATION ACTIVATED' : 'Emergency Mode Deactivated',
      targetState
        ? 'ALERT: Evacuation protocol active. Avoid Zone C. Proceed calmly to South Evacuation Route D.'
        : 'Emergency mode cleared. Standard venue crowd guidance restored.',
      targetState ? 'emergency' : 'info'
    );
    setNotifications(prev => [alert, ...prev]);
    updateDerivedState(zones, targetState);
  };

  // Zone Access Barrier Toggle
  const toggleZoneAccess = (zoneId: string, restricted: boolean) => {
    const updated = zones.map(z => (z.id === zoneId ? { ...z, accessRestricted: restricted } : z));
    const targetZone = zones.find(z => z.id === zoneId);
    const alert = AlertService.createAlert(
      restricted ? `Gate Barrier RESTRICTED: ${targetZone?.name || zoneId}` : `Gate Barrier OPEN: ${targetZone?.name || zoneId}`,
      restricted ? 'Automated turnstile locked. Visitors redirected to alternate route.' : 'Access restored for incoming crowd.',
      restricted ? 'warning' : 'info',
      zoneId
    );
    setNotifications(prev => [alert, ...prev]);
    updateDerivedState(updated);
  };

  // Reset to Baseline
  const resetToBaseline = () => {
    setZones(INITIAL_ZONES);
    setRoutes(RouteService.evaluateRoutes(INITIAL_ROUTES, INITIAL_ZONES, false));
    setSensors(INITIAL_SENSORS);
    setEmergencyMode(false);
    setIsOfflineMode(false);
    setBufferedTelemetryCount(0);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAiRecommendations(INITIAL_AI_RECOMMENDATIONS);
    setIsCrowdFlowSimulating(false);
    setLayoutGenerationStep(0);
  };

  // Alerts Actions
  const acknowledgeAlert = (id: string) => {
    setNotifications(prev => AlertService.acknowledgeAlert(prev, id));
  };

  const resolveAlert = (id: string) => {
    setNotifications(prev => AlertService.resolveAlert(prev, id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  // Destination Route Resolver
  const getBestRouteForDestination = (destZoneId: string) => {
    return RouteService.getRecommendations(routes, destZoneId);
  };

  // 10-Step Jury Demo Flow Controller
  const executeJuryStep = (step: number) => {
    setJuryDemoStep(step);
    switch (step) {
      case 1: // Enter venue details
        setRole('admin');
        setAdminTab('smart_plan');
        break;
      case 2: // Generate intelligent layout
        setRole('admin');
        setAdminTab('smart_plan');
        generateSmartLayout();
        break;
      case 3: // Show IoT sensors monitoring crowd
        setRole('admin');
        setAdminTab('live_monitor');
        break;
      case 4: // Trigger crowd surge
        simulateCrowdSurge();
        setRole('admin');
        setAdminTab('live_monitor');
        break;
      case 5: // Show risk prediction
        simulateCongestionEvent();
        setRole('admin');
        setAdminTab('crowd_intelligence');
        break;
      case 6: // Generate safer route
        setRole('admin');
        setAdminTab('route_management');
        break;
      case 7: // Show citizen receiving the recommendation
        setRole('visitor');
        setCitizenTab('route_finder');
        break;
      case 8: // Simulate network failure
        setRole('admin');
        setAdminTab('sensors');
        toggleOfflineMode(true);
        break;
      case 9: // Show offline edge mode
        setRole('admin');
        setAdminTab('sensors');
        break;
      case 10: // Restore network and synchronize data
        setRole('admin');
        setAdminTab('sensors');
        toggleOfflineMode(false);
        break;
      default:
        break;
    }
  };

  const startJuryDemo = () => {
    setJuryDemoActive(true);
    executeJuryStep(1);
  };

  const closeJuryDemo = () => {
    setJuryDemoActive(false);
  };

  const nextJuryStep = () => {
    const next = juryDemoStep < 10 ? juryDemoStep + 1 : 1;
    executeJuryStep(next);
  };

  const prevJuryStep = () => {
    const prev = juryDemoStep > 1 ? juryDemoStep - 1 : 10;
    executeJuryStep(prev);
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
      console.warn('API call fallback to local intelligent AI generator:', e);
    }

    await new Promise(r => setTimeout(r, 1400));
    setIsGeneratingPlan(false);

    const totalExpected = input.expectedCrowd || 25000;
    const estSensorsNeeded = Math.ceil(input.zonesCount * 2.5);

    return {
      eventName: input.eventName || 'Palani Grand Festival',
      riskAssessment: {
        overallRiskLevel: totalExpected > 30000 ? 'HIGH' : 'MEDIUM',
        summary: `Analysis of ${totalExpected.toLocaleString()} expected attendees indicates high queue pressure around inner bottleneck corridors during peak hours (6:00 PM - 8:30 PM).`,
        highRiskZones: ['Inner Sanctum Gate', 'West Concourse Corridor', 'Central Staircase Queue']
      },
      recommendedSensorsCount: estSensorsNeeded,
      sensorPlacements: [
        { location: 'Main Entrance Concourse (Gates 1-4)', reason: 'Real-time influx metering and entry vs exit rate monitoring.' },
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
        toggleEmergencyMode,
        simulationActive,
        setSimulationActive,
        isOfflineMode,
        toggleOfflineMode,
        isSyncingData,
        offlineSyncProgress,
        bufferedTelemetryCount,
        syncBufferedData,
        venuePlanInput,
        setVenuePlanInput,
        generatedLayout,
        isGeneratingLayout,
        layoutGenerationStep,
        generateSmartLayout,
        isCrowdFlowSimulating,
        toggleCrowdFlowSimulation,
        juryDemoActive,
        setJuryDemoActive,
        juryDemoStep,
        setJuryDemoStep,
        nextJuryStep,
        prevJuryStep,
        startJuryDemo,
        closeJuryDemo,
        selectedStartZone,
        setSelectedStartZone,
        selectedDestinationZone,
        setSelectedDestinationZone,
        getBestRouteForDestination,
        simulateNormalFlow,
        simulateCrowdSurge,
        simulateCongestionEvent,
        simulateRecovery,
        toggleZoneAccess,
        resetToBaseline,
        acknowledgeAlert,
        resolveAlert,
        markNotificationRead,
        simpleAccessibilityMode,
        setSimpleAccessibilityMode,
        generateEventPlan,
        isGeneratingPlan
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
