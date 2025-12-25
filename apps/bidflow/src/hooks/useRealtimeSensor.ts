/**
 * useRealtimeSensor Hook
 *
 * NOTE: This hook is temporarily disabled because the sensor_readings table
 * is not part of the BIDFLOW schema. This was likely a demo/prototype feature.
 *
 * TODO: Either implement a proper sensor_readings table or remove this hook entirely.
 */

export interface SensorReading {
  id: string;
  sensor_id: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  created_at: string;
}

/**
 * Placeholder hook that returns empty readings
 * The real-time sensor functionality is currently disabled
 */
export function useRealtimeSensor(_sensorId?: string) {
  return {
    readings: [] as SensorReading[],
    loading: false,
    error: null as Error | null,
  };
}
