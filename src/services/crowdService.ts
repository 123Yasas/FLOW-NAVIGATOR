import { Zone, ZoneStatus } from '../types';

/**
 * Crowd Service
 * Provides explainable formulas for crowd density, queue waiting times, and predictive risk scoring.
 */

export class CrowdService {
  /**
   * Determine zone status based on percentage occupancy
   */
  static calculateStatus(currentCount: number, capacity: number): ZoneStatus {
    const percentage = (currentCount / Math.max(1, capacity)) * 100;
    if (percentage >= 90) return 'CRITICAL';
    if (percentage >= 80) return 'HIGH';
    if (percentage >= 60) return 'MODERATE';
    return 'SAFE';
  }

  /**
   * Calculate queue waiting time in minutes
   * Formula: (People Ahead) / (Throughput Rate per Minute)
   * With fallback damping
   */
  static estimateWaitTimeMinutes(peopleCount: number, throughputRatePerMin: number = 30): number {
    const rate = Math.max(5, throughputRatePerMin);
    const rawMinutes = Math.round(peopleCount / rate);
    return Math.max(1, Math.min(120, rawMinutes));
  }

  /**
   * Explainable AI Risk Assessment
   * Breaks down why a zone is deemed High or Critical
   */
  static evaluateZoneRisk(zone: Zone) {
    const occupancyPercentage = Math.round((zone.currentCount / zone.capacity) * 100);
    const netRate = zone.entryRate - zone.exitRate; // Net influx rate per min
    
    // Minutes until zone reaches 100% capacity at current net rate
    const remainingCapacity = Math.max(0, zone.capacity - zone.currentCount);
    const minutesToCritical = netRate > 0 ? Math.ceil(remainingCapacity / netRate) : 999;

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (occupancyPercentage >= 90 || minutesToCritical <= 5) {
      riskLevel = 'CRITICAL';
    } else if (occupancyPercentage >= 80 || minutesToCritical <= 10) {
      riskLevel = 'HIGH';
    } else if (occupancyPercentage >= 60 || minutesToCritical <= 20) {
      riskLevel = 'MODERATE';
    }

    const factors = [
      {
        label: 'Current Occupancy',
        value: `${occupancyPercentage}% (${zone.currentCount}/${zone.capacity})`,
        impact: occupancyPercentage > 80 ? 'Negative' : 'Normal',
      },
      {
        label: 'Net Influx Velocity',
        value: `${netRate >= 0 ? '+' : ''}${netRate} people/min`,
        impact: netRate > 20 ? 'High Influx' : 'Stable',
      },
      {
        label: 'Time to Full Capacity',
        value: minutesToCritical < 999 ? `~${minutesToCritical} minutes` : 'Stable (Outflow exceeds Influx)',
        impact: minutesToCritical <= 10 ? 'Urgent' : 'Acceptable',
      },
      {
        label: 'Physical Barrier Status',
        value: zone.accessRestricted ? 'Restricted (Diverting)' : 'Open Flow',
        impact: zone.accessRestricted ? 'Mitigating' : 'Standard',
      },
    ];

    return {
      riskLevel,
      occupancyPercentage,
      netRate,
      minutesToCritical: Math.min(60, minutesToCritical),
      factors,
    };
  }

  /**
   * Compute overall venue occupancy and safety level
   */
  static getVenueOverallMetrics(zones: Zone[]) {
    const totalCurrent = zones.reduce((sum, z) => sum + z.currentCount, 0);
    const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
    const avgOccupancy = Math.round((totalCurrent / Math.max(1, totalCapacity)) * 100);

    const safeCount = zones.filter(z => z.status === 'SAFE').length;
    const moderateCount = zones.filter(z => z.status === 'MODERATE').length;
    const highCount = zones.filter(z => z.status === 'HIGH').length;
    const criticalCount = zones.filter(z => z.status === 'CRITICAL').length;

    let overallLabel = 'SAFE';
    if (criticalCount > 0) overallLabel = 'CRITICAL ATTENTION REQUIRED';
    else if (highCount > 0) overallLabel = 'HIGH TRAFFIC';
    else if (moderateCount > 0) overallLabel = 'MODERATE CROWD';

    return {
      totalCurrent,
      totalCapacity,
      avgOccupancy,
      safeCount,
      moderateCount,
      highCount,
      criticalCount,
      overallLabel,
    };
  }
}
