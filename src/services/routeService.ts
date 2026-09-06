import { Route, Zone } from '../types';

/**
 * Route Service
 * Evaluates route congestion, updates recommendations, and produces explainable justification.
 */

export class RouteService {
  /**
   * Recalculate route metrics based on current zone statuses
   */
  static evaluateRoutes(routes: Route[], zones: Zone[], emergencyMode: boolean = false): Route[] {
    const zoneMap = new Map(zones.map(z => [z.id, z]));

    return routes.map(route => {
      // Find peak occupancy among zones in this route
      const pathZones = route.pathZones.map(id => zoneMap.get(id)).filter(Boolean) as Zone[];
      const maxOccupancy = pathZones.length > 0 
        ? Math.max(...pathZones.map(z => (z.currentCount / Math.max(1, z.capacity)) * 100))
        : route.occupancyPercentage;

      const hasRestrictedZone = pathZones.some(z => z.accessRestricted);
      const isCritical = maxOccupancy >= 90 || hasRestrictedZone;
      const isHigh = maxOccupancy >= 80;
      const isModerate = maxOccupancy >= 60;

      let status = route.status;
      let tag = route.tag;
      let color = '#22c55e'; // green
      let waitTime = Math.max(3, Math.round(route.estimatedWalkMinutes * 0.8 + (maxOccupancy > 60 ? (maxOccupancy - 50) * 0.4 : 1)));
      let explainableReason = '';

      if (emergencyMode) {
        if (route.id === 'route-d' || route.name.includes('Bypass') || route.name.includes('Exit')) {
          status = 'SAFE';
          tag = 'EVACUATION_ROUTE';
          color = '#10b981';
          waitTime = 3;
          explainableReason = 'Official emergency evacuation corridor. Clear and fully prioritized.';
        } else {
          status = 'CRITICAL';
          tag = 'AVOID';
          color = '#ef4444';
          waitTime = 99;
          explainableReason = 'Corridor closed during emergency evacuation to prevent crush bottlenecks.';
        }
      } else if (isCritical) {
        status = 'CRITICAL';
        tag = 'AVOID';
        color = '#ef4444';
        waitTime = Math.max(waitTime, 28);
        explainableReason = hasRestrictedZone
          ? 'Physical automated barrier engaged. Traffic must be redirected to alternate lanes.'
          : `High congestion detected (${Math.round(maxOccupancy)}% density). Avoid to prevent severe delays.`;
      } else if (isHigh) {
        status = 'HIGH';
        tag = 'HEAVY_TRAFFIC';
        color = '#f97316';
        waitTime = Math.max(waitTime, 18);
        explainableReason = 'Elevated crowd density. Moving slowly but currently passable.';
      } else if (isModerate) {
        status = 'MODERATE';
        tag = 'MODERATE';
        color = '#eab308';
        waitTime = Math.max(waitTime, 12);
        explainableReason = 'Moderate queue. Normal walking speed with brief checkpoints.';
      } else {
        status = 'SAFE';
        tag = 'RECOMMENDED';
        color = '#10b981';
        waitTime = Math.min(waitTime, 8);
        explainableReason = 'Optimal route with minimal queue depth and clear moving corridors.';
      }

      return {
        ...route,
        occupancyPercentage: Math.round(maxOccupancy),
        estimatedWaitMinutes: waitTime,
        status,
        tag,
        color,
        explainableReason,
      };
    });
  }

  /**
   * Sort routes to pick recommended vs alternative vs avoid for citizens
   */
  static getRecommendations(routes: Route[], destinationId?: string) {
    const candidates = destinationId 
      ? routes.filter(r => r.destinationZoneId === destinationId)
      : routes;

    const list = candidates.length > 0 ? candidates : routes;
    const sorted = [...list].sort((a, b) => a.estimatedWaitMinutes - b.estimatedWaitMinutes);

    const recommended = sorted.find(r => r.tag === 'RECOMMENDED' || r.tag === 'EVACUATION_ROUTE') || sorted[0];
    const alternatives = sorted.filter(r => r.id !== recommended?.id && r.status !== 'CRITICAL');
    const avoid = sorted.filter(r => r.status === 'CRITICAL' && r.id !== recommended?.id);

    return { recommended, alternatives, avoid };
  }
}
