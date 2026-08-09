/**
 * FlowNavigator - Data Types and Interfaces
 */

export type ZoneStatus = 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface Zone {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  entryRate: number; // people per minute
  exitRate: number; // people per minute
  status: ZoneStatus;
  accessRestricted: boolean;
  isEvacuationPath: boolean;
  code: string; // e.g. "ZONE A"
  description: string;
}

export type RouteRecommendation = 'RECOMMENDED' | 'MODERATE' | 'HEAVY_TRAFFIC' | 'AVOID' | 'EVACUATION_ROUTE';

export interface Route {
  id: string;
  name: string;
  startZoneId: string;
  destinationZoneId: string;
  destinationName: string;
  occupancyPercentage: number;
  estimatedWaitMinutes: number;
  estimatedWalkMinutes: number;
  status: ZoneStatus;
  tag: RouteRecommendation;
  color: string; // Tailwind color string or hex
  description: string;
  pathZones: string[]; // List of zone IDs in this route
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
  hardwareType: string; // e.g. "ESP32-IR-Counter"
}

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export interface AlertNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  zoneId?: string;
  read: boolean;
}

export interface AIRecommendation {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  actionMessage: string;
  zoneId?: string;
  impactEstimate: string;
  timestamp: string;
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

export type UserRole = 'visitor' | 'admin' | 'public_kiosk' | 'landing';

export type AdminTab = 
  | 'dashboard' 
  | 'venue_planner'
  | 'sensors' 
  | 'access_control' 
  | 'ai_recommendations' 
  | 'analytics' 
  | 'event_planner' 
  | 'architecture' 
  | 'settings';

export type CitizenTab = 'live_crowd' | 'route_finder' | 'notifications' | 'emergency';
