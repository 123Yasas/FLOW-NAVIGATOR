import { AlertNotification, AlertSeverity } from '../types';

/**
 * Alert Service
 * Manages notification dispatch, acknowledging, resolving, and prioritizing critical warnings.
 */

export class AlertService {
  static createAlert(
    title: string,
    message: string,
    severity: AlertSeverity,
    zoneId?: string,
    recommendedAction?: string
  ): AlertNotification {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title,
      message,
      severity,
      zoneId,
      read: false,
      acknowledged: false,
      resolved: false,
      recommendedAction,
    };
  }

  static acknowledgeAlert(alerts: AlertNotification[], id: string): AlertNotification[] {
    return alerts.map(a => (a.id === id ? { ...a, acknowledged: true, read: true } : a));
  }

  static resolveAlert(alerts: AlertNotification[], id: string): AlertNotification[] {
    return alerts.map(a => (a.id === id ? { ...a, resolved: true, read: true } : a));
  }

  static getUnresolvedCriticalCount(alerts: AlertNotification[]): number {
    return alerts.filter(a => !a.resolved && (a.severity === 'critical' || a.severity === 'emergency')).length;
  }
}
