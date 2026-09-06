import { Zone, IoTSensor, AlertNotification, AIRecommendation } from '../types';
import { AlertService } from './alertService';

/**
 * Simulation Service
 * Powers hackathon-specific scenarios:
 * 1. Normal Flow
 * 2. Crowd Surge
 * 3. Congestion Event
 * 4. Recovery
 * 5. Network Failure & Offline Edge Mode with Sync
 */

export class SimulationService {
  /**
   * Scenario: Normal Flow
   * Balanced gradual movement across zones
   */
  static applyNormalFlow(zones: Zone[]): Zone[] {
    return zones.map(z => ({
      ...z,
      currentCount: Math.round(z.capacity * 0.45),
      status: 'SAFE',
      accessRestricted: false,
    }));
  }

  /**
   * Scenario: Crowd Surge
   * Influx jumps rapidly in Zone A & Zone B
   */
  static applyCrowdSurge(zones: Zone[]): { zones: Zone[]; alert: AlertNotification; aiRec: AIRecommendation } {
    const updated = zones.map(z => {
      if (z.id === 'zone-a') return { ...z, currentCount: Math.round(z.capacity * 0.82), status: 'HIGH' as const, entryRate: 85 };
      if (z.id === 'zone-b') return { ...z, currentCount: Math.round(z.capacity * 0.88), status: 'HIGH' as const, entryRate: 74 };
      return z;
    });

    const alert = AlertService.createAlert(
      '⚡ Rapid Crowd Surge Detected',
      'Sudden influx detected at Main Entrance Concourse (Zone A). Influx rate increased to +85/min.',
      'high',
      'zone-a',
      'Deploy 4 marshals at turnstiles and open auxiliary intake gate.'
    );

    const aiRec: AIRecommendation = {
      id: `rec-${Date.now()}`,
      priority: 'HIGH',
      title: 'Divert Concourse Influx to West Corridor',
      actionMessage: 'Zone A influx velocity is 2.4x above baseline. Meter intake turnstiles to 30 people/minute.',
      zoneId: 'zone-a',
      impactEstimate: 'Prevents outer plaza queue stagnation within 6 minutes',
      timestamp: 'Just now',
    };

    return { zones: updated, alert, aiRec };
  }

  /**
   * Scenario: Congestion Event
   * Zone C bottleneck reaches critical 94-98%
   */
  static applyCongestion(zones: Zone[]): { zones: Zone[]; alert: AlertNotification; aiRec: AIRecommendation } {
    const updated = zones.map(z => {
      if (z.id === 'zone-c') {
        return {
          ...z,
          currentCount: Math.round(z.capacity * 0.96),
          status: 'CRITICAL' as const,
          accessRestricted: true,
          entryRate: 72,
          exitRate: 18,
        };
      }
      if (z.id === 'zone-b') {
        return { ...z, currentCount: Math.round(z.capacity * 0.85), status: 'HIGH' as const };
      }
      return z;
    });

    const alert = AlertService.createAlert(
      '🚨 CRITICAL: Zone C Choke Point at 96%',
      'North Shrine Corridor has reached dangerous density. Automated barriers activated to prevent crush hazards.',
      'critical',
      'zone-c',
      'Redirect all approaching visitors to South Express Bypass (Route D). Announce reroute on venue PA.'
    );

    const aiRec: AIRecommendation = {
      id: `rec-${Date.now()}`,
      priority: 'CRITICAL',
      title: 'Automated Diversion: Activate Route D Bypass',
      actionMessage: 'Engage turnstile lock at Zone C. Reroute upcoming crowd to South Bypass Walkway.',
      zoneId: 'zone-c',
      impactEstimate: 'Eliminates crowd crush risk and reduces queue pressure by 55%',
      timestamp: 'Just now',
    };

    return { zones: updated, alert, aiRec };
  }

  /**
   * Scenario: Recovery
   * After rerouting and crowd dispatch, numbers normalize
   */
  static applyRecovery(zones: Zone[]): { zones: Zone[]; alert: AlertNotification } {
    const updated = zones.map(z => {
      if (z.id === 'zone-c') {
        return {
          ...z,
          currentCount: Math.round(z.capacity * 0.38),
          status: 'SAFE' as const,
          accessRestricted: false,
          entryRate: 35,
          exitRate: 40,
        };
      }
      if (z.id === 'zone-b') {
        return { ...z, currentCount: Math.round(z.capacity * 0.52), status: 'SAFE' as const };
      }
      return z;
    });

    const alert = AlertService.createAlert(
      '✓ Crowd Congestion Relieved',
      'Zone C bottleneck resolved. Density dropped to safe 38% levels. Normal access barriers reopened.',
      'info',
      'zone-c',
      'Resume standard dual-lane operation.'
    );

    return { zones: updated, alert };
  }
}
