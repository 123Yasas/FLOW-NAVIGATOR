/**
 * FlowNavigator - Data Types and Interfaces
 * Core 5-Pillar Architecture: PLAN → MONITOR → PREDICT → GUIDE → MANAGE
 */

export type ZoneStatus = 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface Zone {
  id: string;
  code: string; // e.g. "ZONE A"
  name: string;
  capacity: number;
  currentCount: number;
  entryRate: number; // people per minute
  exitRate: number; // people per minute
  status: ZoneStatus;
  accessRestricted: boolean;
  isEvacuationPath: boolean;
  description: string;
  // Coordinates for digital twin venue canvas (relative % or px)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type RouteRecommendation = 'RECOMMENDED' | 'MODERATE' | 'HEAVY_TRAFFIC' | 'AVOID' | 'EVACUATION_ROUTE';

export interface Route {
  id: string;
  name: string;
  startZoneId: string;
  destinationZoneId: string;
  destinationName: string;
  distanceMeters: number;
  occupancyPercentage: number;
  estimatedWaitMinutes: number;
  estimatedWalkMinutes: number;
  status: ZoneStatus;
  tag: RouteRecommendation;
  color: string; // Hex or Tailwind color
  description: string;
  pathZones: string[]; // List of zone IDs in this route
  explainableReason: string; // Why this route is chosen / avoided
}

export type SensorStatus = 'ONLINE' | 'WARNING' | 'OFFLINE';

export interface IoTSensor {
  id: string;
  zoneId: string;
  zoneName: string;
  peopleIn: number;
  peopleOut: number;
  currentCount: number;
  status: SensorStatus;
  batteryPercentage: number;
  signalStrengthDbm: number;
  lastUpdated: string;
  firmwareVersion: string;
  hardwareType: string; // e.g. "ESP32 Dual-Beam IR Counter", "ToF LiDAR", "mmWave Radar"
  isEdgeBuffered?: boolean;
  bufferedCount?: number;
}

export type AlertSeverity = 'info' | 'warning' | 'high' | 'critical' | 'emergency';

export interface AlertNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  zoneId?: string;
  read: boolean;
  acknowledged?: boolean;
  resolved?: boolean;
  recommendedAction?: string;
}

export interface AIRecommendation {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  actionMessage: string;
  zoneId?: string;
  impactEstimate: string;
  timestamp: string;
  factors?: {
    currentOccupancy: number;
    entryRate: number;
    exitRate: number;
    occupancyTrend: string;
    zoneCapacity: number;
  };
}

export interface LocationVenue {
  id: string;
  name: string;
  category: string;
  city: string;
  totalCapacity: number;
  currentTotalCrowd: number;
  activeZonesCount: number;
}

export interface AnalyticsDataPoint {
  time: string;
  totalCrowd: number;
  entries: number;
  exits: number;
  routeAWait: number;
  routeBWait: number;
  routeCWait: number;
  routeDWait: number;
}

export type EventType = 
  | 'Pilgrimage & Religious Gathering' 
  | 'Music Concert & Festival' 
  | 'Sports Tournament' 
  | 'Transit & Rail Terminal' 
  | 'Exhibition & Trade Fair';

export interface VenuePlanInput {
  venueName: string;
  eventName: string;
  eventType: EventType;
  length: number;
  width: number;
  unit: 'sqft' | 'sqm';
  expectedCrowd: number;
  eventDurationHours: number;
  accessPointsCount: number;
  destinationAreaName: string;
  hasEmergencyAccess: boolean;
  hasMedicalPoint: boolean;
  hasWaterPoint: boolean;
  hasToilet: boolean;
  hasSecurityPoint: boolean;
}

export interface FacilityPoint {
  id: string;
  type: 'emergency_exit' | 'medical' | 'water' | 'toilet' | 'security' | 'sensor';
  name: string;
  x: number; // 0-100%
  y: number; // 0-100%
  icon: string;
  zoneId?: string;
}

export interface GeneratedLayout {
  input: VenuePlanInput;
  totalArea: number; // in chosen unit
  maxSafeCapacity: number;
  densityThresholdSqUnitPerPerson: number;
  zones: {
    id: string;
    code: string;
    name: string;
    capacity: number;
    expectedCrowd: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }[];
  pathways: {
    id: string;
    name: string;
    fromZone: string;
    toZone: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    direction: 'forward' | 'bidirectional';
  }[];
  facilities: FacilityPoint[];
  sensorsCount: number;
  recommendedStaffCount: number;
}

export type VenueGenerationStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type UserRole = 'landing' | 'admin' | 'visitor' | 'public_kiosk';

export type AdminTab = 
  | 'overview' 
  | 'smart_plan' 
  | 'live_monitor' 
  | 'crowd_intelligence' 
  | 'route_management' 
  | 'sensors' 
  | 'alerts' 
  | 'analytics' 
  | 'system_status';

export type CitizenTab = 'live_crowd' | 'route_finder' | 'notifications' | 'emergency';

export type OfflineSyncStatus = 'online' | 'offline_buffering' | 'synchronizing' | 'synchronized';

export interface PreEventPlannerInput {
  eventName: string;
  venueName: string;
  expectedCrowd: number;
  zonesCount: number;
  avgZoneCapacity: number;
  entrancesCount: number;
  exitsCount: number;
  startTime: string;
  endTime: string;
  specialNotes?: string;
}

export interface PreEventPlanOutput {
  eventName: string;
  riskAssessment: {
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    summary: string;
    highRiskZones: string[];
  };
  recommendedSensorsCount: number;
  sensorPlacements: { location: string; reason: string }[];
  suggestedRouteDistribution: { routeName: string; allocationPercentage: number; note: string }[];
  peakTimeEstimate: string;
  staffDeploymentAreas: { area: string; personnelNeeded: number; primaryTask: string }[];
  bottleneckPredictions: string[];
}
