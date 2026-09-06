import { VenuePlanInput, GeneratedLayout, FacilityPoint } from '../types';

/**
 * Venue Service
 * Handles pre-event smart venue layout calculation, safety density rules,
 * zone division, and facility positioning.
 */

export class VenueService {
  /**
   * Default initial input for the venue planning form
   */
  static getDefaultInput(): VenuePlanInput {
    return {
      venueName: 'Sri Dhandayuthapani Swamy Temple Complex',
      eventName: 'Thai Poosam Maha Pilgrimage 2026',
      eventType: 'Pilgrimage & Religious Gathering',
      length: 240,
      width: 140,
      unit: 'sqft',
      expectedCrowd: 12000,
      eventDurationHours: 14,
      accessPointsCount: 4,
      destinationAreaName: 'Inner Sanctum Shrine / Stage',
      hasEmergencyAccess: true,
      hasMedicalPoint: true,
      hasWaterPoint: true,
      hasToilet: true,
      hasSecurityPoint: true,
    };
  }

  /**
   * Generate intelligent layout based on user input parameters
   */
  static generateLayout(input: VenuePlanInput): GeneratedLayout {
    const rawArea = input.length * input.width;
    const totalAreaSqFt = input.unit === 'sqft' ? rawArea : Math.round(rawArea * 10.7639);
    
    // Safety density threshold: 3.0 sq.ft per standing person (NFPA 101 / UK Green Guide standard)
    const densitySqFtPerPerson = 3.0;
    const maxSafeCapacity = Math.floor(totalAreaSqFt / densitySqFtPerPerson);

    // Calculate zone allocations based on crowd & area
    const totalZones = 4;
    const baseZoneCap = Math.floor(maxSafeCapacity / totalZones);

    const zones = [
      {
        id: 'plan-zone-a',
        code: 'ZONE A',
        name: 'Access & Influx Concourse',
        capacity: Math.round(baseZoneCap * 1.1),
        expectedCrowd: Math.round(input.expectedCrowd * 0.28),
        x: 10,
        y: 12,
        width: 38,
        height: 34,
        color: '#3b82f6',
      },
      {
        id: 'plan-zone-b',
        code: 'ZONE B',
        name: 'West Transit & Pavilion',
        capacity: Math.round(baseZoneCap * 0.95),
        expectedCrowd: Math.round(input.expectedCrowd * 0.24),
        x: 52,
        y: 12,
        width: 38,
        height: 34,
        color: '#10b981',
      },
      {
        id: 'plan-zone-c',
        code: 'ZONE C',
        name: 'Central Bottleneck Corridor',
        capacity: Math.round(baseZoneCap * 0.85),
        expectedCrowd: Math.round(input.expectedCrowd * 0.32),
        x: 10,
        y: 54,
        width: 38,
        height: 34,
        color: '#f59e0b',
      },
      {
        id: 'plan-zone-d',
        code: 'ZONE D',
        name: 'Destination / Sanctum Stage',
        capacity: Math.round(baseZoneCap * 1.1),
        expectedCrowd: Math.round(input.expectedCrowd * 0.16),
        x: 52,
        y: 54,
        width: 38,
        height: 34,
        color: '#8b5cf6',
      },
    ];

    // Movement pathways connecting zones
    const pathways = [
      {
        id: 'path-1',
        name: 'Primary Access Lane',
        fromZone: 'plan-zone-a',
        toZone: 'plan-zone-b',
        startX: 29,
        startY: 46,
        endX: 71,
        endY: 46,
        direction: 'forward' as const,
      },
      {
        id: 'path-2',
        name: 'Direct Corridor Express',
        fromZone: 'plan-zone-a',
        toZone: 'plan-zone-c',
        startX: 29,
        startY: 46,
        endX: 29,
        endY: 54,
        direction: 'forward' as const,
      },
      {
        id: 'path-3',
        name: 'High-Capacity Bypass',
        fromZone: 'plan-zone-b',
        toZone: 'plan-zone-d',
        startX: 71,
        startY: 46,
        endX: 71,
        endY: 54,
        direction: 'forward' as const,
      },
      {
        id: 'path-4',
        name: 'Sanctum Transition',
        fromZone: 'plan-zone-c',
        toZone: 'plan-zone-d',
        startX: 48,
        startY: 71,
        endX: 52,
        endY: 71,
        direction: 'bidirectional' as const,
      },
    ];

    // Safety and facility placements
    const facilities: FacilityPoint[] = [];

    if (input.hasEmergencyAccess) {
      facilities.push({
        id: 'fac-em-1',
        type: 'emergency_exit',
        name: 'North Emergency Exit',
        x: 6,
        y: 8,
        icon: 'Flame',
      });
      facilities.push({
        id: 'fac-em-2',
        type: 'emergency_exit',
        name: 'South Evacuation Gate',
        x: 94,
        y: 92,
        icon: 'Flame',
      });
    }

    if (input.hasMedicalPoint) {
      facilities.push({
        id: 'fac-med-1',
        type: 'medical',
        name: 'First Aid & Triage Post',
        x: 92,
        y: 28,
        icon: 'Cross',
      });
    }

    if (input.hasWaterPoint) {
      facilities.push({
        id: 'fac-water-1',
        type: 'water',
        name: 'Hydration Station A',
        x: 8,
        y: 48,
        icon: 'Droplets',
      });
      facilities.push({
        id: 'fac-water-2',
        type: 'water',
        name: 'Hydration Station B',
        x: 92,
        y: 72,
        icon: 'Droplets',
      });
    }

    if (input.hasToilet) {
      facilities.push({
        id: 'fac-toilet-1',
        type: 'toilet',
        name: 'Sanitation Complex West',
        x: 8,
        y: 92,
        icon: 'Bath',
      });
    }

    if (input.hasSecurityPoint) {
      facilities.push({
        id: 'fac-sec-1',
        type: 'security',
        name: 'Main Security Command Post',
        x: 48,
        y: 6,
        icon: 'Shield',
      });
    }

    // Recommended sensor placements
    const sensorsCount = Math.max(6, Math.ceil(input.accessPointsCount * 2) + zones.length);
    const recommendedStaffCount = Math.max(12, Math.ceil(input.expectedCrowd / 600));

    return {
      input,
      totalArea: rawArea,
      maxSafeCapacity,
      densityThresholdSqUnitPerPerson: densitySqFtPerPerson,
      zones,
      pathways,
      facilities,
      sensorsCount,
      recommendedStaffCount,
    };
  }
}
