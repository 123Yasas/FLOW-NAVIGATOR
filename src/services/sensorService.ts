import { IoTSensor, SensorStatus } from '../types';

/**
 * Sensor Service
 * Handles IoT sensor telemetry, edge offline buffering, and cloud synchronisation.
 * Prepared for real ESP32 REST/MQTT integration.
 */

export class SensorService {
  /**
   * Calculate aggregate telemetry across all deployed sensors
   */
  static getAggregateStats(sensors: IoTSensor[]) {
    const totalIn = sensors.reduce((sum, s) => sum + s.peopleIn, 0);
    const totalOut = sensors.reduce((sum, s) => sum + s.peopleOut, 0);
    const onlineCount = sensors.filter(s => s.status === 'ONLINE').length;
    const warningCount = sensors.filter(s => s.status === 'WARNING').length;
    const offlineCount = sensors.filter(s => s.status === 'OFFLINE').length;
    const totalBuffered = sensors.reduce((sum, s) => sum + (s.bufferedCount || 0), 0);

    return {
      totalIn,
      totalOut,
      netPresent: Math.max(0, totalIn - totalOut),
      onlineCount,
      warningCount,
      offlineCount,
      totalBuffered,
      healthScorePercentage: Math.round((onlineCount / Math.max(1, sensors.length)) * 100)
    };
  }

  /**
   * Simulate a live telemetry packet tick from ESP32 microcontrollers
   */
  static simulateSensorTick(sensors: IoTSensor[], isOffline: boolean = false): IoTSensor[] {
    return sensors.map(s => {
      if (s.status === 'OFFLINE' && !isOffline) return s;

      // When in offline mode, data is kept in local buffer
      const deltaIn = Math.floor(Math.random() * 4);
      const deltaOut = Math.floor(Math.random() * 3);
      const newIn = s.peopleIn + deltaIn;
      const newOut = s.peopleOut + deltaOut;
      const newCurrent = Math.max(0, s.currentCount + (deltaIn - deltaOut));

      const newBuffered = isOffline ? (s.bufferedCount || 0) + (deltaIn + deltaOut) : 0;

      return {
        ...s,
        peopleIn: newIn,
        peopleOut: newOut,
        currentCount: newCurrent,
        isEdgeBuffered: isOffline,
        bufferedCount: newBuffered,
        lastUpdated: isOffline ? 'Buffered locally' : 'Just now',
        status: isOffline ? 'WARNING' : s.status
      };
    });
  }

  /**
   * Generate initial sensor placement for a venue zone
   */
  static createDefaultSensor(id: string, zoneId: string, zoneName: string, hardwareType = 'ESP32 Dual-Laser IR Counter'): IoTSensor {
    return {
      id,
      zoneId,
      zoneName,
      peopleIn: 300,
      peopleOut: 120,
      currentCount: 180,
      status: 'ONLINE',
      batteryPercentage: 94,
      signalStrengthDbm: -58,
      lastUpdated: '1 sec ago',
      firmwareVersion: 'v2.4.2-ESP32-Edge',
      hardwareType,
      bufferedCount: 0
    };
  }
}
