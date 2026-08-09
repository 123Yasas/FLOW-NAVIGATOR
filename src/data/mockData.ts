import { 
  Zone, 
  Route, 
  IoTSensor, 
  AlertNotification, 
  AIRecommendation, 
  LocationVenue,
  AnalyticsDataPoint 
} from '../types';

export const INITIAL_LOCATIONS: LocationVenue[] = [
  {
    id: 'palani-gathering',
    name: 'Palani Pilgrimage Gathering Grounds',
    category: 'Pilgrimage & Heritage Site',
    city: 'Palani, Tamil Nadu',
    totalCapacity: 25000,
    currentTotalCrowd: 12450,
    activeZonesCount: 8,
  },
  {
    id: 'meenakshi-temple',
    name: 'Meenakshi Sundareswarar Temple Complex',
    category: 'Heritage Festival',
    city: 'Madurai, Tamil Nadu',
    totalCapacity: 35000,
    currentTotalCrowd: 19800,
    activeZonesCount: 12,
  },
  {
    id: 'chennai-stadium',
    name: 'Jawaharlal Nehru Stadium Complex',
    category: 'Sports & Concert Venue',
    city: 'Chennai',
    totalCapacity: 40000,
    currentTotalCrowd: 28200,
    activeZonesCount: 10,
  },
  {
    id: 'central-transit-hub',
    name: 'Central Metro & Rail Junction Terminal',
    category: 'Transit Terminal',
    city: 'Central Hub',
    totalCapacity: 18000,
    currentTotalCrowd: 11200,
    activeZonesCount: 6,
  }
];

export const INITIAL_ZONES: Zone[] = [
  {
    id: 'zone-a',
    code: 'ZONE A',
    name: 'Main Entrance Plaza',
    capacity: 800,
    currentCount: 245,
    entryRate: 42,
    exitRate: 38,
    status: 'SAFE',
    accessRestricted: false,
    isEvacuationPath: true,
    description: 'Primary entry point with security turnstiles & queue bays.'
  },
  {
    id: 'zone-b',
    code: 'ZONE B',
    name: 'West Courtyard & Shopping Arcade',
    capacity: 800,
    currentCount: 650,
    entryRate: 58,
    exitRate: 40,
    status: 'HIGH',
    accessRestricted: false,
    isEvacuationPath: false,
    description: 'Bustling bazaar walkway and prasadam distribution counter.'
  },
  {
    id: 'zone-c',
    code: 'ZONE C',
    name: 'North Shrine Corridor',
    capacity: 800,
    currentCount: 780,
    entryRate: 65,
    exitRate: 25,
    status: 'CRITICAL',
    accessRestricted: true,
    isEvacuationPath: false,
    description: 'Narrow inner temple corridor leading directly to the main sanctum.'
  },
  {
    id: 'zone-d',
    code: 'ZONE D',
    name: 'South Express Bypass Walkway',
    capacity: 800,
    currentCount: 310,
    entryRate: 30,
    exitRate: 35,
    status: 'SAFE',
    accessRestricted: false,
    isEvacuationPath: true,
    description: 'Spacious outer bypass corridor with direct exit pathways.'
  },
  {
    id: 'zone-e',
    code: 'ZONE E',
    name: 'Food Court & Dining Pavilion',
    capacity: 1200,
    currentCount: 710,
    entryRate: 40,
    exitRate: 35,
    status: 'MODERATE',
    accessRestricted: false,
    isEvacuationPath: false,
    description: 'Annadhanam dining hall and public water stations.'
  },
  {
    id: 'zone-f',
    code: 'ZONE F',
    name: 'Multi-Level Car & Bus Parking',
    capacity: 1500,
    currentCount: 820,
    entryRate: 25,
    exitRate: 30,
    status: 'SAFE',
    accessRestricted: false,
    isEvacuationPath: true,
    description: 'Northern vehicle parking lot and transit shuttle pickup.'
  },
  {
    id: 'zone-g',
    code: 'ZONE G',
    name: 'Emergency Medical Bay & First Aid',
    capacity: 400,
    currentCount: 95,
    entryRate: 10,
    exitRate: 12,
    status: 'SAFE',
    accessRestricted: false,
    isEvacuationPath: true,
    description: 'First responder post with ambulances and nursing stations.'
  },
  {
    id: 'zone-h',
    code: 'ZONE H',
    name: 'Hilltop Ropeway & Staircases',
    capacity: 1000,
    currentCount: 880,
    entryRate: 70,
    exitRate: 30,
    status: 'CRITICAL',
    accessRestricted: false,
    isEvacuationPath: false,
    description: 'Main staircase steps and ropeway boarding queue.'
  }
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'route-a',
    name: 'Route A - Direct Shrine Pathway',
    startZoneId: 'zone-a',
    destinationZoneId: 'zone-c',
    destinationName: 'Main Shrine / Sanctum',
    occupancyPercentage: 92,
    estimatedWaitMinutes: 28,
    estimatedWalkMinutes: 7,
    status: 'CRITICAL',
    tag: 'AVOID',
    color: '#ef4444', // red
    description: 'Direct route via North Shrine Corridor. Highly bottlenecked at sanctum entrance.',
    pathZones: ['zone-a', 'zone-c']
  },
  {
    id: 'route-b',
    name: 'Route B - West Arcade Corridor',
    startZoneId: 'zone-a',
    destinationZoneId: 'zone-c',
    destinationName: 'Main Shrine / Sanctum',
    occupancyPercentage: 68,
    estimatedWaitMinutes: 15,
    estimatedWalkMinutes: 10,
    status: 'MODERATE',
    tag: 'MODERATE',
    color: '#eab308', // yellow
    description: 'Alternative route passing through the West Arcade. Moderate queue build-up.',
    pathZones: ['zone-a', 'zone-b', 'zone-c']
  },
  {
    id: 'route-c',
    name: 'Route C - North Express Queue',
    startZoneId: 'zone-a',
    destinationZoneId: 'zone-c',
    destinationName: 'Main Shrine / Sanctum',
    occupancyPercentage: 34,
    estimatedWaitMinutes: 6,
    estimatedWalkMinutes: 8,
    status: 'SAFE',
    tag: 'RECOMMENDED',
    color: '#22c55e', // green
    description: 'Widened express lane with fast-moving turnstiles and zero choke points.',
    pathZones: ['zone-a', 'zone-d', 'zone-c']
  },
  {
    id: 'route-d',
    name: 'Route D - South Bypass Lane',
    startZoneId: 'zone-a',
    destinationZoneId: 'zone-f',
    destinationName: 'Exit & Parking Grounds',
    occupancyPercentage: 42,
    estimatedWaitMinutes: 8,
    estimatedWalkMinutes: 6,
    status: 'SAFE',
    tag: 'RECOMMENDED',
    color: '#22c55e', // green
    description: 'Spacious south bypass corridor directly connecting to parking and transport.',
    pathZones: ['zone-a', 'zone-d', 'zone-f']
  }
];

export const INITIAL_SENSORS: IoTSensor[] = [
  {
    id: 'SENSOR-ESP32-001',
    zoneId: 'zone-a',
    zoneName: 'Main Entrance Plaza Gate 1',
    peopleIn: 540,
    peopleOut: 295,
    currentCount: 245,
    status: 'ONLINE',
    batteryPercentage: 98,
    signalStrengthDbm: -54,
    lastUpdated: '2 sec ago',
    firmwareVersion: 'v2.4.1-ESP32-IR',
    hardwareType: 'ESP32 Dual-Laser IR Counter'
  },
  {
    id: 'SENSOR-ESP32-002',
    zoneId: 'zone-a',
    zoneName: 'Main Entrance Plaza Gate 2',
    peopleIn: 480,
    peopleOut: 235,
    currentCount: 245,
    status: 'ONLINE',
    batteryPercentage: 92,
    signalStrengthDbm: -61,
    lastUpdated: '1 sec ago',
    firmwareVersion: 'v2.4.1-ESP32-IR',
    hardwareType: 'ESP32 Dual-Laser IR Counter'
  },
  {
    id: 'SENSOR-ESP32-003',
    zoneId: 'zone-b',
    zoneName: 'West Arcade North Entrance',
    peopleIn: 890,
    peopleOut: 240,
    currentCount: 650,
    status: 'ONLINE',
    batteryPercentage: 86,
    signalStrengthDbm: -68,
    lastUpdated: '4 sec ago',
    firmwareVersion: 'v2.4.1-ESP32-IR',
    hardwareType: 'ESP32 Time-of-Flight LiDAR'
  },
  {
    id: 'SENSOR-ESP32-004',
    zoneId: 'zone-c',
    zoneName: 'North Shrine Inner Sanctum Choke',
    peopleIn: 1120,
    peopleOut: 340,
    currentCount: 780,
    status: 'WARNING',
    batteryPercentage: 45,
    signalStrengthDbm: -78,
    lastUpdated: '3 sec ago',
    firmwareVersion: 'v2.4.1-ESP32-IR',
    hardwareType: 'ESP32 mmWave Radar Counter'
  },
  {
    id: 'SENSOR-ESP32-005',
    zoneId: 'zone-d',
    zoneName: 'South Bypass Walkway Gate',
    peopleIn: 410,
    peopleOut: 100,
    currentCount: 310,
    status: 'ONLINE',
    batteryPercentage: 95,
    signalStrengthDbm: -50,
    lastUpdated: '2 sec ago',
    firmwareVersion: 'v2.4.1-ESP32-IR',
    hardwareType: 'ESP32 Dual-Laser IR Counter'
  },
  {
    id: 'SENSOR-ESP32-006',
    zoneId: 'zone-e',
    zoneName: 'Food Court Entrance Gate',
    peopleIn: 940,
    peopleOut: 230,
    currentCount: 710,
    status: 'ONLINE',
    batteryPercentage: 88,
    signalStrengthDbm: -58,
    lastUpdated: '5 sec ago',
    firmwareVersion: 'v2.4.1-ESP32-IR',
    hardwareType: 'ESP32 Time-of-Flight LiDAR'
  },
  {
    id: 'SENSOR-ESP32-007',
    zoneId: 'zone-f',
    zoneName: 'Parking Lot Exit Barrier',
    peopleIn: 620,
    peopleOut: 200,
    currentCount: 420,
    status: 'OFFLINE',
    batteryPercentage: 12,
    signalStrengthDbm: -89,
    lastUpdated: '18 min ago',
    firmwareVersion: 'v2.3.9-ESP32-IR',
    hardwareType: 'ESP32 Optical Flow Sensor'
  },
  {
    id: 'SENSOR-ESP32-008',
    zoneId: 'zone-h',
    zoneName: 'Staircase Steps Queue Sensor',
    peopleIn: 1420,
    peopleOut: 540,
    currentCount: 880,
    status: 'ONLINE',
    batteryPercentage: 91,
    signalStrengthDbm: -62,
    lastUpdated: '1 sec ago',
    firmwareVersion: 'v2.4.1-ESP32-IR',
    hardwareType: 'ESP32 mmWave Radar Counter'
  }
];

export const INITIAL_NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'alert-1',
    timestamp: '10:42 AM',
    title: 'Zone C Capacity Warning',
    message: 'North Shrine Corridor has reached 97% capacity (780/800). Automated access control recommends restricting further entry.',
    severity: 'critical',
    zoneId: 'zone-c',
    read: false
  },
  {
    id: 'alert-2',
    timestamp: '10:38 AM',
    title: 'Route C Optimal Flow',
    message: 'Route C (North Express Queue) remains clear with only 34% occupancy. Waiting time is 6 minutes.',
    severity: 'info',
    zoneId: 'zone-d',
    read: true
  },
  {
    id: 'alert-3',
    timestamp: '10:30 AM',
    title: 'Sensor Battery Alert',
    message: 'Sensor SENSOR-ESP32-007 at Parking Lot Exit reported low battery (12%) and lost Wi-Fi connectivity.',
    severity: 'warning',
    zoneId: 'zone-f',
    read: true
  }
];

export const INITIAL_AI_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'rec-1',
    priority: 'CRITICAL',
    title: 'Restrict Access to Zone C immediately',
    actionMessage: 'Redirect new arrivals at Gate A towards Route C (South Bypass Lane). Deploy 4 volunteers at Zone C entrance.',
    zoneId: 'zone-c',
    impactEstimate: 'Reduces sanctum wait time by 45% within 10 minutes',
    timestamp: 'Just now'
  },
  {
    id: 'rec-2',
    priority: 'HIGH',
    title: 'Predictive Congestion in Zone B in 12 minutes',
    actionMessage: 'Zone B food stall queue build-up detected. Open secondary exit gate to divert prasadam line.',
    zoneId: 'zone-b',
    impactEstimate: 'Prevents 200+ crowd bottleneck near west shops',
    timestamp: '2 min ago'
  },
  {
    id: 'rec-3',
    priority: 'MEDIUM',
    title: 'Optimize Ropeway Batch Timing',
    actionMessage: 'Increase ropeway cabin dispatch rate by 15% to clear Zone H staircase queue.',
    zoneId: 'zone-h',
    impactEstimate: 'Clears 150 people/hour from staircase queue',
    timestamp: '5 min ago'
  },
  {
    id: 'rec-4',
    priority: 'LOW',
    title: 'Maintain Public Kiosk Guidance Display',
    actionMessage: 'Broadcast Route C recommendation on Gate A LED screens in English and Tamil.',
    zoneId: 'zone-a',
    impactEstimate: 'Informs non-app users automatically',
    timestamp: '10 min ago'
  }
];

export const HISTORICAL_ANALYTICS: AnalyticsDataPoint[] = [
  { time: '06:00 AM', totalCrowd: 2100, entries: 850, exits: 200, routeAWait: 5, routeBWait: 4, routeCWait: 3, routeDWait: 2 },
  { time: '07:00 AM', totalCrowd: 4300, entries: 1450, exits: 410, routeAWait: 8, routeBWait: 6, routeCWait: 4, routeDWait: 3 },
  { time: '08:00 AM', totalCrowd: 7800, entries: 2100, exits: 820, routeAWait: 14, routeBWait: 9, routeCWait: 5, routeDWait: 4 },
  { time: '09:00 AM', totalCrowd: 10400, entries: 2600, exits: 1100, routeAWait: 20, routeBWait: 12, routeCWait: 6, routeDWait: 5 },
  { time: '10:00 AM', totalCrowd: 12450, entries: 2900, exits: 1350, routeAWait: 28, routeBWait: 15, routeCWait: 6, routeDWait: 8 },
  { time: '11:00 AM', totalCrowd: 14200, entries: 3100, exits: 1600, routeAWait: 35, routeBWait: 22, routeCWait: 8, routeDWait: 9 },
  { time: '12:00 PM', totalCrowd: 15800, entries: 2800, exits: 2100, routeAWait: 42, routeBWait: 25, routeCWait: 9, routeDWait: 10 },
  { time: '01:00 PM', totalCrowd: 13900, entries: 2100, exits: 2600, routeAWait: 25, routeBWait: 16, routeCWait: 6, routeDWait: 7 },
  { time: '02:00 PM', totalCrowd: 12100, entries: 1900, exits: 2400, routeAWait: 18, routeBWait: 12, routeCWait: 5, routeDWait: 6 }
];
